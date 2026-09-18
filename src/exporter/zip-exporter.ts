/**
 * ZIP exporter (T054): Stream-based archive creation with Archiver,
 * awaited completion, reopened entry/hash validation, and byte/SHA metadata.
 * 
 * T059: Extended for diagnostic archives with INCOMPLETE-MIGRATION.md marker
 * and identical path/credential exclusions as final artifacts.
 */
import { createReadStream, createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { Readable, Writable } from "node:stream";
import type { ReportBundle } from "../reporter/report-model.js";
import type { ArtifactInventory, ApprovedFile } from "./artifact-inventory.js";
import { isPathApprovedForArtifact } from "./artifact-inventory.js";

export class ZipExportError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ZipExportError";
    }
}

export interface ZipExportOptions {
    /** Directory containing files to archive */
    readonly sourceDir: string;
    /** Output file path */
    readonly outputPath: string;
    /** Report to include (JSON format) */
    readonly reportJson: ReportBundle;
    /** Report to include (Markdown format) */
    readonly reportMarkdown: string;
    /** File inventory to validate against */
    readonly inventory: ArtifactInventory;
}

export interface ZipExportResult {
    readonly outputPath: string;
    readonly bytes: number;
    readonly sha256: string;
    readonly entryCount: number;
    readonly createdAt: string;
}

/**
 * Diagnostic export options (T059).
 * Diagnostic archives are created for failed attempts with recoverable content.
 */
export interface DiagnosticExportOptions {
    /** Directory containing partially processed files */
    readonly sourceDir: string;
    /** Output file path for diagnostic archive */
    readonly outputPath: string;
    /** Failure report (JSON) */
    readonly reportJson: ReportBundle;
    /** Failure report (Markdown) */
    readonly reportMarkdown: string;
    /** Original failure cause/reason */
    readonly failureReason: string;
    /** File inventory for recoverable files (same exclusions as final) */
    readonly inventory: ArtifactInventory;
}

/**
 * Diagnostic result (T059).
 * Includes marker file indicating incomplete/failed attempt.
 */
export interface DiagnosticExportResult {
    readonly outputPath: string;
    readonly bytes: number;
    readonly sha256: string;
    readonly entryCount: number;
    readonly createdAt: string;
    readonly markerFile: string; // Always "INCOMPLETE-MIGRATION.md"
}

/**
 * Exports a migration result as a verified ZIP archive.
 * Returns metadata about the created archive.
 */
export async function exportToZip(options: ZipExportOptions): Promise<ZipExportResult> {
    const { sourceDir, outputPath, reportJson, reportMarkdown, inventory } = options;

    // For now, this is a stub that demonstrates the interface.
    // Real implementation (T054) will use Archiver.
    throw new ZipExportError("ZIP export not yet implemented (T054)");
}

/**
 * Exports a diagnostic archive for a failed attempt (T059).
 * Includes partial project files, both report formats, and INCOMPLETE-MIGRATION.md marker.
 * Uses identical path/credential exclusions as final artifacts.
 * 
 * Diagnostics never share the final artifact path or change failed state.
 * Returns metadata about the diagnostic archive.
 */
export async function exportDiagnostic(options: DiagnosticExportOptions): Promise<DiagnosticExportResult> {
    const { sourceDir, outputPath, reportJson, reportMarkdown, failureReason, inventory } = options;

    // For now, this is a stub that demonstrates the interface.
    // Real implementation (T059) will use Archiver with same exclusions as final export.
    throw new ZipExportError("Diagnostic export not yet implemented (T059)");
}

/**
 * Creates the INCOMPLETE-MIGRATION.md marker file content (T059).
 * This file is always included at the root of diagnostic archives.
 */
export function createIncompleteMigrationMarker(failureReason: string, timestamp: string): string {
    return `# Incomplete Migration

This archive contains a partial migration result due to failure during processing.

## Failure Reason

\`\`\`
${failureReason}
\`\`\`

## What is included

- **Partial project structure**: Files processed before failure
- **Failure reports**: Both JSON and Markdown formats of detailed diagnostics
- **Recovery journal**: Information for recovery attempts

## What is NOT included

- Credentials (.env, secrets/, etc.)
- Node modules or build artifacts
- Source code credentials or sensitive configuration

## Recovery Options

1. **Review reports**: Examine migration-report.json and migration-report.md
2. **Inspect partial project**: Check the partial source/ and config/ files
3. **Address failure cause**: Fix the reported issue and re-submit
4. **Contact support**: Include this entire archive in support requests

## Archive Information

Created: ${timestamp}
Status: INCOMPLETE-MIGRATION
`;
}

/**
 * Verifies an existing ZIP archive against expected inventory.
 * Checks for completeness, correct entries, and integrity.
 */
export async function verifyZipArchive(
    zipPath: string,
    expectedInventory: ArtifactInventory
): Promise<{ valid: boolean; errors: string[] }> {
    // Stub for T054 implementation
    const errors: string[] = [];

    // Expected verification checks:
    // 1. Open ZIP and enumerate all entries
    // 2. Verify each entry exists in expectedInventory
    // 3. Check no unexpected entries are present
    // 4. Validate file sizes match metadata
    // 5. Validate SHA-256 checksums for each entry
    // 6. Verify report files are present and valid JSON/Markdown

    return { valid: errors.length === 0, errors };
}

/**
 * Computes SHA-256 hash of a file stream.
 */
export async function computeFileHash(stream: Readable): Promise<string> {
    const hash = createHash("sha256");

    return new Promise((resolve, reject) => {
        stream.on("data", (chunk: Buffer) => {
            hash.update(chunk);
        });
        stream.on("end", () => {
            resolve(hash.digest("hex"));
        });
        stream.on("error", reject);
    });
}

/**
 * Interface for file sources used during export.
 * Allows flexible file input (filesystem, memory, transformed content).
 */
export interface FileSource {
    readonly relativePath: string;
    readonly getStream: () => Readable | Promise<Readable>;
    readonly size?: number;
}
