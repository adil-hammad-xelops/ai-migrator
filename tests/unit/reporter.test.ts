/**
 * Reporter unit tests (T047)
 * Validates reporter.ts behavior: mapped/unmapped/manual-review scenarios,
 * dependency decisions, preservation findings, and exact source traceability
 */
import { describe, it, expect } from "vitest";
import { buildReportBundle, buildEarlyFailureReport, ReportBuildError } from "../../src/reporter/reporter.js";
import { renderReportMarkdown } from "../../src/reporter/markdown-renderer.js";
import type { BuildReportInput, EarlyFailureInput } from "../../src/reporter/reporter.js";
import { randomUUID } from "node:crypto";

function createMockBuildInput(overrides?: Partial<BuildReportInput>): BuildReportInput {
    const migrationId = randomUUID();
    return {
        migrationId,
        revision: "1.0.0",
        outcome: "completed",
        createdAt: new Date().toISOString(),
        sourceFramework: "react",
        sourceVersion: "18.0.0",
        targetProfileId: "xelops-angular-v1-lts-2024",
        catalog: {
            revision: "1.0.0",
            sha256: "c4fa4aac267f51089162cb87d0087beae369fd027e4350130f83517c070a1640",
            entryCount: 74
        },
        coverage: "complete",
        analyzedFiles: [],
        detectedUiElements: [],
        mappings: [],
        generatedFiles: [],
        dependencyDecisions: [],
        preservationFindings: [],
        validationResults: [
            {
                gate: "installation",
                status: "passed",
                command: "npm ci",
                toolVersion: "10.2.3",
                exitCode: 0,
                durationMs: 1000,
                reason: null,
                diagnostics: []
            },
            {
                gate: "typescript",
                status: "passed",
                command: "tsc --noEmit",
                toolVersion: "5.9.3",
                exitCode: 0,
                durationMs: 500,
                reason: null,
                diagnostics: []
            },
            {
                gate: "angular-build",
                status: "passed",
                command: "ng build",
                toolVersion: "20.3.15",
                exitCode: 0,
                durationMs: 2000,
                reason: null,
                diagnostics: []
            },
            {
                gate: "lint",
                status: "passed",
                command: "eslint .",
                toolVersion: "9.0.0",
                exitCode: 0,
                durationMs: 800,
                reason: null,
                diagnostics: []
            },
            {
                gate: "tests",
                status: "passed",
                command: "npm test",
                toolVersion: "vitest 5.0.1",
                exitCode: 0,
                durationMs: 3000,
                reason: null,
                diagnostics: []
            },
            {
                gate: "xelops-compliance",
                status: "passed",
                command: "compliance audit",
                toolVersion: "1.0.0",
                exitCode: 0,
                durationMs: 400,
                reason: null,
                diagnostics: []
            }
        ],
        stages: [
            {
                stage: "Analyzer",
                status: "completed",
                startedAt: new Date().toISOString(),
                endedAt: new Date().toISOString(),
                reason: null
            },
            {
                stage: "Mapper",
                status: "completed",
                startedAt: new Date().toISOString(),
                endedAt: new Date().toISOString(),
                reason: null
            },
            {
                stage: "Generator",
                status: "completed",
                startedAt: new Date().toISOString(),
                endedAt: new Date().toISOString(),
                reason: null
            },
            {
                stage: "Validator",
                status: "completed",
                startedAt: new Date().toISOString(),
                endedAt: new Date().toISOString(),
                reason: null
            },
            {
                stage: "Reporter",
                status: "completed",
                startedAt: new Date().toISOString(),
                endedAt: new Date().toISOString(),
                reason: null
            },
            {
                stage: "ZIP Exporter",
                status: "completed",
                startedAt: new Date().toISOString(),
                endedAt: new Date().toISOString(),
                reason: null
            }
        ],
        warnings: [],
        errors: [],
        ...overrides
    };
}

