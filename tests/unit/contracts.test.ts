import { describe, expect, it } from "vitest";
import { decodeJobReceipt, DecodeError } from "../../src/api/contract-decoders.js";
import { decodeReportBundle, ReportDecodeError } from "../../src/reporter/report-decoders.js";
import type { JobReceipt } from "../../src/api/contracts.js";
import type { ReportBundle } from "../../src/reporter/report-model.js";

const NIL_ARTIFACT = { available: false, url: null, sha256: null, bytes: null, expiresAt: null };

function validReceipt(): JobReceipt {
    return {
        migrationId: "550e8400-e29b-41d4-a716-446655440000",
        schemaVersion: "1.0.0",
        state: "accepted",
        createdAt: "2026-09-17T00:00:00.000Z",
        updatedAt: "2026-09-17T00:00:00.000Z",
        currentStage: null,
        stages: [],
        catalogRevision: null,
        targetProfileId: null,
        publishedRevision: null,
        counts: { detected: 0, mapped: 0, unmapped: 0, manualReview: 0 },
        coverage: "unknown",
        finalArtifact: NIL_ARTIFACT,
        diagnosticArtifact: NIL_ARTIFACT,
        warnings: [],
        errors: [],
        expiresAt: "2026-09-24T00:00:00.000Z"
    };
}

describe("decodeJobReceipt", () => {
    it("accepts a well-formed receipt", () => {
        expect(decodeJobReceipt(validReceipt())).toStrictEqual(validReceipt());
    });

    it("rejects malformed JSON shapes (not an object)", () => {
        expect(() => decodeJobReceipt("not-an-object")).toThrow(DecodeError);
        expect(() => decodeJobReceipt(null)).toThrow(DecodeError);
        expect(() => decodeJobReceipt([])).toThrow(DecodeError);
    });

    it("rejects an unexpected extra property (no embedded checksum smuggling)", () => {
        expect(() => decodeJobReceipt({ ...validReceipt(), zipSha256: "leak" })).toThrow(DecodeError);
    });

    it("rejects a non-UUID migrationId", () => {
        expect(() => decodeJobReceipt({ ...validReceipt(), migrationId: "not-a-uuid" })).toThrow(DecodeError);
    });

    it("rejects negative counts", () => {
        expect(() =>
            decodeJobReceipt({ ...validReceipt(), counts: { detected: -1, mapped: 0, unmapped: 0, manualReview: 0 } })
        ).toThrow(DecodeError);
    });

    it("rejects counts that do not reconcile", () => {
        expect(() =>
            decodeJobReceipt({ ...validReceipt(), counts: { detected: 5, mapped: 1, unmapped: 1, manualReview: 1 } })
        ).toThrow(DecodeError);
    });

    it("requires a published revision for completed jobs", () => {
        expect(() => decodeJobReceipt({ ...validReceipt(), state: "completed" })).toThrow(DecodeError);
    });
});

function validReport(): ReportBundle {
    return {
        schemaVersion: "1.0.0",
        revision: "rev-1",
        migrationId: "550e8400-e29b-41d4-a716-446655440000",
        outcome: "failed",
        createdAt: "2026-09-17T00:00:00.000Z",
        sourceFramework: "unknown",
        sourceVersion: null,
        targetFramework: "angular",
        targetProfileId: null,
        architectureRevision: "xelops-angular-v1",
        catalog: { revision: "abc", sha256: "c4fa4aac267f51089162cb87d0087beae369fd027e4350130f83517c070a1640", entryCount: 74 },
        coverage: "unknown",
        counts: { detected: 0, mapped: 0, unmapped: 0, manualReview: 0 },
        analyzedFiles: [],
        detectedUiElements: [],
        mappings: [],
        generatedFiles: [],
        dependencyDecisions: [],
        preservationFindings: [],
        validationResults: (
            ["installation", "typescript", "angular-build", "lint", "tests", "xelops-compliance"] as const
        ).map((gate) => ({
            gate,
            status: "skipped" as const,
            command: null,
            toolVersion: null,
            exitCode: null,
            durationMs: null,
            reason: "not run",
            diagnostics: []
        })),
        stages: (["Analyzer", "Mapper", "Generator", "Validator", "Reporter", "ZIP Exporter"] as const).map((stage) => ({
            stage,
            status: stage === "Reporter" ? ("completed" as const) : ("skipped" as const),
            startedAt: null,
            endedAt: null,
            reason: stage === "Reporter" ? null : "not run"
        })),
        warnings: [],
        errors: []
    };
}

describe("decodeReportBundle", () => {
    it("accepts a well-formed report", () => {
        expect(decodeReportBundle(validReport())).toStrictEqual(validReport());
    });

    it("rejects a report missing a validation gate (must be exactly six)", () => {
        const report = validReport();
        expect(() =>
            decodeReportBundle({ ...report, validationResults: report.validationResults.slice(0, 5) })
        ).toThrow(ReportDecodeError);
    });

    it("rejects a report with a duplicated stage outcome", () => {
        const report = validReport();
        expect(() =>
            decodeReportBundle({ ...report, stages: [...report.stages, report.stages[0]] })
        ).toThrow(ReportDecodeError);
    });

    it("rejects an embedded ZIP checksum field (additionalProperties: false)", () => {
        const report = validReport();
        expect(() => decodeReportBundle({ ...report, artifactSha256: "should-not-exist" })).toThrow(ReportDecodeError);
    });

    it("rejects mappings whose per-status tally does not reconcile with counts", () => {
        const report = validReport();
        expect(() =>
            decodeReportBundle({
                ...report,
                counts: { detected: 1, mapped: 1, unmapped: 0, manualReview: 0 },
                detectedUiElements: [{ id: "e1", sourceFile: "src/App.tsx", sourceElement: "button", line: 1, role: "button" }],
                mappings: [
                    {
                        occurrenceId: "e1",
                        sourceFile: "src/App.tsx",
                        sourceElement: "button",
                        status: "unmapped",
                        reasonCode: "NO_CANDIDATE",
                        reason: "no compatible candidate",
                        candidateEntryIds: [],
                        targetEntryId: null,
                        propertyTranslations: [],
                        eventTranslations: [],
                        preservedRequirements: [],
                        unresolvedRequirements: []
                    }
                ]
            })
        ).toThrow(ReportDecodeError);
    });

    it("rejects an absolute path where a source-relative path is required", () => {
        const report = validReport();
        expect(() =>
            decodeReportBundle({
                ...report,
                analyzedFiles: [{ path: "/etc/passwd", sha256: "a".repeat(64), sizeBytes: 1, disposition: "analyzed", reason: null, roles: [] }]
            })
        ).toThrow(ReportDecodeError);
    });
});
