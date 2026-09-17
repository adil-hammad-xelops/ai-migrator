/**
 * Decode a persisted/served ReportBundle from `unknown` (T008). Reuses stage-owned
 * result types but performs its own boundary validation; reporter never trusts
 * upstream stage output as already-safe once it crosses a storage/read boundary.
 */
import type {
    ReportBundle,
    ReportCounts,
    ReportElement,
    ReportCatalogReference,
    StageOutcome,
    Stage,
    StageStatus
} from "./report-model.js";
import type { SourceFile, SourceFileDisposition, AnalyzerFinding } from "../analyzer/models.js";
import type { MappingDecision, MappingStatus, PropertyTranslation, EventTranslation } from "../mapper/models.js";
import type {
    GeneratedFile,
    DependencyDecision,
    DependencyDecisionKind,
    PreservationFinding,
    PreservationOutcome
} from "../generator/models.js";
import type { ValidationResult, ValidationGate, ValidationStatus } from "../validator/models.js";
import { VALIDATION_GATES } from "../validator/models.js";

export class ReportDecodeError extends Error {
    constructor(path: string, reason: string) {
        super(`invalid report value at ${path}: ${reason}`);
        this.name = "ReportDecodeError";
    }
}

function fail(path: string, reason: string): never {
    throw new ReportDecodeError(path, reason);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
    if (!isRecord(value)) {
        fail(path, "expected an object");
    }
    return value;
}

function assertNoExtraKeys(record: Record<string, unknown>, allowed: readonly string[], path: string): void {
    for (const key of Object.keys(record)) {
        if (!allowed.includes(key)) {
            fail(path, `unexpected property "${key}"`);
        }
    }
}

function asString(value: unknown, path: string): string {
    if (typeof value !== "string") {
        fail(path, "expected a string");
    }
    return value;
}

function asStringOrNull(value: unknown, path: string): string | null {
    return value === null ? null : asString(value, path);
}

function asBoolean(value: unknown, path: string): boolean {
    if (typeof value !== "boolean") {
        fail(path, "expected a boolean");
    }
    return value;
}

function asInt(value: unknown, path: string): number {
    if (typeof value !== "number" || !Number.isInteger(value)) {
        fail(path, "expected an integer");
    }
    return value;
}

function asIntOrNull(value: unknown, path: string): number | null {
    return value === null ? null : asInt(value, path);
}

function asNonNegativeInt(value: unknown, path: string): number {
    const n = asInt(value, path);
    if (n < 0) {
        fail(path, "expected a non-negative integer");
    }
    return n;
}

function asPositiveIntOrNull(value: unknown, path: string): number | null {
    if (value === null) {
        return null;
    }
    const n = asInt(value, path);
    if (n < 1) {
        fail(path, "expected an integer >= 1");
    }
    return n;
}

function asStringArray(value: unknown, path: string): readonly string[] {
    if (!Array.isArray(value)) {
        fail(path, "expected an array");
    }
    return value.map((item, index) => asString(item, `${path}[${index}]`));
}

function asSourceRelativePosixPath(value: unknown, path: string): string {
    const str = asString(value, path);
    if (str.length === 0) {
        fail(path, "path must not be empty");
    }
    if (str.startsWith("/") || /^[a-zA-Z]:/.test(str) || str.startsWith("\\\\") || str.includes("\\")) {
        fail(path, "path must be a source-relative POSIX path");
    }
    if (str.split("/").some((segment) => segment === "..")) {
        fail(path, "path must not contain traversal segments");
    }
    return str;
}

function asSourceRelativePathArray(value: unknown, path: string): readonly string[] {
    return asStringArray(value, path).map((p, i) => asSourceRelativePosixPath(p, `${path}[${i}]`));
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
    const str = asString(value, path);
    if (!(allowed as readonly string[]).includes(str)) {
        fail(path, `expected one of ${allowed.join(", ")}`);
    }
    return str as T;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;

function asUuid(value: unknown, path: string): string {
    const str = asString(value, path);
    if (!UUID_PATTERN.test(str)) {
        fail(path, "expected a UUID");
    }
    return str;
}

function asSha256(value: unknown, path: string): string {
    const str = asString(value, path);
    if (!SHA256_PATTERN.test(str)) {
        fail(path, "expected a SHA-256 hex digest");
    }
    return str;
}

function asIsoDateTime(value: unknown, path: string): string {
    const str = asString(value, path);
    if (Number.isNaN(Date.parse(str))) {
        fail(path, "expected an ISO 8601 date-time string");
    }
    return str;
}

const STAGES: readonly Stage[] = ["Analyzer", "Mapper", "Generator", "Validator", "Reporter", "ZIP Exporter"];
const STAGE_STATUSES: readonly StageStatus[] = ["pending", "running", "completed", "failed", "skipped"];

function asStageOutcome(value: unknown, path: string): StageOutcome {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["stage", "status", "startedAt", "endedAt", "reason"], path);
    return {
        stage: asEnum(record["stage"], STAGES, `${path}.stage`),
        status: asEnum(record["status"], STAGE_STATUSES, `${path}.status`),
        startedAt: record["startedAt"] === null ? null : asIsoDateTime(record["startedAt"], `${path}.startedAt`),
        endedAt: record["endedAt"] === null ? null : asIsoDateTime(record["endedAt"], `${path}.endedAt`),
        reason: asStringOrNull(record["reason"] ?? null, `${path}.reason`)
    };
}