describe("buildReportBundle", () => {
    it("builds a complete report with mapped UI elements", () => {
        const input = createMockBuildInput({
            mappings: [
                {
                    occurrenceId: "react-button-1",
                    sourceFile: "src/Button.tsx",
                    sourceElement: "Button",
                    status: "mapped",
                    reasonCode: "compatible",
                    reason: "Xelops button provides exact property/event match",
                    candidateEntryIds: ["xelops-button"],
                    targetEntryId: "xelops-button",
                    propertyTranslations: [{ sourceProperty: "onClick", targetProperty: "(click)" }],
                    eventTranslations: [],
                    preservedRequirements: [],
                    unresolvedRequirements: []
                }
            ],
            detectedUiElements: [{ id: "react-button-1", role: "button", sourceFile: "src/Button.tsx", sourceElement: "Button", line: 5 }]
        });

        const report = buildReportBundle(input);

        expect(report.schemaVersion).toBe("1.0.0");
        expect(report.outcome).toBe("completed");
        expect(report.counts.detected).toBe(1);
        expect(report.counts.mapped).toBe(1);
        expect(report.counts.unmapped).toBe(0);
        expect(report.counts.manualReview).toBe(0);
        expect(report.mappings).toHaveLength(1);
        expect(report.mappings[0]?.status).toBe("mapped");
    });

    it("tracks unmapped UI elements correctly", () => {
        const input = createMockBuildInput({
            mappings: [
                {
                    occurrenceId: "react-custom-1",
                    sourceFile: "src/Custom.tsx",
                    sourceElement: "CustomWidget",
                    status: "unmapped",
                    reasonCode: "no-compatible-candidate",
                    reason: "No catalog entry provides this component pattern",
                    candidateEntryIds: [],
                    targetEntryId: null,
                    propertyTranslations: [],
                    eventTranslations: [],
                    preservedRequirements: ["custom-logic"],
                    unresolvedRequirements: []
                }
            ],
            detectedUiElements: [{ id: "react-custom-1", role: "custom", sourceFile: "src/Custom.tsx", sourceElement: "CustomWidget", line: 10 }]
        });

        const report = buildReportBundle(input);

        expect(report.counts.unmapped).toBe(1);
        expect(report.counts.mapped).toBe(0);
        expect(report.mappings[0]?.status).toBe("unmapped");
        expect(report.mappings[0]?.targetEntryId).toBeNull();
    });

    it("tracks manual-review decisions correctly", () => {
        const input = createMockBuildInput({
            mappings: [
                {
                    occurrenceId: "react-form-1",
                    sourceFile: "src/Form.tsx",
                    sourceElement: "Form",
                    status: "manual-review",
                    reasonCode: "multiple-plausible-candidates",
                    reason: "Three candidates match with uncertain evidence",
                    candidateEntryIds: ["xelops-form", "xelops-form-advanced", "xelops-custom-form"],
                    targetEntryId: null,
                    propertyTranslations: [],
                    eventTranslations: [],
                    preservedRequirements: [],
                    unresolvedRequirements: ["custom-validators"]
                }
            ],
            detectedUiElements: [{ id: "react-form-1", role: "form", sourceFile: "src/Form.tsx", sourceElement: "Form", line: 20 }]
        });

        const report = buildReportBundle(input);

        expect(report.counts.manualReview).toBe(1);
        expect(report.mappings[0]?.status).toBe("manual-review");
        expect(report.mappings[0]?.reasonCode).toBe("multiple-plausible-candidates");
    });

    it("preserves exact source traceability in mappings", () => {
        const input = createMockBuildInput({
            mappings: [
                {
                    occurrenceId: "id-123",
                    sourceFile: "src/components/Form.tsx",
                    sourceElement: "FormInput",
                    status: "mapped",
                    reasonCode: "compatible",
                    reason: "Compatible with evidence",
                    candidateEntryIds: ["xelops-input"],
                    targetEntryId: "xelops-input",
                    propertyTranslations: [
                        { sourceProperty: "value", targetProperty: "formControl.value" },
                        { sourceProperty: "disabled", targetProperty: "formControl.disabled" }
                    ],
                    eventTranslations: [{ sourceEvent: "onChange", targetEvent: "(change)" }],
                    preservedRequirements: [],
                    unresolvedRequirements: []
                }
            ],
            detectedUiElements: [
                { id: "react-input-1", role: "input", sourceFile: "src/Form.tsx", sourceElement: "FormInput", line: 45 }
            ]
        });

        const report = buildReportBundle(input);
        const mapping = report.mappings[0];

        expect(mapping?.occurrenceId).toBe("id-123");
        expect(mapping?.sourceFile).toBe("src/components/Form.tsx");
        expect(mapping?.sourceElement).toBe("FormInput");
        expect(mapping?.targetEntryId).toBe("xelops-input");
        expect(mapping?.propertyTranslations).toHaveLength(2);
        expect(mapping?.eventTranslations).toHaveLength(1);
    });

    it("tracks dependency decisions correctly", () => {
        const input = createMockBuildInput({
            dependencyDecisions: [
                {
                    sourcePackage: "@angular/common",
                    sourceVersion: "18.0.0",
                    targetPackage: "@angular/common",
                    targetVersion: "20.3.15",
                    decision: "replaced",
                    reason: "Version upgrade to admitted profile"
                },
                {
                    sourcePackage: "react",
                    sourceVersion: "18.2.0",
                    targetPackage: null,
                    targetVersion: null,
                    decision: "removed",
                    reason: "React-only package not needed in Angular target"
                }
            ]
        });

        const report = buildReportBundle(input);

        expect(report.dependencyDecisions).toHaveLength(2);
        expect(report.dependencyDecisions[0]?.decision).toBe("replaced");
        expect(report.dependencyDecisions[1]?.decision).toBe("removed");
    });

    it("tracks preservation findings with blocking status", () => {
        const input = createMockBuildInput({
            preservationFindings: [
                {
                    behavior: "custom-state-management",
                    outcome: "manual-review",
                    blocking: true,
                    reason: "Redux usage cannot be proven stateless; manual Redux→signals conversion required",
                    sourceFiles: ["src/store.ts", "src/hooks.ts"]
                },
                {
                    behavior: "external-css-plugin",
                    outcome: "preserved",
                    blocking: false,
                    reason: "CSS plugin can be executed in build without migration",
                    sourceFiles: ["webpack.config.js"]
                }
            ]
        });

        const report = buildReportBundle(input);

        expect(report.preservationFindings).toHaveLength(2);
        expect(report.preservationFindings[0]?.blocking).toBe(true);
        expect(report.preservationFindings[1]?.blocking).toBe(false);
    });

    it("enforces exactly six validation gates in order", () => {
        const validGates: ("installation" | "typescript" | "angular-build" | "lint" | "tests" | "xelops-compliance")[] = [
            "installation",
            "typescript",
            "angular-build",
            "lint",
            "tests",
            "xelops-compliance"
        ];

        const input = createMockBuildInput({
            validationResults: validGates.map((gate, i) => ({
                gate: gate as any,
                status: "passed" as const,
                command: `cmd ${i}`,
                toolVersion: "1.0.0",
                exitCode: 0,
                durationMs: 100,
                reason: null,
                diagnostics: []
            }))
        });

        const report = buildReportBundle(input);

        expect(report.validationResults).toHaveLength(6);
        expect(report.validationResults.map((r) => r.gate)).toEqual(validGates);
    });

    it("rejects report with missing validation gate", () => {
        const input = createMockBuildInput({
            validationResults: [
                {
                    gate: "installation",
                    status: "passed",
                    command: "npm ci",
                    toolVersion: "10.0.0",
                    exitCode: 0,
                    durationMs: 100,
                    reason: null,
                    diagnostics: []
                }
                // Only one gate, missing 5 others
            ] as any
        });

        expect(() => buildReportBundle(input)).toThrow(ReportBuildError);
    });

    it("rejects report with duplicate validation gate", () => {
        const input = createMockBuildInput({
            validationResults: [
                {
                    gate: "installation",
                    status: "passed",
                    command: "npm ci",
                    toolVersion: "10.0.0",
                    exitCode: 0,
                    durationMs: 100,
                    reason: null,
                    diagnostics: []
                },
                {
                    gate: "installation",
                    status: "passed",
                    command: "npm ci",
                    toolVersion: "10.0.0",
                    exitCode: 0,
                    durationMs: 100,
                    reason: null,
                    diagnostics: []
                }
                // Duplicate installation gate
            ] as any
        });

        expect(() => buildReportBundle(input)).toThrow(ReportBuildError);
    });

    it("rejects report with mismatched UI element count", () => {
        const input = createMockBuildInput({
            mappings: [
                {
                    occurrenceId: "id-1",
                    sourceFile: "src/A.tsx",
                    sourceElement: "A",
                    status: "mapped",
                    reasonCode: "compatible",
                    reason: "test",
                    candidateEntryIds: [],
                    targetEntryId: null,
                    propertyTranslations: [],
                    eventTranslations: [],
                    preservedRequirements: [],
                    unresolvedRequirements: []
                }
            ],
            detectedUiElements: [
                { id: "elem-1", role: "div", sourceFile: "src/A.tsx", sourceElement: "A", line: 1 },
                { id: "elem-2", role: "div", sourceFile: "src/B.tsx", sourceElement: "B", line: 2 }
            ]
            // 1 mapping but 2 elements
        });

        expect(() => buildReportBundle(input)).toThrow(ReportBuildError);
    });

    it("accepts zero-mapping reports (no UI detected)", () => {
        const input = createMockBuildInput({
            mappings: [],
            detectedUiElements: [],
            coverage: "complete"
        });

        const report = buildReportBundle(input);

        expect(report.counts.detected).toBe(0);
        expect(report.mappings).toHaveLength(0);
        expect(report.coverage).toBe("complete");
    });
});

