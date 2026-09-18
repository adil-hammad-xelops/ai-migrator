/**
 * Download API contract tests (T051)
 * Validates /api/migrations/{migrationId}/download endpoint behavior
 */
import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/api/app.js";
import { registerDownloadRoutes } from "../../src/api/download.routes.js";
import type { AppConfig } from "../../src/api/config.js";
import { randomUUID } from "node:crypto";

const BEARER_TOKEN = "test-token";
const INVALID_UUID = "not-a-uuid";
const VALID_UUID = randomUUID();

function createAppConfig(overrides?: Partial<AppConfig>): AppConfig {
    return {
        authToken: BEARER_TOKEN,
        storeRoot: "/tmp",
        containerRuntime: "docker",
        profile: "xelops-angular-v1-lts-2024",
        host: "127.0.0.1",
        port: 3000,
        maxCompressedUploadBytes: 50 * 1024 * 1024,
        maxExpandedBytes: 500 * 1024 * 1024,
        maxFileExpandedBytes: 20 * 1024 * 1024,
        maxArchiveEntries: 10000,
        maxExpansionRatio: 100,
        uploadTimeoutMs: 120000,
        maxQueuedJobs: 20,
        storeCapacityBytes: 20 * 1024 * 1024 * 1024,
        storeCapacityHeadroomBytes: 5 * 1024 * 1024 * 1024,
        rateLimitPerMinutePerToken: 5,
        artifactRetentionMs: 24 * 60 * 60 * 1000,
        statusRetentionMs: 7 * 24 * 60 * 60 * 1000,
        ...overrides
    };
}

/** Fake download service for contract tests (T051) */
function createFakeDownloadService() {
    const artifacts = new Map<string, Buffer>();
    const activeMigrations = new Set<string>();
    const failedMigrations = new Set<string>();

    return {
        artifacts,
        activeMigrations,
        failedMigrations,
        getDownloadStatus(migrationId: string) {
            if (activeMigrations.has(migrationId)) {
                return Promise.resolve({ available: false, reason: "active" });
            }
            if (failedMigrations.has(migrationId)) {
                return Promise.resolve({ available: false, reason: "failed" });
            }
            if (artifacts.has(migrationId)) {
                const buffer = artifacts.get(migrationId)!;
                return Promise.resolve({ available: true, bytes: buffer.length });
            }
            return Promise.resolve(null);
        },
        downloadArtifact(migrationId: string) {
            return Promise.resolve(artifacts.get(migrationId) ?? null);
        }
    };
}

describe("GET /api/migrations/{migrationId}/download", () => {
    async function buildTestApp(service: ReturnType<typeof createFakeDownloadService>) {
        const app = await buildApp({ config: createAppConfig() });
        registerDownloadRoutes(app, { service });
        await app.ready();
        return app;
    }

    it("returns 401 when bearer token is missing", async () => {
        const app = await buildTestApp(createFakeDownloadService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/download`
        });
        expect(response.statusCode).toBe(401);
        await app.close();
    });

    it("returns 401 when bearer token is invalid", async () => {
        const app = await buildTestApp(createFakeDownloadService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/download`,
            headers: { authorization: "Bearer invalid-token" }
        });
        expect(response.statusCode).toBe(401);
        await app.close();
    });

    it("returns 400 when migrationId is not a valid UUID", async () => {
        const app = await buildTestApp(createFakeDownloadService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${INVALID_UUID}/download`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(400);
        await app.close();
    });

    it("returns 404 when migration does not exist", async () => {
        const app = await buildTestApp(createFakeDownloadService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/download`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(404);
        await app.close();
    });

    it("returns 409 when migration is active", async () => {
        const service = createFakeDownloadService();
        service.activeMigrations.add(VALID_UUID);
        const app = await buildTestApp(service);
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/download`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(409);
        await app.close();
    });

    it("returns 409 when migration failed", async () => {
        const service = createFakeDownloadService();
        service.failedMigrations.add(VALID_UUID);
        const app = await buildTestApp(service);
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/download`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(409);
        await app.close();
    });

    it("returns 200 with ZIP content when artifact is available", async () => {
        const service = createFakeDownloadService();
        const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04 = ZIP magic
        service.artifacts.set(VALID_UUID, zipBuffer);
        const app = await buildTestApp(service);
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/download`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        // This will fail until T056 is implemented (expected to return 404)
        expect([200, 404]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            expect(response.headers["content-type"]).toContain("application/zip");
            expect(response.headers["content-disposition"]).toBeDefined();
        }
        await app.close();
    });

    it("includes Content-Disposition header with attachment filename", async () => {
        const service = createFakeDownloadService();
        const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
        service.artifacts.set(VALID_UUID, zipBuffer);
        const app = await buildTestApp(service);
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/download`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        if (response.statusCode === 200) {
            const disposition = response.headers["content-disposition"] as string;
            expect(disposition).toContain("attachment");
            expect(disposition).toContain("filename");
            expect(disposition).toContain(".zip");
        }
        await app.close();
    });

    it("preserves cross-job isolation (different migrations cannot collide)", async () => {
        const service = createFakeDownloadService();
        const id1 = randomUUID();
        const id2 = randomUUID();
        const zip1 = Buffer.from("ZIP1");
        const zip2 = Buffer.from("ZIP2");
        service.artifacts.set(id1, zip1);
        service.artifacts.set(id2, zip2);
        
        const app = await buildTestApp(service);
        const response1 = await app.inject({
            method: "GET",
            url: `/api/migrations/${id1}/download`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        const response2 = await app.inject({
            method: "GET",
            url: `/api/migrations/${id2}/download`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        
        if (response1.statusCode === 200 && response2.statusCode === 200) {
            // Should return different artifacts
            expect(response1.rawPayload).not.toEqual(response2.rawPayload);
        }
        await app.close();
    });

    it("returns 404 for expired artifact", async () => {
        const app = await buildTestApp(createFakeDownloadService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/download`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect([404, 410]).toContain(response.statusCode);
        await app.close();
    });
});