function asStageOutcomeArray(value: unknown, path: string): readonly StageOutcome[] {
    if (!Array.isArray(value)) {
        fail(path, "expected an array");
    }
    const outcomes = value.map((item, index) => asStageOutcome(item, `${path}[${index}]`));
    const seen = new Set<Stage>();
    for (const outcome of outcomes) {
        if (seen.has(outcome.stage)) {
            fail(path, `duplicate stage outcome for "${outcome.stage}"`);
        }
        seen.add(outcome.stage);
    }
    for (const stage of STAGES) {
        if (!seen.has(stage)) {
            fail(path, `missing stage outcome for "${stage}"`);
        }
    }
    return outcomes;
}

const FINDING_SEVERITIES = ["warning", "error"] as const;

function asAnalyzerFinding(value: unknown, path: string): AnalyzerFinding {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["code", "message", "severity", "sourceFiles"], path);
    return {
        code: asString(record["code"], `${path}.code`),
        message: asString(record["message"], `${path}.message`),
        severity: asEnum(record["severity"], FINDING_SEVERITIES, `${path}.severity`),
        sourceFiles: asSourceRelativePathArray(record["sourceFiles"], `${path}.sourceFiles`)
    };
}

function asAnalyzerFindingArray(value: unknown, path: string): readonly AnalyzerFinding[] {
    if (!Array.isArray(value)) {
        fail(path, "expected an array");
    }
    return value.map((item, index) => asAnalyzerFinding(item, `${path}[${index}]`));
}

const SOURCE_FILE_DISPOSITIONS: readonly SourceFileDisposition[] = ["analyzed", "excluded", "failed"];

function asSourceFile(value: unknown, path: string): SourceFile {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["path", "sha256", "sizeBytes", "disposition", "reason", "roles"], path);
    return {
        path: asSourceRelativePosixPath(record["path"], `${path}.path`),
        sha256: asSha256(record["sha256"], `${path}.sha256`),
        sizeBytes: asNonNegativeInt(record["sizeBytes"], `${path}.sizeBytes`),
        disposition: asEnum(record["disposition"], SOURCE_FILE_DISPOSITIONS, `${path}.disposition`),
        reason: asStringOrNull(record["reason"], `${path}.reason`),
        roles: asStringArray(record["roles"], `${path}.roles`)
    };
}

function asReportElement(value: unknown, path: string): ReportElement {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["id", "sourceFile", "sourceElement", "line", "role"], path);
    return {
        id: asString(record["id"], `${path}.id`),
        sourceFile: asSourceRelativePosixPath(record["sourceFile"], `${path}.sourceFile`),
        sourceElement: asString(record["sourceElement"], `${path}.sourceElement`),
        line: asPositiveIntOrNull(record["line"], `${path}.line`),
        role: asString(record["role"], `${path}.role`)
    };
}

const MAPPING_STATUSES: readonly MappingStatus[] = ["mapped", "unmapped", "manual-review"];

function asPropertyTranslation(value: unknown, path: string): PropertyTranslation {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["sourceProperty", "targetProperty"], path);
    return {
        sourceProperty: asString(record["sourceProperty"], `${path}.sourceProperty`),
        targetProperty: asString(record["targetProperty"], `${path}.targetProperty`)
    };
}

function asEventTranslation(value: unknown, path: string): EventTranslation {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["sourceEvent", "targetEvent"], path);
    return {
        sourceEvent: asString(record["sourceEvent"], `${path}.sourceEvent`),
        targetEvent: asString(record["targetEvent"], `${path}.targetEvent`)
    };
}

