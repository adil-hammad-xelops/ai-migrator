/**
 * Catalog-owned domain models (data-model.md § CatalogSnapshot, PackageEvidence).
 * The catalog is an immutable external allowlist; these types mirror its actual on-disk
 * shape exactly (selector/importPath/description/inputs/outputs/usage) and never widen it
 * with invented member kinds, types or accessibility metadata the catalog does not state.
 */

export interface CatalogComponentEntry {
    /** The catalog's object key, e.g. "button"; not necessarily unique-checked by JSON itself. */
    readonly id: string;
    readonly selector: string;
    readonly importPath: string;
    readonly description: string;
    readonly usage: string | null;
    readonly inputs: readonly string[];
    readonly outputs: readonly string[];
}

export interface CatalogMetadataDiagnostic {
    readonly entryId: string;
    readonly code: string;
    readonly message: string;
}

export interface CatalogSnapshot {
    readonly revision: string;
    readonly sha256: string;
    readonly rawBytes: string;
    readonly entryCount: number;
    readonly entries: readonly CatalogComponentEntry[];
    readonly metadataDiagnostics: readonly CatalogMetadataDiagnostic[];
}

export type EvidenceProvenance = "package-public-export" | "package-type-declaration";

export interface VerifiedMemberContract {
    readonly entryId: string;
    readonly memberName: string;
    readonly verified: boolean;
    readonly provenance: EvidenceProvenance;
    readonly conflict: string | null;
}

export interface PackageEvidence {
    readonly packageName: string;
    readonly packageVersion: string;
    readonly integrity: string;
    readonly verifiedExports: readonly string[];
    readonly verifiedMembers: readonly VerifiedMemberContract[];
    readonly selectorConflicts: readonly {
        readonly entryId: string;
        readonly catalogSelector: string;
        readonly actualSelector: string;
        readonly reason: string;
    }[];
}

