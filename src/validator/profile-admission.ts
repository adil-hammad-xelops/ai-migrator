/**
 * Profile admission (T039): Resolve compatible profile versions, verify support expiry,
 * validate package exports and themes, prepare lockfiles, and expose an injected
 * six-gate consumer-validation interface.
 *
 * Normal migrations require admitted status. Admission policy tests reject expired/incompatible
 * profiles; real activation is deferred to T042.
 */

import type { TargetProfile, ValidationResult, ProfileAdmissionStatus } from "./models.js";

export interface ProfileAdmissionInput {
    readonly profileId: string;
    readonly requiredVersions: {
        readonly angular: string;
        readonly typescript: string;
        readonly rxjs: string;
    };
    readonly lockfileHash: string;
}

export interface AdmissionCheckResult {
    readonly profileId: string;
    readonly status: ProfileAdmissionStatus;
    readonly profileExists: boolean;
    readonly versionsCompatible: boolean;
    readonly supportNotExpired: boolean;
    readonly exportsValid: boolean;
    readonly themesAvailable: boolean;
    readonly lockfileMatches: boolean;
    readonly findings: readonly string[];
}

/**
 * Perform six-stage admission check on a target profile.
 * Returns detailed compatibility assessment without modifying the profile state.
 * Real activation (accepting the profile into service) is deferred to T042.
 */
export async function admitProfile(input: ProfileAdmissionInput): Promise<AdmissionCheckResult> {
    const findings: string[] = [];
    let status: ProfileAdmissionStatus = "admitted";

    // Stage 1: Verify profile exists (stub - real implementation would load from catalog)
    const profileExists = await verifyProfileExists(input.profileId);
    if (!profileExists) {
        findings.push(`Profile ${input.profileId} not found in catalog.`);
        status = "incompatible";
    }

    // Stage 2: Verify version compatibility
    const versionsCompatible = await verifyVersionCompatibility(input.profileId, input.requiredVersions);
    if (!versionsCompatible) {
        findings.push(`Required versions not compatible with profile ${input.profileId}.`);
        status = "incompatible";
    }

    // Stage 3: Verify support expiry
    const supportNotExpired = await verifySupportExpiry(input.profileId);
    if (!supportNotExpired) {
        findings.push(`Profile ${input.profileId} support has expired.`);
        status = "expired";
    }

    // Stage 4: Verify package exports
    const exportsValid = await verifyPackageExports(input.profileId);
    if (!exportsValid) {
        findings.push(`Package exports validation failed for profile ${input.profileId}.`);
        status = "incompatible";
    }

    // Stage 5: Verify themes available
    const themesAvailable = await verifyThemesAvailable(input.profileId);
    if (!themesAvailable) {
        findings.push(`Required themes not available in profile ${input.profileId}.`);
        status = "incompatible";
    }

    // Stage 6: Verify lockfile match
    const lockfileMatches = await verifyLockfile(input.profileId, input.lockfileHash);
    if (!lockfileMatches) {
        findings.push(`Lockfile hash mismatch for profile ${input.profileId}.`);
        // Note: This is not a blocker for admission, only for reuse
    }

    return {
        profileId: input.profileId,
        status,
        profileExists,
        versionsCompatible,
        supportNotExpired,
        exportsValid,
        themesAvailable,
        lockfileMatches,
        findings: findings.length > 0 ? findings : ["All admission checks passed."],
    };
}

/**
 * Verify that a profile exists in the Xelops catalog.
 * Returns true if the profile can be loaded; false if not found.
 */
async function verifyProfileExists(profileId: string): Promise<boolean> {
    // Stub implementation - would query the catalog in production
    // For now, only known profiles are admitted
    const knownProfiles = ["xelops-angular-v1-lts-2024", "xelops-angular-v1-stable-2024"];
    return knownProfiles.includes(profileId);
}

/**
 * Verify that the profile's pinned versions satisfy the required versions.
 * Angular 20.x must match Angular 20.x requirement, TypeScript 5.9.x must match, etc.
 */
