/**
 * Exporter-owned domain models (data-model.md § Artifact).
 */

export type ArtifactKind = "final" | "diagnostic";

export interface ArtifactEntry {
    readonly path: string;
    readonly sha256: string;
    readonly bytes: number;
}

export interface Artifact {
    readonly kind: ArtifactKind;
    readonly internalRelativePath: string;
    readonly sha256: string;
    readonly bytes: number;
    readonly entries: readonly ArtifactEntry[];
    readonly createdAt: string;
    readonly expiresAt: string;
}