function asMappingDecision(value: unknown, path: string): MappingDecision {
    const record = asRecord(value, path);
    assertNoExtraKeys(
        record,
        [
            "occurrenceId",
            "sourceFile",
            "sourceElement",
            "status",
            "reasonCode",
            "reason",
            "candidateEntryIds",
            "targetEntryId",
            "propertyTranslations",
            "eventTranslations",
            "preservedRequirements",
            "unresolvedRequirements"
        ],
        path
    );
    const status = asEnum(record["status"], MAPPING_STATUSES, `${path}.status`);
    const targetEntryId = asStringOrNull(record["targetEntryId"], `${path}.targetEntryId`);
    if (status === "mapped" && targetEntryId === null) {
        fail(`${path}.targetEntryId`, "mapped decisions must select a target");
    }
    if (status !== "mapped" && targetEntryId !== null) {
        fail(`${path}.targetEntryId`, "only mapped decisions may select a target");
    }
    const propertyTranslationsValue = record["propertyTranslations"];
    const eventTranslationsValue = record["eventTranslations"];
    if (!Array.isArray(propertyTranslationsValue)) {
        fail(`${path}.propertyTranslations`, "expected an array");
    }
    if (!Array.isArray(eventTranslationsValue)) {
        fail(`${path}.eventTranslations`, "expected an array");
    }
    return {
        occurrenceId: asString(record["occurrenceId"], `${path}.occurrenceId`),
        sourceFile: asSourceRelativePosixPath(record["sourceFile"], `${path}.sourceFile`),
        sourceElement: asString(record["sourceElement"], `${path}.sourceElement`),
        status,
        reasonCode: asString(record["reasonCode"], `${path}.reasonCode`),
        reason: asString(record["reason"], `${path}.reason`),
        candidateEntryIds: asStringArray(record["candidateEntryIds"], `${path}.candidateEntryIds`),
        targetEntryId,
        propertyTranslations: propertyTranslationsValue.map((item, index) =>
            asPropertyTranslation(item, `${path}.propertyTranslations[${index}]`)
        ),
        eventTranslations: eventTranslationsValue.map((item, index) =>
            asEventTranslation(item, `${path}.eventTranslations[${index}]`)
        ),
        preservedRequirements: asStringArray(record["preservedRequirements"], `${path}.preservedRequirements`),
        unresolvedRequirements: asStringArray(record["unresolvedRequirements"], `${path}.unresolvedRequirements`)
    };
}

function asGeneratedFile(value: unknown, path: string): GeneratedFile {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["path", "sha256", "sourceFiles"], path);
    return {
        path: asSourceRelativePosixPath(record["path"], `${path}.path`),
        sha256: asSha256(record["sha256"], `${path}.sha256`),
        sourceFiles: asSourceRelativePathArray(record["sourceFiles"], `${path}.sourceFiles`)
    };
}

const DEPENDENCY_DECISIONS: readonly DependencyDecisionKind[] = [
    "preserved",
    "removed",
    "replaced",
    "manual-review"
];

function asDependencyDecision(value: unknown, path: string): DependencyDecision {
    const record = asRecord(value, path);
    assertNoExtraKeys(
        record,
        ["sourcePackage", "sourceVersion", "targetPackage", "targetVersion", "decision", "reason"],
        path
    );
    return {
        sourcePackage: asString(record["sourcePackage"], `${path}.sourcePackage`),
        sourceVersion: asStringOrNull(record["sourceVersion"], `${path}.sourceVersion`),
        targetPackage: asStringOrNull(record["targetPackage"], `${path}.targetPackage`),
        targetVersion: asStringOrNull(record["targetVersion"], `${path}.targetVersion`),
        decision: asEnum(record["decision"], DEPENDENCY_DECISIONS, `${path}.decision`),
        reason: asString(record["reason"], `${path}.reason`)
    };
}

const PRESERVATION_OUTCOMES: readonly PreservationOutcome[] = [
    "preserved",
    "adapted",
    "manual-review",
    "unsupported"
];

function asPreservationFinding(value: unknown, path: string): PreservationFinding {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["sourceFiles", "behavior", "outcome", "blocking", "reason"], path);
    return {
        sourceFiles: asSourceRelativePathArray(record["sourceFiles"], `${path}.sourceFiles`),
        behavior: asString(record["behavior"], `${path}.behavior`),
        outcome: asEnum(record["outcome"], PRESERVATION_OUTCOMES, `${path}.outcome`),
        blocking: asBoolean(record["blocking"], `${path}.blocking`),
        reason: asString(record["reason"], `${path}.reason`)
    };
}

