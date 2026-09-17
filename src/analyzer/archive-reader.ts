/**
 * Safe ZIP extraction (T012). Lazy yauzl entry iteration; rejects traversal,
 * absolute/drive/UNC paths, symlinks/special files, duplicate/case-colliding
 * destinations and encrypted entries. Enforces real streamed byte counts, not just
 * declared header sizes, against per-file/aggregate/ratio quotas.
 */
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import * as yauzl from "yauzl";
import type { Entry, ZipFile } from "yauzl";

export class ArchiveSecurityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ArchiveSecurityError";
    }
}

export interface ArchiveLimits {
    readonly maxCompressedBytes: number;
    readonly maxExpandedBytes: number;
    readonly maxFileExpandedBytes: number;
    readonly maxEntries: number;
    readonly maxExpansionRatio: number;
}

export const DEFAULT_ARCHIVE_LIMITS: ArchiveLimits = {
    maxCompressedBytes: 50 * 1024 * 1024,
    maxExpandedBytes: 500 * 1024 * 1024,
    maxFileExpandedBytes: 20 * 1024 * 1024,
    maxEntries: 10_000,
    maxExpansionRatio: 100
};

export interface ExtractedArchiveFile {
    readonly relativePath: string;
    readonly bytes: number;
    readonly sha256: string;
}

const UNIX_MODE_FILE_TYPE_MASK = 0xf000;
const UNIX_MODE_REGULAR_FILE = 0x8000;

/** Rejects empty/absolute/drive/UNC/backslash paths and `..` traversal segments. */
function validateEntryName(fileName: string): void {
    if (fileName.length === 0) {
        throw new ArchiveSecurityError("archive entry has an empty name");
    }
    if (fileName.startsWith("/") || /^[a-zA-Z]:/.test(fileName) || fileName.startsWith("\\\\")) {
        throw new ArchiveSecurityError(`entry "${fileName}" uses an absolute/drive/UNC path`);
    }
    if (fileName.includes("\\")) {
        throw new ArchiveSecurityError(`entry "${fileName}" contains a backslash`);
    }
    if (fileName.split("/").some((segment) => segment === "..")) {
        throw new ArchiveSecurityError(`entry "${fileName}" contains a traversal segment`);
    }
}

/** Rejects symlinks, devices, FIFOs and sockets; a mode of 0 (unset) is treated as a regular file. */
function assertRegularFileMode(fileName: string, externalFileAttributes: number): void {
    const unixMode = (externalFileAttributes >>> 16) & 0xffff;
    const fileType = unixMode & UNIX_MODE_FILE_TYPE_MASK;
    if (fileType !== 0 && fileType !== UNIX_MODE_REGULAR_FILE) {
        throw new ArchiveSecurityError(
            `entry "${fileName}" is not a regular file (unix mode 0${fileType.toString(8)})`
        );
    }
}

/** Hard-stops a stream once actual bytes exceed a per-file cap, independent of header claims. */
class ByteCountingLimiter extends Transform {
    private bytesRead = 0;
    public readonly hash = createHash("sha256");

    public constructor(
        private readonly fileName: string,
        private readonly maxBytes: number
    ) {
        super();
    }

    public get bytes(): number {
        return this.bytesRead;
    }

    public override _transform(chunk: Buffer, _encoding: string, callback: (error?: Error) => void): void {
        this.bytesRead += chunk.length;
        if (this.bytesRead > this.maxBytes) {
            callback(
                new ArchiveSecurityError(
                    `entry "${this.fileName}" streamed beyond its declared/allowed size (>${this.maxBytes} bytes)`
                )
            );
            return;
        }
        this.hash.update(chunk);
        this.push(chunk);
        callback();
    }
}

