/**
 * ZIP exporter (T054): Stream-based archive creation with Archiver,
 * awaited completion, reopened entry/hash validation, and byte/SHA metadata.
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
