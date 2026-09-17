/**
 * Generator-owned domain models (data-model.md § GeneratedProject).
 */

export interface GeneratedFile {
    readonly path: string;
    readonly sha256: string;
    readonly sourceFiles: readonly string[];
}

export type DependencyDecisionKind = "preserved" | "removed" | "replaced" | "manual-review";

export interface DependencyDecision {
    readonly sourcePackage: string;
    readonly sourceVersion: string | null;
    readonly targetPackage: string | null;
    readonly targetVersion: string | null;
    readonly decision: DependencyDecisionKind;
    readonly reason: string;
}

export type PreservationOutcome = "preserved" | "adapted" | "manual-review" | "unsupported";

export interface PreservationFinding {
    readonly sourceFiles: readonly string[];
    readonly behavior: string;
    readonly outcome: PreservationOutcome;
    /** True when this finding blocks a completed migration even if the build succeeds. */
    readonly blocking: boolean;
    readonly reason: string;
}

export interface GeneratedProject {
    readonly profileId: string;
    readonly files: readonly GeneratedFile[];
    readonly dependencyDecisions: readonly DependencyDecision[];
    readonly preservationFindings: readonly PreservationFinding[];
}