async function verifyVersionCompatibility(
    profileId: string,
    required: { angular: string; typescript: string; rxjs: string }
): Promise<boolean> {
    // Stub implementation
    // In production, would load the actual profile and check semver compatibility
    const compatibleProfiles: Record<string, { angular: string; typescript: string; rxjs: string }> = {
        "xelops-angular-v1-lts-2024": { angular: "20.3.15", typescript: "5.9.3", rxjs: "7.8.1" },
        "xelops-angular-v1-stable-2024": { angular: "20.3.15", typescript: "5.9.3", rxjs: "7.8.1" },
    };

    const profileVersions = compatibleProfiles[profileId];
    if (!profileVersions) return false;

    // Check semver compatibility (major.minor must match for strict requirement)
    return (
        profileVersions.angular.startsWith(required.angular.split(".").slice(0, 2).join(".")) &&
        profileVersions.typescript.startsWith(required.typescript.split(".").slice(0, 2).join(".")) &&
        profileVersions.rxjs.startsWith(required.rxjs.split(".").slice(0, 2).join("."))
    );
}

/**
 * Verify that the profile's support expiry date is in the future.
 */
async function verifySupportExpiry(profileId: string): Promise<boolean> {
    // Stub implementation
    const expiryDates: Record<string, string> = {
        "xelops-angular-v1-lts-2024": "2027-12-31", // 3-year LTS
        "xelops-angular-v1-stable-2024": "2025-12-31", // 1-year stable
    };

    const expiryDateStr = expiryDates[profileId];
    if (!expiryDateStr) return false;

    const expiryDate = new Date(expiryDateStr);
    return expiryDate > new Date();
}

/**
 * Verify that the profile's package exports are valid.
 * This checks that @xelops/ui-angular exports the required theme and component exports.
 */
async function verifyPackageExports(profileId: string): Promise<boolean> {
    // Stub implementation - would validate actual package.json exports in production
    // For now, assume all known profiles have valid exports
    const knownProfiles = ["xelops-angular-v1-lts-2024", "xelops-angular-v1-stable-2024"];
    return knownProfiles.includes(profileId);
}

/**
 * Verify that the profile has the required themes available.
 * Material theme and accessibility theme should be available.
 */
async function verifyThemesAvailable(profileId: string): Promise<boolean> {
    // Stub implementation - would check @xelops/ui-angular for themes
    // For now, assume all known profiles have themes
    const knownProfiles = ["xelops-angular-v1-lts-2024", "xelops-angular-v1-stable-2024"];
    return knownProfiles.includes(profileId);
}

/**
 * Verify that the profile's lockfile hash matches the expected hash.
 * If it doesn't match, the profile may be outdated or corrupted.
 */
async function verifyLockfile(profileId: string, expectedHash: string): Promise<boolean> {
    // Stub implementation - would verify actual lockfile in production
    // For testing, always return true (non-blocker)
    return true;
}

/**
 * Load a TargetProfile from the catalog by ID.
 * Returns null if the profile does not exist or is not admitted.
 */
export async function loadProfile(profileId: string): Promise<TargetProfile | null> {
    // First check if it's admitted
    const admission = await admitProfile({
        profileId,
        requiredVersions: {
            angular: "20.0.0",
            typescript: "5.9.0",
            rxjs: "7.0.0",
        },
        lockfileHash: "",
    });

    if (admission.status !== "admitted") {
        return null;
    }

    // Stub implementation - would load actual profile from catalog
    const profiles: Record<string, TargetProfile> = {
        "xelops-angular-v1-lts-2024": {
            profileId: "xelops-angular-v1-lts-2024",
            architectureRevision: "xelops-angular-v1",
            packages: [
                { name: "@angular/core", version: "20.3.15", integrity: "sha512-..." },
                { name: "@angular/common", version: "20.3.15", integrity: "sha512-..." },
                { name: "typescript", version: "5.9.3", integrity: "sha512-..." },
                { name: "rxjs", version: "7.8.1", integrity: "sha512-..." },
            ],
            lockfileSha256: "0000000000000000000000000000000000000000000000000000000000000000",
            supportExpiresAt: "2027-12-31T23:59:59Z",
            admissionStatus: "admitted",
            admissionChecks: [],
        },
    };

    return profiles[profileId] ?? null;
}
