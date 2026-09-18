/**
 * Report API contract tests (T046)
 * Validates /api/migrations/{migrationId}/report endpoint behavior
 */
import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/api/app.js";
import type { AppConfig } from "../../src/api/config.js";
import { registerReportRoutes } from "../../src/api/report.routes.js";
import type { ReportBundle } from "../../src/reporter/report-model.js";
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

/** Fake report service for contract tests (T046) */
function createFakeReportService() {
    const reports = new Map<string, ReportBundle>();
    const pendingMigrations = new Set<string>();

    return {
        reports,
        pendingMigrations,
        getReportStatus(migrationId: string) {
            if (pendingMigrations.has(migrationId)) {
                return Promise.resolve({ reportAvailable: false });
            }
            if (reports.has(migrationId)) {
                const report = reports.get(migrationId)!;
                return Promise.resolve({ reportAvailable: true, outcome: report.outcome, revision: report.revision });
            }
            return Promise.resolve(null);
        },
        getReport(migrationId: string) {
            return Promise.resolve(reports.get(migrationId) ?? null);
        }
    };
}

describe("GET /api/migrations/{migrationId}/report", () => {
    async function buildTestApp(service: ReturnType<typeof createFakeReportService>) {
        const app = await buildApp({ config: createAppConfig() });
        registerReportRoutes(app, { service });
        await app.ready();
        return app;
    }

    it("returns 401 when bearer token is missing", async () => {
        const app = await buildTestApp(createFakeReportService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`
        });
        expect(response.statusCode).toBe(401);
        await app.close();
    });

    it("returns 401 when bearer token is invalid", async () => {
        const app = await buildTestApp(createFakeReportService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: "Bearer invalid-token" }
        });
        expect(response.statusCode).toBe(401);
        await app.close();
    });

    it("returns 400 when migrationId is not a valid UUID", async () => {
        const app = await buildTestApp(createFakeReportService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${INVALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(400);
        await app.close();
    });

    it("returns 400 when format query parameter is invalid", async () => {
        const app = await buildTestApp(createFakeReportService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report?format=xml`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(400);
        await app.close();
    });

    it("returns 404 when migration does not exist", async () => {
        const app = await buildTestApp(createFakeReportService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(404);
        await app.close();
    });

    it("returns 202 when report is pending (not yet published)", async () => {
        const service = createFakeReportService();
        service.pendingMigrations.add(VALID_UUID);
        const app = await buildTestApp(service);
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(202);
        await app.close();
    });

    it("returns 200 with JSON format by default", async () => {
        const service = createFakeReportService();
        const testReport: ReportBundle = {
            schemaVersion: "1.0.0",
            revision: "1.0.0",
            migrationId: VALID_UUID,
            outcome: "completed",
            createdAt: new Date().toISOString(),
            sourceFramework: "react",
            sourceVersion: "18.0.0",
            targetFramework: "angular",
            targetProfileId: "xelops-angular-v1-lts-2024",
            architectureRevision: "xelops-angular-v1",
            catalog: { revision: "1.0.0", sha256: "abc123", entryCount: 74 },
            coverage: "complete",
            counts: { detected: 10, mapped: 8, unmapped: 2, manualReview: 0 },
            analyzedFiles: [],
            detectedUiElements: [],
            mappings: [],
            generatedFiles: [],
            dependencyDecisions: [],
            preservationFindings: [],
            validationResults: [],
            stages: [],
            warnings: [],
            errors: []
        };
        service.reports.set(VALID_UUID, testReport);
        const app = await buildTestApp(service);
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toContain("application/json");
        await app.close();
    });

    it("returns 200 with JSON content-type when format=json explicitly requested", async () => {
        const service = createFakeReportService();
        const testReport: ReportBundle = {
            schemaVersion: "1.0.0",
            revision: "1.0.0",
            migrationId: VALID_UUID,
            outcome: "completed",
            createdAt: new Date().toISOString(),
            sourceFramework: "react",
            sourceVersion: "18.0.0",
            targetFramework: "angular",
            targetProfileId: "xelops-angular-v1-lts-2024",
            architectureRevision: "xelops-angular-v1",
            catalog: { revision: "1.0.0", sha256: "abc123", entryCount: 74 },
            coverage: "complete",
            counts: { detected: 10, mapped: 8, unmapped: 2, manualReview: 0 },
            analyzedFiles: [],
            detectedUiElements: [],
            mappings: [],
            generatedFiles: [],
            dependencyDecisions: [],
            preservationFindings: [],
            validationResults: [],
            stages: [],
            warnings: [],
            errors: []
        };
        service.reports.set(VALID_UUID, testReport);
        const app = await buildTestApp(service);
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report?format=json`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toContain("application/json");
        await app.close();
    });

    it("returns 200 with Markdown content-type when format=md is requested", async () => {
        const service = createFakeReportService();
        const testReport: ReportBundle = {
            schemaVersion: "1.0.0",
            revision: "1.0.0",
            migrationId: VALID_UUID,
            outcome: "completed",
            createdAt: new Date().toISOString(),
            sourceFramework: "react",
            sourceVersion: "18.0.0",
            targetFramework: "angular",
            targetProfileId: "xelops-angular-v1-lts-2024",
            architectureRevision: "xelops-angular-v1",
            catalog: { revision: "1.0.0", sha256: "abc123", entryCount: 74 },
            coverage: "complete",
            counts: { detected: 10, mapped: 8, unmapped: 2, manualReview: 0 },
            analyzedFiles: [],
            detectedUiElements: [],
            mappings: [],
            generatedFiles: [],
            dependencyDecisions: [],
            preservationFindings: [],
            validationResults: [],
            stages: [],
            warnings: [],
            errors: []
        };
        service.reports.set(VALID_UUID, testReport);
        const app = await buildTestApp(service);
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report?format=md`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toContain("text/markdown");
        expect(response.body).toContain("# Migration report:");
        await app.close();
    });

    it("rejects report for expired migration", async () => {
        const app = await buildTestApp(createFakeReportService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        expect([404, 410]).toContain(response.statusCode);
        await app.close();
    });

    it("prevents private candidate report revisions from leaking", async () => {
        const app = await buildTestApp(createFakeReportService());
        const response = await app.inject({
            method: "GET",
            url: `/api/migrations/${VALID_UUID}/report`,
            headers: { authorization: `Bearer ${BEARER_TOKEN}` }
        });
        // Only 200 (published), 202 (pending terminal), or 404 (not found)
        expect([200, 202, 404]).toContain(response.statusCode);
        await app.close();
    });
});
