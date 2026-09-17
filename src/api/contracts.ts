/**
 * API-owned HTTP contract types (contracts/openapi.json). These are the wire DTOs;
 * routes and services never expose stage-owned domain types directly over HTTP.
 */
import type { Stage, StageOutcome, ReportCounts } from "../reporter/report-model.js";
import type { AnalyzerFinding } from "../analyzer/models.js";

export type { Stage, StageOutcome };

export type MigrationState = "accepted" | "running" | "completed" | "failed";

export interface ApiError {
    readonly code: string;
    readonly message: string;
}

export interface ApiLinks {
    readonly status: string;
    readonly report: string;
    readonly download: string;
    readonly diagnosticDownload: string;
}

export interface AcceptedResponse {
    readonly migrationId: string;
    readonly state: "accepted";
    readonly links: ApiLinks;
}

export interface PendingResponse {
    readonly migrationId: string;
    readonly state: "accepted" | "running";
    readonly reportAvailable: false;
}

export interface ApiArtifact {
    readonly available: boolean;
    readonly url: string | null;
    readonly sha256: string | null;
    readonly bytes: number | null;
    readonly expiresAt: string | null;
}

export interface StatusResponse {
    readonly migrationId: string;
    readonly state: MigrationState;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly currentStage: Stage | null;
    readonly stages: readonly StageOutcome[];
    readonly reportAvailable: boolean;
    readonly counts: ReportCounts;
    readonly coverage: "complete" | "partial" | "unknown";
    readonly finalArtifact: ApiArtifact;
    readonly diagnosticArtifact: ApiArtifact;
    readonly warnings: readonly AnalyzerFinding[];
    readonly errors: readonly AnalyzerFinding[];
    readonly expiresAt: string;
}

export type ReportFormat = "json" | "md";

/**
 * MigrationJob (data-model.md): the durable receipt persisted at
 * jobs/<uuid>/receipt.json and the source of truth for Status responses.
 */
export interface JobReceipt {
    readonly migrationId: string;
    readonly schemaVersion: "1.0.0";
    readonly state: MigrationState;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly currentStage: Stage | null;
    readonly stages: readonly StageOutcome[];
    readonly catalogRevision: string | null;
    readonly targetProfileId: string | null;
    /** Set only once a revision is published; publication is the sole completion signal. */
    readonly publishedRevision: string | null;
    readonly counts: ReportCounts;
    readonly coverage: "complete" | "partial" | "unknown";
    readonly finalArtifact: ApiArtifact;
    readonly diagnosticArtifact: ApiArtifact;
    readonly warnings: readonly AnalyzerFinding[];
    readonly errors: readonly AnalyzerFinding[];
    readonly expiresAt: string;
}