describe("buildEarlyFailureReport", () => {
    it("builds failure report for analyzer stage", () => {
        const input: EarlyFailureInput = {
            migrationId: randomUUID(),
            createdAt: new Date().toISOString(),
            failedStage: "Analyzer",
            reason: "Corrupt ZIP structure",
            errors: [
                {
                    code: "CORRUPT_ARCHIVE",
                    severity: "error",
                    message: "ZIP header invalid",
                    sourceFiles: []
                }
            ],
            catalog: {
                revision: "1.0.0",
                sha256: "c4fa4aac267f51089162cb87d0087beae369fd027e4350130f83517c070a1640",
                entryCount: 74
            }
        };

        const report = buildEarlyFailureReport(input);

        expect(report.outcome).toBe("failed");
        expect(report.sourceFramework).toBe("unknown");
        expect(report.coverage).toBe("unknown");
        expect(report.errors).toHaveLength(1);
        expect(report.stages.filter((s) => s.status === "completed")).toHaveLength(1); // Reporter always completed
        expect(report.stages.filter((s) => s.status === "failed")).toHaveLength(1); // The failed stage
        expect(report.stages.filter((s) => s.status === "skipped")).toHaveLength(4); // Remaining stages skipped
    });

    it("skips all validation gates for early failure", () => {
        const input: EarlyFailureInput = {
            migrationId: randomUUID(),
            createdAt: new Date().toISOString(),
            failedStage: "Generator",
            reason: "Mapping produced no compatible candidates",
            errors: [],
            catalog: {
                revision: "1.0.0",
                sha256: "c4fa4aac267f51089162cb87d0087beae369fd027e4350130f83517c070a1640",
                entryCount: 74
            }
        };

        const report = buildEarlyFailureReport(input);

        expect(report.validationResults.every((r) => r.status === "skipped")).toBe(true);
    });

    it("preserves source framework and version for mid-pipeline failures", () => {
        const input: EarlyFailureInput = {
            migrationId: randomUUID(),
            createdAt: new Date().toISOString(),
            failedStage: "Mapper",
            reason: "Import graph analysis failed",
            errors: [],
            sourceFramework: "react",
            sourceVersion: "18.2.0",
            catalog: {
                revision: "1.0.0",
                sha256: "c4fa4aac267f51089162cb87d0087beae369fd027e4350130f83517c070a1640",
                entryCount: 74
            }
        };

        const report = buildEarlyFailureReport(input);

        expect(report.sourceFramework).toBe("react");
        expect(report.sourceVersion).toBe("18.2.0");
    });
});