async function processEntries(
    zipFile: ZipFile,
    resolvedRoot: string,
    limits: ArchiveLimits
): Promise<readonly ExtractedArchiveFile[]> {
    const results: ExtractedArchiveFile[] = [];
    const seenLowerCasePaths = new Set<string>();
    let totalExpandedBytes = 0;
    let totalCompressedBytesClaimed = 0;

    for await (const entry of zipFile.eachEntry()) {
        validateEntryName(entry.fileName);
        if (entry.isEncrypted()) {
            throw new ArchiveSecurityError(`entry "${entry.fileName}" is encrypted`);
        }
        const isDirectoryEntry = entry.fileName.endsWith("/");
        assertRegularFileMode(entry.fileName, entry.externalFileAttributes);

        const lowerKey = entry.fileName.toLowerCase();
        if (seenLowerCasePaths.has(lowerKey)) {
            throw new ArchiveSecurityError(`duplicate or case-colliding path "${entry.fileName}"`);
        }
        seenLowerCasePaths.add(lowerKey);

        const destinationPath = path.resolve(resolvedRoot, entry.fileName);
        if (destinationPath !== resolvedRoot && !destinationPath.startsWith(resolvedRoot + path.sep)) {
            throw new ArchiveSecurityError(`entry "${entry.fileName}" escapes the destination root`);
        }

        if (isDirectoryEntry) {
            await mkdir(destinationPath, { recursive: true });
            continue;
        }

        if (entry.uncompressedSize > limits.maxFileExpandedBytes) {
            throw new ArchiveSecurityError(
                `entry "${entry.fileName}" declares ${entry.uncompressedSize} bytes, exceeding the per-file limit`
            );
        }
        totalExpandedBytes += entry.uncompressedSize;
        if (totalExpandedBytes > limits.maxExpandedBytes) {
            throw new ArchiveSecurityError("archive exceeds the aggregate expanded byte limit");
        }
        totalCompressedBytesClaimed += Math.max(entry.compressedSize, 1);
        if (totalExpandedBytes / totalCompressedBytesClaimed > limits.maxExpansionRatio) {
            throw new ArchiveSecurityError("archive exceeds the maximum expansion ratio");
        }

        await mkdir(path.dirname(destinationPath), { recursive: true });
        const readStream = await zipFile.openReadStreamPromise(entry);
        const limiter = new ByteCountingLimiter(entry.fileName, limits.maxFileExpandedBytes);
        await pipeline(readStream, limiter, createWriteStream(destinationPath));

        results.push({
            relativePath: entry.fileName,
            bytes: limiter.bytes,
            sha256: limiter.hash.digest("hex")
        });
    }

    return results;
}

/**
 * Safely extracts `zipFilePath` under `destinationRoot`. Every written destination is
 * verified to remain under the resolved root, including against malicious archives.
 */
export async function extractArchiveSafely(
    zipFilePath: string,
    destinationRoot: string,
    limits: ArchiveLimits = DEFAULT_ARCHIVE_LIMITS
): Promise<readonly ExtractedArchiveFile[]> {
    const stats = await stat(zipFilePath);
    if (stats.size > limits.maxCompressedBytes) {
        throw new ArchiveSecurityError(
            `archive is ${stats.size} bytes, exceeding the max compressed size of ${limits.maxCompressedBytes}`
        );
    }

    const resolvedRoot = path.resolve(destinationRoot);
    await mkdir(resolvedRoot, { recursive: true });

    const zipFile = await yauzl.openPromise(zipFilePath, {
        lazyEntries: true,
        strictFileNames: true,
        validateEntrySizes: true,
        decodeStrings: true
    });
    try {
        if (zipFile.entryCount > limits.maxEntries) {
            throw new ArchiveSecurityError(
                `archive declares ${zipFile.entryCount} entries, exceeding the limit of ${limits.maxEntries}`
            );
        }
        return await processEntries(zipFile, resolvedRoot, limits);
    } catch (error) {
        // yauzl itself rejects some malformed/malicious structures (e.g. `strictFileNames`
        // traversal checks) before our own validation runs; normalize those into the same
        // error type as long as they are not a real system I/O failure (which has `.code`).
        if (error instanceof ArchiveSecurityError || (error instanceof Error && "code" in error)) {
            throw error;
        }
        throw new ArchiveSecurityError(
            `archive rejected: ${error instanceof Error ? error.message : String(error)}`
        );
    } finally {
        zipFile.close();
    }
}

export type { Entry as ArchiveEntry };
