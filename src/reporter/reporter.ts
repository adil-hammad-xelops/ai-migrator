/**
 * Builds the single typed ReportBundle record (T016/T048). JSON and Markdown are both
 * rendered from exactly this record; nothing is invented that stage outputs did not
 * provide, and unknown framework/coverage is preserved as "unknown" rather than guessed.
 */
import { randomUUID } from "node:crypto";
import type {
    ReportBundle,
    ReportOutcome,
    ReportSourceFramework,
    ReportCoverage,
    ReportCounts,
    ReportElement,
    ReportCatalogReference,
    Stage,
    StageOutcome
} from "./report-model.js";
import type { SourceFile, AnalyzerFinding } from "../analyzer/models.js";
import type { MappingDecision } from "../mapper/models.js";
import type { GeneratedFile, DependencyDecision, PreservationFinding } from "../generator/models.js";
import type { ValidationResult, ValidationGate } from "../validator/models.js";
import { VALIDATION_GATES } from "../validator/models.js";

export class ReportBuildError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ReportBuildError";
    }
}

const STAGE_ORDER: readonly Stage[] = [
    "Analyzer",
    "Mapper",
    "Generator",
    "Validator",
    "Reporter",
    "ZIP Exporter"
];

export interface BuildReportInput {
    readonly migrationId: string;
    readonly revision: string;
    readonly outcome: ReportOutcome;
    readonly createdAt: string;
    readonly sourceFramework: ReportSourceFramework;
    readonly sourceVersion: string | null;
    readonly targetProfileId: string | null;
    readonly catalog: ReportCatalogReference;
    readonly coverage: ReportCoverage;
    readonly analyzedFiles: readonly SourceFile[];
    readonly detectedUiElements: readonly ReportElement[];
    readonly mappings: readonly MappingDecision[];
    readonly generatedFiles: readonly GeneratedFile[];
    readonly dependencyDecisions: readonly DependencyDecision[];
    readonly preservationFindings: readonly PreservationFinding[];
    /** Must contain exactly the six gates in `VALIDATION_GATES` order. */
    readonly validationResults: readonly ValidationResult[];
    /** Must contain exactly the six stages in `STAGE_ORDER`, each exactly once. */
    readonly stages: readonly StageOutcome[];
    readonly warnings: readonly AnalyzerFinding[];
    readonly errors: readonly AnalyzerFinding[];
}

function computeCounts(mappings: readonly MappingDecision[]): ReportCounts {
    let mapped = 0;
    let unmapped = 0;
    let manualReview = 0;
    for (const mapping of mappings) {
        if (mapping.status === "mapped") mapped += 1;
        else if (mapping.status === "unmapped") unmapped += 1;
        else manualReview += 1;
    }
    return { detected: mappings.length, mapped, unmapped, manualReview };
}

function assertCompleteStageOutcomes(stages: readonly StageOutcome[]): void {
    const seen = new Set<Stage>();
    for (const outcome of stages) {
        if (seen.has(outcome.stage)) {
            throw new ReportBuildError(`duplicate stage outcome for "${outcome.stage}"`);
        }
        seen.add(outcome.stage);
    }
    for (const stage of STAGE_ORDER) {
        if (!seen.has(stage)) {
            throw new ReportBuildError(`missing stage outcome for "${stage}"`);
        }
    }
}

function assertCompleteValidationResults(results: readonly ValidationResult[]): void {
    if (results.length !== 6) {
        throw new ReportBuildError(`expected exactly six validation results, got ${String(results.length)}`);
    }
    const seen = new Set<ValidationGate>();
    for (const result of results) {
        if (seen.has(result.gate)) {
            throw new ReportBuildError(`duplicate validation gate "${result.gate}"`);
        }
        seen.add(result.gate);
    }
    for (const gate of VALIDATION_GATES) {
        if (!seen.has(gate)) {
            throw new ReportBuildError(`missing validation gate "${gate}"`);
        }
    }
}