describe("Report JSON and Markdown consistency", () => {
    it("renders identical counts across JSON and Markdown", () => {
        const input = createMockBuildInput({
            mappings: [
                {
                    occurrenceId: "id-1",
                    sourceFile: "src/A.tsx",
                    sourceElement: "A",
                    status: "mapped",
                    reasonCode: "compatible",
                    reason: "test",
                    candidateEntryIds: [],
                    targetEntryId: "xelops-a",
                    propertyTranslations: [],
                    eventTranslations: [],
                    preservedRequirements: [],
                    unresolvedRequirements: []
                },
                {
                    occurrenceId: "id-2",
                    sourceFile: "src/B.tsx",
                    sourceElement: "B",
                    status: "unmapped",
                    reasonCode: "no-compatible-candidate",
                    reason: "test",
                    candidateEntryIds: [],
                    targetEntryId: null,
                    propertyTranslations: [],
                    eventTranslations: [],
                    preservedRequirements: [],
                    unresolvedRequirements: []
                }
            ],
            detectedUiElements: [
                { id: "elem-1", role: "div", sourceFile: "src/A.tsx", sourceElement: "A", line: 1 },
                { id: "elem-2", role: "div", sourceFile: "src/B.tsx", sourceElement: "B", line: 2 }
            ]
        });

        const report = buildReportBundle(input);
        const markdown = renderReportMarkdown(report);

        expect(markdown).toContain("| 2 | 1 | 1 | 0 |");
    });

    it("escapes untrusted source text in Markdown", () => {
        const input = createMockBuildInput({
            mappings: [
                {
                    occurrenceId: "id-1",
                    sourceFile: "src/Malicious.tsx",
                    sourceElement: "Component<script>alert('xss')</script>",
                    status: "unmapped",
                    reasonCode: "no-compatible-candidate",
                    reason: "HTML injection test: <img src=x onerror=alert('xss')>",
                    candidateEntryIds: [],
                    targetEntryId: null,
                    propertyTranslations: [],
                    eventTranslations: [],
                    preservedRequirements: [],
                    unresolvedRequirements: []
                }
            ],
            detectedUiElements: [{ id: "malicious-1", role: "div", sourceFile: "src/Malicious.tsx", sourceElement: "Malicious", line: 1 }]
        });

        const report = buildReportBundle(input);
        const markdown = renderReportMarkdown(report);

        // Should be escaped, not execute
        expect(markdown).not.toContain("<script>");
        expect(markdown).toContain("Component&lt;script&gt;");
        // Verify reason is escaped: the img tag with onerror should be escaped
        expect(markdown).toContain("&lt;img src=x onerror=alert");
    });
});