const VALIDATION_STATUSES: readonly ValidationStatus[] = ["passed", "failed", "skipped"];

function asValidationResult(value: unknown, path: string): ValidationResult {
    const record = asRecord(value, path);
    assertNoExtraKeys(
        record,
        ["gate", "status", "command", "toolVersion", "exitCode", "durationMs", "reason", "diagnostics"],
        path
    );
    const status = asEnum(record["status"], VALIDATION_STATUSES, `${path}.status`);
    const exitCode = asIntOrNull(record["exitCode"], `${path}.exitCode`);
    if (status === "passed" && exitCode !== 0) {
        fail(`${path}.exitCode`, "a passed gate must have exit code 0");
    }
    if (status !== "passed" && record["reason"] === null) {
        fail(`${path}.reason`, "a failed or skipped gate must state a reason");
    }
    return {
        gate: asEnum(record["gate"], VALIDATION_GATES, `${path}.gate`),
        status,
        command: asStringOrNull(record["command"], `${path}.command`),
        toolVersion: asStringOrNull(record["toolVersion"], `${path}.toolVersion`),
        exitCode,
        durationMs: asPositiveIntOrNull(record["durationMs"] === 0 ? 0 : record["durationMs"], `${path}.durationMs`),
        reason: asStringOrNull(record["reason"], `${path}.reason`),
        diagnostics: asStringArray(record["diagnostics"], `${path}.diagnostics`)
    };
}

/** Exactly six results, one per gate in `VALIDATION_GATES` order, no duplicates/omissions. */
function asValidationResultArray(value: unknown, path: string): readonly ValidationResult[] {
    if (!Array.isArray(value)) {
        fail(path, "expected an array");
    }
    if (value.length !== 6) {
        fail(path, "expected exactly six validation results");
    }
    const results = value.map((item, index) => asValidationResult(item, `${path}[${index}]`));
    const seenGates = new Set<ValidationGate>();
    for (const result of results) {
        if (seenGates.has(result.gate)) {
            fail(path, `duplicate validation gate "${result.gate}"`);
        }
        seenGates.add(result.gate);
    }
    for (const gate of VALIDATION_GATES) {
        if (!seenGates.has(gate)) {
            fail(path, `missing validation gate "${gate}"`);
        }
    }
    return results;
}

function asReportCounts(value: unknown, path: string): ReportCounts {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["detected", "mapped", "unmapped", "manualReview"], path);
    const counts: ReportCounts = {
        detected: asNonNegativeInt(record["detected"], `${path}.detected`),
        mapped: asNonNegativeInt(record["mapped"], `${path}.mapped`),
        unmapped: asNonNegativeInt(record["unmapped"], `${path}.unmapped`),
        manualReview: asNonNegativeInt(record["manualReview"], `${path}.manualReview`)
    };
    if (counts.mapped + counts.unmapped + counts.manualReview !== counts.detected) {
        fail(path, "mapped + unmapped + manualReview must equal detected");
    }
    return counts;
}

function asReportCatalogReference(value: unknown, path: string): ReportCatalogReference {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["revision", "sha256", "entryCount"], path);
    return {
        revision: asString(record["revision"], `${path}.revision`),
        sha256: asSha256(record["sha256"], `${path}.sha256`),
        entryCount: asNonNegativeInt(record["entryCount"], `${path}.entryCount`)
    };
}

const SOURCE_FRAMEWORKS = ["react", "angular", "unknown", "mixed"] as const;
const COVERAGE_VALUES = ["complete", "partial", "unknown"] as const;
const OUTCOMES = ["completed", "failed"] as const;

const REPORT_KEYS = [
    "schemaVersion",
    "revision",
    "migrationId",
    "outcome",
    "createdAt",
    "sourceFramework",
    "sourceVersion",
    "targetFramework",
    "targetProfileId",
    "architectureRevision",
    "catalog",
    "coverage",
    "counts",
    "analyzedFiles",
    "detectedUiElements",
    "mappings",
    "generatedFiles",
    "dependencyDecisions",
    "preservationFindings",
    "validationResults",
    "stages",
    "warnings",
    "errors"
] as const;

/**
 * Decodes a full ReportBundle from `unknown` (persisted migration-report.json).
 * Enforces: no embedded ZIP checksum key ("additionalProperties: false" via
 * `assertNoExtraKeys`, which also rejects any stray "zipSha256"/"artifactSha256" field),
 * nonnegative reconciled counts, exactly six distinct validation gates, UUID migrationId,
 * and source-relative POSIX paths everywhere a path is expected.
 */
