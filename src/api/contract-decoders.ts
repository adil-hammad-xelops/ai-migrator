/**
 * Decode API-owned persisted/API data from `unknown` (T008). Rejects malformed shapes
 * before typed use; never uses `as` assertions to bypass a check.
 */
import type {
    JobReceipt,
    MigrationState,
    Stage,
    StageOutcome,
    ApiArtifact
} from "./contracts.js";
import type { ReportCounts, StageStatus } from "../reporter/report-model.js";
import type { AnalyzerFinding } from "../analyzer/models.js";

export class DecodeError extends Error {
    constructor(path: string, reason: string) {
        super(`invalid value at ${path}: ${reason}`);
        this.name = "DecodeError";
    }
}

function fail(path: string, reason: string): never {
    throw new DecodeError(path, reason);
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

/** Rejects objects carrying keys outside `allowed` — enforces `additionalProperties: false`. */
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
    if (value === null) {
        return null;
    }
    return asString(value, path);
}

function asBoolean(value: unknown, path: string): boolean {
    if (typeof value !== "boolean") {
        fail(path, "expected a boolean");
    }
    return value;
}

function asNonNegativeInt(value: unknown, path: string): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        fail(path, "expected a non-negative integer");
    }
    return value;
}

function asNonNegativeIntOrNull(value: unknown, path: string): number | null {
    if (value === null) {
        return null;
    }
    return asNonNegativeInt(value, path);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(value: unknown, path: string): string {
    const str = asString(value, path);
    if (!UUID_PATTERN.test(str)) {
        fail(path, "expected a UUID");
    }
    return str;
}

function asIsoDateTime(value: unknown, path: string): string {
    const str = asString(value, path);
    const parsed = Date.parse(str);
    if (Number.isNaN(parsed)) {
        fail(path, "expected an ISO 8601 date-time string");
    }
    return str;
}

function asIsoDateTimeOrNull(value: unknown, path: string): string | null {
    if (value === null) {
        return null;
    }
    return asIsoDateTime(value, path);
}

function asStringArray(value: unknown, path: string): readonly string[] {
    if (!Array.isArray(value)) {
        fail(path, "expected an array");
    }
    return value.map((item, index) => asString(item, `${path}[${index}]`));
}

/** Rejects absolute paths, drive/UNC prefixes, backslashes and `..` traversal segments. */
function asSourceRelativePosixPath(value: unknown, path: string): string {
    const str = asString(value, path);
    if (str.length === 0) {
        fail(path, "path must not be empty");
    }
    if (str.startsWith("/") || /^[a-zA-Z]:/.test(str) || str.startsWith("\\\\")) {
        fail(path, "path must be source-relative, not absolute/drive/UNC");
    }
    if (str.includes("\\")) {
        fail(path, "path must use POSIX separators");
    }
    const segments = str.split("/");
    if (segments.some((segment) => segment === "..")) {
        fail(path, "path must not contain traversal segments");
    }
    return str;
}

const MIGRATION_STATES: readonly MigrationState[] = ["accepted", "running", "completed", "failed"];

function asMigrationState(value: unknown, path: string): MigrationState {
    const str = asString(value, path);
    if (!(MIGRATION_STATES as readonly string[]).includes(str)) {
        fail(path, `expected one of ${MIGRATION_STATES.join(", ")}`);
    }
    return str as MigrationState;
}

const STAGES: readonly Stage[] = ["Analyzer", "Mapper", "Generator", "Validator", "Reporter", "ZIP Exporter"];

function asStage(value: unknown, path: string): Stage {
    const str = asString(value, path);
    if (!(STAGES as readonly string[]).includes(str)) {
        fail(path, `expected one of ${STAGES.join(", ")}`);
    }
    return str as Stage;
}

function asStageOrNull(value: unknown, path: string): Stage | null {
    if (value === null) {
        return null;
    }
    return asStage(value, path);
}

const STAGE_STATUSES: readonly StageStatus[] = ["pending", "running", "completed", "failed", "skipped"];

function asStageStatus(value: unknown, path: string): StageStatus {
    const str = asString(value, path);
    if (!(STAGE_STATUSES as readonly string[]).includes(str)) {
        fail(path, `expected one of ${STAGE_STATUSES.join(", ")}`);
    }
    return str as StageStatus;
}

function asStageOutcome(value: unknown, path: string): StageOutcome {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["stage", "status", "startedAt", "endedAt", "reason"], path);
    return {
        stage: asStage(record["stage"], `${path}.stage`),
        status: asStageStatus(record["status"], `${path}.status`),
        startedAt: asIsoDateTimeOrNull(record["startedAt"] ?? null, `${path}.startedAt`),
        endedAt: asIsoDateTimeOrNull(record["endedAt"] ?? null, `${path}.endedAt`),
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
    return outcomes;
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

function asApiArtifact(value: unknown, path: string): ApiArtifact {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["available", "url", "sha256", "bytes", "expiresAt"], path);
    const available = asBoolean(record["available"], `${path}.available`);
    const artifact: ApiArtifact = {
        available,
        url: asStringOrNull(record["url"], `${path}.url`),
        sha256: asStringOrNull(record["sha256"], `${path}.sha256`),
        bytes: asNonNegativeIntOrNull(record["bytes"], `${path}.bytes`),
        expiresAt: asIsoDateTimeOrNull(record["expiresAt"], `${path}.expiresAt`)
    };
    if (!available && (artifact.url !== null || artifact.sha256 !== null || artifact.bytes !== null)) {
        fail(path, "unavailable artifact must not carry url/sha256/bytes");
    }
    return artifact;
}

const FINDING_SEVERITIES = ["warning", "error"] as const;

function asAnalyzerFinding(value: unknown, path: string): AnalyzerFinding {
    const record = asRecord(value, path);
    assertNoExtraKeys(record, ["code", "message", "severity", "sourceFiles"], path);
    const severity = asString(record["severity"], `${path}.severity`);
    if (!(FINDING_SEVERITIES as readonly string[]).includes(severity)) {
        fail(`${path}.severity`, `expected one of ${FINDING_SEVERITIES.join(", ")}`);
    }
    return {
        code: asString(record["code"], `${path}.code`),
        message: asString(record["message"], `${path}.message`),
        severity: severity as "warning" | "error",
        sourceFiles: asStringArray(record["sourceFiles"], `${path}.sourceFiles`).map((p, i) =>
            asSourceRelativePosixPath(p, `${path}.sourceFiles[${i}]`)
        )
    };
}

function asAnalyzerFindingArray(value: unknown, path: string): readonly AnalyzerFinding[] {
    if (!Array.isArray(value)) {
        fail(path, "expected an array");
    }
    return value.map((item, index) => asAnalyzerFinding(item, `${path}[${index}]`));
}

const JOB_RECEIPT_KEYS = [
    "migrationId",
    "schemaVersion",
    "state",
    "createdAt",
    "updatedAt",
    "currentStage",
    "stages",
    "catalogRevision",
    "targetProfileId",
    "publishedRevision",
    "counts",
    "coverage",
    "finalArtifact",
    "diagnosticArtifact",
    "warnings",
    "errors",
    "expiresAt"
] as const;

const COVERAGE_VALUES = ["complete", "partial", "unknown"] as const;

/** Decodes a persisted `receipt.json`; throws `DecodeError` on any malformed/extra field. */
export function decodeJobReceipt(value: unknown): JobReceipt {
    const record = asRecord(value, "$");
    assertNoExtraKeys(record, JOB_RECEIPT_KEYS, "$");
    const schemaVersion = asString(record["schemaVersion"], "$.schemaVersion");
    if (schemaVersion !== "1.0.0") {
        fail("$.schemaVersion", 'expected "1.0.0"');
    }
    const coverage = asString(record["coverage"], "$.coverage");
    if (!(COVERAGE_VALUES as readonly string[]).includes(coverage)) {
        fail("$.coverage", `expected one of ${COVERAGE_VALUES.join(", ")}`);
    }
    const publishedRevision = asStringOrNull(record["publishedRevision"], "$.publishedRevision");
    const state = asMigrationState(record["state"], "$.state");
    if (state === "completed" && publishedRevision === null) {
        fail("$.publishedRevision", "completed jobs must carry a published revision");
    }
    return {
        migrationId: asUuid(record["migrationId"], "$.migrationId"),
        schemaVersion: "1.0.0",
        state,
        createdAt: asIsoDateTime(record["createdAt"], "$.createdAt"),
        updatedAt: asIsoDateTime(record["updatedAt"], "$.updatedAt"),
        currentStage: asStageOrNull(record["currentStage"], "$.currentStage"),
        stages: asStageOutcomeArray(record["stages"], "$.stages"),
        catalogRevision: asStringOrNull(record["catalogRevision"], "$.catalogRevision"),
        targetProfileId: asStringOrNull(record["targetProfileId"], "$.targetProfileId"),
        publishedRevision,
        counts: asReportCounts(record["counts"], "$.counts"),
        coverage: coverage as "complete" | "partial" | "unknown",
        finalArtifact: asApiArtifact(record["finalArtifact"], "$.finalArtifact"),
        diagnosticArtifact: asApiArtifact(record["diagnosticArtifact"], "$.diagnosticArtifact"),
        warnings: asAnalyzerFindingArray(record["warnings"], "$.warnings"),
        errors: asAnalyzerFindingArray(record["errors"], "$.errors"),
        expiresAt: asIsoDateTime(record["expiresAt"], "$.expiresAt")
    };
}