/** Assembles the one authoritative ReportBundle. Throws on internal invariant violations. */
export function buildReportBundle(input: BuildReportInput): ReportBundle {
    assertCompleteStageOutcomes(input.stages);
    assertCompleteValidationResults(input.validationResults);
    const counts = computeCounts(input.mappings);
    if (input.detectedUiElements.length !== counts.detected) {
        throw new ReportBuildError("detectedUiElements length must equal the number of mappings");
    }

    return {
        schemaVersion: "1.0.0",
        revision: input.revision,
        migrationId: input.migrationId,
        outcome: input.outcome,
        createdAt: input.createdAt,
        sourceFramework: input.sourceFramework,
        sourceVersion: input.sourceVersion,
        targetFramework: "angular",
        targetProfileId: input.targetProfileId,
        architectureRevision: "xelops-angular-v1",
        catalog: input.catalog,
        coverage: input.coverage,
        counts,
        analyzedFiles: input.analyzedFiles,
        detectedUiElements: input.detectedUiElements,
        mappings: input.mappings,
        generatedFiles: input.generatedFiles,
        dependencyDecisions: input.dependencyDecisions,
        preservationFindings: input.preservationFindings,
        validationResults: input.validationResults,
        stages: input.stages,
        warnings: input.warnings,
        errors: input.errors
    };
}

function skippedValidationResults(reason: string): readonly ValidationResult[] {
    return VALIDATION_GATES.map((gate) => ({
        gate,
        status: "skipped",
        command: null,
        toolVersion: null,
        exitCode: null,
        durationMs: null,
        reason,
        diagnostics: []
    }));
}

export interface EarlyFailureInput {
    readonly migrationId: string;
    readonly revision?: string;
    readonly createdAt: string;
    readonly failedStage: Stage;
    readonly reason: string;
    readonly errors: readonly AnalyzerFinding[];
    readonly warnings?: readonly AnalyzerFinding[];
    readonly sourceFramework?: ReportSourceFramework;
    readonly sourceVersion?: string | null;
    readonly catalog: ReportCatalogReference;
    readonly analyzedFiles?: readonly SourceFile[];
}

/**
 * Builds a failure report for an attempt that never reached generation/validation
 * (e.g. a corrupt archive or an analyzer exception). No generated files, no completed
 * validation gates; unknown framework/coverage stays unknown rather than guessed.
 */
export function buildEarlyFailureReport(input: EarlyFailureInput): ReportBundle {
    const failedIndex = STAGE_ORDER.indexOf(input.failedStage);
    if (failedIndex === -1) {
        throw new ReportBuildError(`unknown stage "${input.failedStage}"`);
    }
    const stages: StageOutcome[] = STAGE_ORDER.map((stage, index) => {
        if (stage === "Reporter") {
            return { stage, status: "completed", startedAt: input.createdAt, endedAt: input.createdAt, reason: null };
        }
        if (index < failedIndex) {
            return { stage, status: "completed", startedAt: input.createdAt, endedAt: input.createdAt, reason: null };
        }
        if (index === failedIndex) {
            return { stage, status: "failed", startedAt: input.createdAt, endedAt: input.createdAt, reason: input.reason };
        }
        return {
            stage,
            status: "skipped",
            startedAt: null,
            endedAt: null,
            reason: `skipped: "${input.failedStage}" failed (${input.reason})`
        };
    });

    return buildReportBundle({
        migrationId: input.migrationId,
        revision: input.revision ?? randomUUID(),
        outcome: "failed",
        createdAt: input.createdAt,
        sourceFramework: input.sourceFramework ?? "unknown",
        sourceVersion: input.sourceVersion ?? null,
        targetProfileId: null,
        catalog: input.catalog,
        coverage: "unknown",
        analyzedFiles: input.analyzedFiles ?? [],
        detectedUiElements: [],
        mappings: [],
        generatedFiles: [],
        dependencyDecisions: [],
        preservationFindings: [],
        validationResults: skippedValidationResults(`skipped: "${input.failedStage}" failed before validation ran`),
        stages,
        warnings: input.warnings ?? [],
        errors: input.errors
    });
}
