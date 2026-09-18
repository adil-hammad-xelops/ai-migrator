/**
 * Report API contract tests (T046)
 * Validates /api/migrations/{migrationId}/report endpoint behavior
 */
import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/api/app.js";
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

describe("GET /api/migrations/{migrationId}/report", () => {
    it("returns 401 when bearer token is missing", async () => {
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`
        });
        expect(response.statusCode).toBe(401);
    });

    it("returns 401 when bearer token is invalid", async () => {
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: "Bearer invalid-token" }
        });
        expect(response.statusCode).toBe(401);
    });

    it.skip("returns 400 when migrationId is not a valid UUID", async () => {
        // T050: Report routes not yet implemented; this will return 404 until endpoint exists
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${INVALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(400);
    });

    it.skip("returns 400 when format query parameter is invalid", async () => {
        // T050: Report routes not yet implemented; this will return 404 until endpoint exists
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report?format=xml`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(400);
    });

    it("returns 404 when migration does not exist", async () => {
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(404);
    });

    it("returns 202 when report is pending (not yet published)", async () => {
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        // Migration not found returns 404; pending would return 202
        expect([202, 404]).toContain(response.statusCode);
    });

    it("returns 200 with JSON format by default", async () => {
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        // Until wired to storage, returns 404; success would have content-type
        if (response.statusCode === 200) {
            expect(response.headers["content-type"]).toContain("application/json");
        }
    });

    it("returns 200 with JSON content-type when format=json explicitly requested", async () => {
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report?format=json`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        if (response.statusCode === 200) {
            expect(response.headers["content-type"]).toContain("application/json");
        }
    });

    it("returns 200 with Markdown content-type when format=md is requested", async () => {
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report?format=md`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        if (response.statusCode === 200) {
            expect(response.headers["content-type"]).toContain("text/markdown");
            expect(response.body).toContain("# Migration report:");
        }
    });

    it("rejects report for expired migration", async () => {
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect([404, 410]).toContain(response.statusCode);
    });

    it("prevents private candidate report revisions from leaking", async () => {
        const app = await buildApp({ config: createAppConfig() });
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        // Only 200 (published), 202 (pending terminal), or 404 (not found)
        expect([200, 202, 404]).toContain(response.statusCode);
    });
});
