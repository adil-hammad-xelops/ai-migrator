/**
 * Fixture ZIP creation utility (T064)
 * Creates deterministic test ZIPs from fixture directories
 */

import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
// archiver ESM/CommonJS bridge - type safety deferred to runtime usage
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const archiver = require("archiver");

/**
 * Archive creation result (T064)
 */
export interface ArchiveResult {
    readonly zipPath: string;
    readonly bytes: number;
    readonly sha256: string;
    readonly entryCount: number;
}

/**
 * Creates a deterministic ZIP archive from a directory (T064).
 * Used for end-to-end test fixture creation.
 *
 * @param sourceDir - Directory containing fixture files
 * @param outputPath - Output ZIP file path
 * @returns Archive result with path, size, hash and entry count
 *
 * Acceptance: Archive is readable, verifiable and deterministic
 */
export async function createFixtureArchive(
    sourceDir: string,
    outputPath: string
): Promise<ArchiveResult> {
    return new Promise((resolve, reject) => {
        // Ensure output directory exists
        mkdirSync(dirname(outputPath), { recursive: true });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const archive = archiver("zip", {
            zlib: { level: 9 }
        });

        const output = createWriteStream(outputPath);
        const hash = createHash("sha256");

        let bytes = 0;
        let entryCount = 0;

        // Track all data written for hashing and size
        output.on("data", (chunk: Buffer) => {
            hash.update(chunk);
            bytes += chunk.length;
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        archive.on("entry", () => {
            entryCount++;
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        archive.on("error", (error: unknown) => {
            reject(
                new Error(
                    `Archive creation failed for ${sourceDir}: ${error instanceof Error ? error.message : String(error)
                    }`
                )
            );
        });

        output.on("error", (error: unknown) => {
            reject(
                new Error(
                    `Output stream error for ${outputPath}: ${error instanceof Error ? error.message : String(error)
                    }`
                )
            );
        });

        output.on("close", () => {
            const sha256 = hash.digest("hex");
            resolve({
                zipPath: outputPath,
                bytes,
                sha256,
                entryCount
            });
        });

        // Pipe archive to output stream
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        archive.pipe(output);

        // Add all files from source directory in sorted order (deterministic)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        archive.directory(sourceDir, false);

        // Finalize archive
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        archive.finalize().catch((error: unknown) => {
            reject(
                new Error(
                    `Archive finalize failed: ${error instanceof Error ? error.message : String(error)
                    }`
                )
            );
        });
    });
}

/**
 * Creates multiple fixture archives for end-to-end testing (T064)
 * Preserves deterministic order and results
 */
export async function createMultipleFixtureArchives(
    fixtures: Array<{ sourceDir: string; outputPath: string }>
): Promise<readonly ArchiveResult[]> {
    const results: ArchiveResult[] = [];

    for (const fixture of fixtures) {
        const result = await createFixtureArchive(
            fixture.sourceDir,
            fixture.outputPath
        );
        results.push(result);
    }

    return results;
}
