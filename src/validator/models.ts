/**
 * Validator-owned domain models (data-model.md § TargetProfile, ValidationResult).
 */

export type ValidationGate =
    | "installation"
    | "typescript"
    | "angular-build"
    | "lint"
    | "tests"
    | "xelops-compliance";

export const VALIDATION_GATES: readonly ValidationGate[] = [
    "installation",
    "typescript",
    "angular-build",
    "lint",
    "tests",
    "xelops-compliance"
];

export type ValidationStatus = "passed" | "failed" | "skipped";

export interface ValidationResult {
    readonly gate: ValidationGate;
    readonly status: ValidationStatus;
    readonly command: string | null;
    readonly toolVersion: string | null;
    readonly exitCode: number | null;
    readonly durationMs: number | null;
    readonly reason: string | null;
    readonly diagnostics: readonly string[];
}

export interface TargetProfilePackage {
    readonly name: string;
    readonly version: string;
    readonly integrity: string;
}

export type ProfileAdmissionStatus = "admitted" | "expired" | "incompatible" | "unverified";

export interface TargetProfile {
    readonly profileId: string;
    readonly architectureRevision: "xelops-angular-v1";
    readonly packages: readonly TargetProfilePackage[];
    readonly lockfileSha256: string;
    readonly supportExpiresAt: string;
    readonly admissionStatus: ProfileAdmissionStatus;
    readonly admissionChecks: readonly ValidationResult[];
}