export function decodeReportBundle(value: unknown): ReportBundle {
    const record = asRecord(value, "$");
    assertNoExtraKeys(record, REPORT_KEYS, "$");

    const schemaVersion = asString(record["schemaVersion"], "$.schemaVersion");
    if (schemaVersion !== "1.0.0") {
        fail("$.schemaVersion", 'expected "1.0.0"');
    }
    const targetFramework = asString(record["targetFramework"], "$.targetFramework");
    if (targetFramework !== "angular") {
        fail("$.targetFramework", 'expected "angular"');
    }
    const architectureRevision = asString(record["architectureRevision"], "$.architectureRevision");
    if (architectureRevision !== "xelops-angular-v1") {
        fail("$.architectureRevision", 'expected "xelops-angular-v1"');
    }

    const analyzedFilesValue = record["analyzedFiles"];
    const detectedUiElementsValue = record["detectedUiElements"];
    const mappingsValue = record["mappings"];
    const generatedFilesValue = record["generatedFiles"];
    const dependencyDecisionsValue = record["dependencyDecisions"];
    const preservationFindingsValue = record["preservationFindings"];
    if (!Array.isArray(analyzedFilesValue)) fail("$.analyzedFiles", "expected an array");
    if (!Array.isArray(detectedUiElementsValue)) fail("$.detectedUiElements", "expected an array");
    if (!Array.isArray(mappingsValue)) fail("$.mappings", "expected an array");
    if (!Array.isArray(generatedFilesValue)) fail("$.generatedFiles", "expected an array");
    if (!Array.isArray(dependencyDecisionsValue)) fail("$.dependencyDecisions", "expected an array");
    if (!Array.isArray(preservationFindingsValue)) fail("$.preservationFindings", "expected an array");

    const counts = asReportCounts(record["counts"], "$.counts");
    const mappings = mappingsValue.map((item, index) => asMappingDecision(item, `$.mappings[${index}]`));
    if (mappings.length !== counts.detected) {
        fail("$.mappings", "mappings length must equal counts.detected");
    }
    const statusTally = { mapped: 0, unmapped: 0, "manual-review": 0 } as Record<MappingStatus, number>;
    for (const mapping of mappings) {
        statusTally[mapping.status] += 1;
    }
    if (
        statusTally.mapped !== counts.mapped ||
        statusTally.unmapped !== counts.unmapped ||
        statusTally["manual-review"] !== counts.manualReview
    ) {
        fail("$.mappings", "per-status mapping tallies must reconcile with counts");
    }

    return {
        schemaVersion: "1.0.0",
        revision: asString(record["revision"], "$.revision"),
        migrationId: asUuid(record["migrationId"], "$.migrationId"),
        outcome: asEnum(record["outcome"], OUTCOMES, "$.outcome"),
        createdAt: asIsoDateTime(record["createdAt"], "$.createdAt"),
        sourceFramework: asEnum(record["sourceFramework"], SOURCE_FRAMEWORKS, "$.sourceFramework"),
        sourceVersion: asStringOrNull(record["sourceVersion"], "$.sourceVersion"),
        targetFramework: "angular",
        targetProfileId: asStringOrNull(record["targetProfileId"], "$.targetProfileId"),
        architectureRevision: "xelops-angular-v1",
        catalog: asReportCatalogReference(record["catalog"], "$.catalog"),
        coverage: asEnum(record["coverage"], COVERAGE_VALUES, "$.coverage"),
        counts,
        analyzedFiles: analyzedFilesValue.map((item, index) => asSourceFile(item, `$.analyzedFiles[${index}]`)),
        detectedUiElements: detectedUiElementsValue.map((item, index) =>
            asReportElement(item, `$.detectedUiElements[${index}]`)
        ),
        mappings,
        generatedFiles: generatedFilesValue.map((item, index) => asGeneratedFile(item, `$.generatedFiles[${index}]`)),
        dependencyDecisions: dependencyDecisionsValue.map((item, index) =>
            asDependencyDecision(item, `$.dependencyDecisions[${index}]`)
        ),
        preservationFindings: preservationFindingsValue.map((item, index) =>
            asPreservationFinding(item, `$.preservationFindings[${index}]`)
        ),
        validationResults: asValidationResultArray(record["validationResults"], "$.validationResults"),
        stages: asStageOutcomeArray(record["stages"], "$.stages"),
        warnings: asAnalyzerFindingArray(record["warnings"], "$.warnings"),
        errors: asAnalyzerFindingArray(record["errors"], "$.errors")
    };
}
