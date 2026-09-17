/**
 * Reporter-owned report model (data-model.md § ReportBundle; contracts/openapi.json § Report).
 * One record renders both migration-report.json and migration-report.md (T049).
 * Report contents intentionally never embed the enclosing ZIP checksum (see pipeline.md).
 */
import type { AnalyzerFinding, SourceFile } from "../analyzer/models.js";
import type { MappingDecision } from "../mapper/models.js";
import type { GeneratedFile, DependencyDecision, PreservationFinding } from "../generator/models.js";
import type { ValidationResult } from "../validator/models.js";

export type ReportOutcome = "completed" | "failed";
export type ReportSourceFramework = "react" | "angular" | "unknown" | "mixed";
export type ReportCoverage = "complete" | "partial" | "unknown";

export type Stage =
    | "Analyzer"
    | "Mapper"
    | "Generator"
    | "Validator"
    | "Reporter"
    | "ZIP Exporter";

export type StageStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface StageOutcome {
    readonly stage: Stage;
    readonly status: StageStatus;
    readonly startedAt: string | null;
    readonly endedAt: string | null;
    readonly reason: string | null;
}

export interface ReportCounts {
    readonly detected: number;
    readonly mapped: number;
    readonly unmapped: number;
    readonly manualReview: number;
}

export interface ReportElement {
    readonly id: string;
    readonly sourceFile: string;
    readonly sourceElement: string;
    readonly line: number | null;
    readonly role: string;
}

export interface ReportCatalogReference {
    readonly revision: string;
    readonly sha256: string;
    readonly entryCount: number;
}

/** The single typed report record; JSON and Markdown renderers both read only this. */
export interface ReportBundle {
    readonly schemaVersion: "1.0.0";
    readonly revision: string;
    readonly migrationId: string;
    readonly outcome: ReportOutcome;
    readonly createdAt: string;
    readonly sourceFramework: ReportSourceFramework;
    readonly sourceVersion: string | null;
    readonly targetFramework: "angular";
    readonly targetProfileId: string | null;
    readonly architectureRevision: "xelops-angular-v1";
    readonly catalog: ReportCatalogReference;
    readonly coverage: ReportCoverage;
    readonly counts: ReportCounts;
    readonly analyzedFiles: readonly SourceFile[];
    readonly detectedUiElements: readonly ReportElement[];
    readonly mappings: readonly MappingDecision[];
    readonly generatedFiles: readonly GeneratedFile[];
    readonly dependencyDecisions: readonly DependencyDecision[];
    readonly preservationFindings: readonly PreservationFinding[];
    /** Always exactly six entries, one per validator gate, order preserved. */
    readonly validationResults: readonly ValidationResult[];
    readonly stages: readonly StageOutcome[];
    readonly warnings: readonly AnalyzerFinding[];
    readonly errors: readonly AnalyzerFinding[];
}
