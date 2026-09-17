import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/api/app.js";
import type { AppConfig } from "../../src/api/config.js";
// NOTE: migration.routes.ts does not exist yet (T044). This import intentionally fails
// today (TDD red); do not stub/mock the route module itself to make this pass early.
// @ts-expect-error -- module does not exist until T044
import { registerMigrationRoutes } from "../../src/api/migration.routes.js";

function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
    return {
        authToken: "test-token",
        storeRoot: "/tmp/migration-api-test",
        containerRuntime: "docker",
        profile: "angular20",
        host: "127.0.0.1",
        port: 0,
        maxCompressedUploadBytes: 1000,
        maxExpandedBytes: 1000,
        maxFileExpandedBytes: 1000,
        maxArchiveEntries: 100,
        maxExpansionRatio: 100,
        uploadTimeoutMs: 5000,
        maxQueuedJobs: 20,
        storeCapacityBytes: 10_000_000,
        storeCapacityHeadroomBytes: 1000,
        rateLimitPerMinutePerToken: 5,
        artifactRetentionMs: 86_400_000,
        statusRetentionMs: 604_800_000,
        ...overrides
    };
}

interface FakeAcceptedJob {
    readonly migrationId: string;
    state: "accepted" | "running" | "completed" | "failed";
}

/** Local fake standing in for src/api/migration-service.ts (T043), per constitution:
 * injected fakes for contract tests, real integration is exercised in T064. */
function createFakeService() {
    const jobs = new Map<string, FakeAcceptedJob>();
    let nextId = 0;
    return {
        jobs,
        submit(): Promise<{ migrationId: string }> {
            nextId += 1;
            const migrationId = `00000000-0000-4000-8000-${String(nextId).padStart(12, "0")}`;
            jobs.set(migrationId, { migrationId, state: "accepted" });
            return Promise.resolve({ migrationId });
        },
        getStatus(migrationId: string): Promise<FakeAcceptedJob | null> {
            return Promise.resolve(jobs.get(migrationId) ?? null);
        }
    };
}

async function buildTestApp(service: ReturnType<typeof createFakeService>) {
    const app = await buildApp({ config: testConfig() });
    const asAny = registerMigrationRoutes as unknown;
    if (typeof asAny !== "function") {
        throw new TypeError("registerMigrationRoutes is not implemented yet (T044)");
    }
    (asAny as (app: unknown, deps: { service: unknown }) => void)(app, { service });
    await app.ready();
    return app;
}

const AUTH = { authorization: "Bearer test-token" };

describe("POST /api/migrations (contract, TDD red until T044)", () => {
    it("durably accepts a project and returns 202 with a Location header", async () => {
        const app = await buildTestApp(createFakeService());
        const response = await app.inject({
            method: "POST",
            url: "/api/migrations",
            headers: AUTH,
            payload: Buffer.from("PK\x03\x04fake-zip-bytes")
        });
        expect(response.statusCode).toBe(202);
        expect(response.headers.location).toBeDefined();
        const body: unknown = response.json();
        expect(body).toMatchObject({ state: "accepted" });
        await app.close();
    });

    it("issues a distinct migrationId per accepted request", async () => {
        const app = await buildTestApp(createFakeService());
        const first = await app.inject({ method: "POST", url: "/api/migrations", headers: AUTH, payload: "a" });
        const second = await app.inject({ method: "POST", url: "/api/migrations", headers: AUTH, payload: "b" });
        const firstId = first.json<{ migrationId: string }>().migrationId;
        const secondId = second.json<{ migrationId: string }>().migrationId;
        expect(firstId).not.toBe(secondId);
        await app.close();
    });

    it("rejects requests without a bearer token with 401", async () => {
        const app = await buildTestApp(createFakeService());
        const response = await app.inject({ method: "POST", url: "/api/migrations", payload: "x" });
        expect(response.statusCode).toBe(401);
        await app.close();
    });

    it("rejects an oversized upload with 413", async () => {
        const app = await buildTestApp(createFakeService());
        const response = await app.inject({
            method: "POST",
            url: "/api/migrations",
            headers: AUTH,
            payload: Buffer.alloc(5000, 1)
        });
        expect(response.statusCode).toBe(413);
        await app.close();
    });

    it("rejects an unsupported media type with 415", async () => {
        const app = await buildTestApp(createFakeService());
        const response = await app.inject({
            method: "POST",
            url: "/api/migrations",
            headers: { ...AUTH, "content-type": "application/xml" },
            payload: "<xml/>"
        });
        expect(response.statusCode).toBe(415);
        await app.close();
    });

    it("rejects submission-rate abuse with 429", async () => {
        const app = await buildTestApp(createFakeService());
        const responses = [];
        for (let i = 0; i < 6; i += 1) {
            responses.push(await app.inject({ method: "POST", url: "/api/migrations", headers: AUTH, payload: "x" }));
        }
        expect(responses.some((r) => r.statusCode === 429)).toBe(true);
        await app.close();
    });
});

describe("GET /api/migrations/:id (contract, TDD red until T044)", () => {
    it("returns a pending status for an accepted job", async () => {
        const service = createFakeService();
        const app = await buildTestApp(service);
        const submitResponse = await app.inject({ method: "POST", url: "/api/migrations", headers: AUTH, payload: "x" });
        const { migrationId } = submitResponse.json<{ migrationId: string }>();

        const statusResponse = await app.inject({
            method: "GET",
            url: `/api/migrations/${migrationId}`,
            headers: AUTH
        });
        expect(statusResponse.statusCode).toBe(200);
        expect(statusResponse.json()).toMatchObject({ state: "accepted", reportAvailable: false });
        await app.close();
    });

    it("returns 404 for an unknown migration", async () => {
        const app = await buildTestApp(createFakeService());
        const response = await app.inject({
            method: "GET",
            url: "/api/migrations/00000000-0000-4000-8000-000000000000",
            headers: AUTH
        });
        expect(response.statusCode).toBe(404);
        await app.close();
    });

    it("isolates status lookups across different accepted jobs", async () => {
        const service = createFakeService();
        const app = await buildTestApp(service);
        const firstSubmit = await app.inject({ method: "POST", url: "/api/migrations", headers: AUTH, payload: "a" });
        const first = firstSubmit.json<{ migrationId: string }>().migrationId;
        const secondSubmit = await app.inject({ method: "POST", url: "/api/migrations", headers: AUTH, payload: "b" });
        const second = secondSubmit.json<{ migrationId: string }>().migrationId;

        const firstStatus = await app.inject({ method: "GET", url: `/api/migrations/${first}`, headers: AUTH });
        const secondStatus = await app.inject({ method: "GET", url: `/api/migrations/${second}`, headers: AUTH });
        expect(firstStatus.json<{ migrationId: string }>().migrationId).toBe(first);
        expect(secondStatus.json<{ migrationId: string }>().migrationId).toBe(second);
        await app.close();
    });
});
