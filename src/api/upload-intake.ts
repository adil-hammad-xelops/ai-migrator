/**
 * Streams one project upload durably before accepting it (T013). Truncated transport
 * is rejected; a fully-received corrupt ZIP is still accepted (analysis reports the
 * corruption later) since intake never inspects archive structure.
 */
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, open, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { AppConfig } from "./config.js";
import type { MigrationStore } from "./migration-store.js";

export type IntakeRejectionCode =
    | "PAYLOAD_TOO_LARGE"
    | "UPLOAD_TIMEOUT"
    | "TRUNCATED_UPLOAD"
    | "QUEUE_FULL"
    | "STORAGE_UNAVAILABLE";

export class UploadRejectedError extends Error {
    public constructor(
        public readonly code: IntakeRejectionCode,
        message: string
    ) {
        super(message);
        this.name = "UploadRejectedError";
    }
}

export interface QueueSnapshot {
    readonly queuedJobCount: number;
}

export interface UploadIntakeDeps {
    readonly config: AppConfig;
    readonly store: MigrationStore;
    getQueueSnapshot(): Promise<QueueSnapshot>;
    getStoreUsedBytes(): Promise<number>;
}

export interface ReceivedUpload {
    readonly path: string;
    readonly bytes: number;
    readonly sha256: string;
}

/** Recursively sums real file sizes under `root` (used for the store capacity check). */
export async function computeStoreUsedBytes(root: string): Promise<number> {
    let total = 0;
    let entries;
    try {
        entries = await readdir(root, { withFileTypes: true });
    } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            return 0;
        }
        throw error;
    }
    for (const entry of entries) {
        const entryPath = path.join(root, entry.name);
        if (entry.isDirectory()) {
            total += await computeStoreUsedBytes(entryPath);
        } else if (entry.isFile()) {
            total += (await stat(entryPath)).size;
        }
    }
    return total;
}

class UploadByteLimiter extends Transform {
    private bytesRead = 0;
    public readonly hash = createHash("sha256");

    public constructor(private readonly maxBytes: number) {
        super();
    }

    public get bytes(): number {
        return this.bytesRead;
    }

    public override _transform(chunk: Buffer, _encoding: string, callback: (error?: Error) => void): void {
        this.bytesRead += chunk.length;
        if (this.bytesRead > this.maxBytes) {
            callback(new UploadRejectedError("PAYLOAD_TOO_LARGE", `upload exceeds ${this.maxBytes} bytes`));
            return;
        }
        this.hash.update(chunk);
        this.push(chunk);
        callback();
    }
}

const UPLOAD_FILE_NAME = "upload.zip";

/**
 * Streams `fileStream` into durable storage under `migrationId`'s source directory.
 * `isTruncated` must reflect the upstream transport's own truncation signal (e.g. a
 * multipart file's `file.truncated` flag) after the stream ends.
 */
export async function receiveProjectUpload(
    migrationId: string,
    fileStream: NodeJS.ReadableStream,
    isTruncated: () => boolean,
    deps: UploadIntakeDeps
): Promise<ReceivedUpload> {
    const queueSnapshot = await deps.getQueueSnapshot();
    if (queueSnapshot.queuedJobCount >= deps.config.maxQueuedJobs) {
        throw new UploadRejectedError(
            "QUEUE_FULL",
            `queue is full (${String(deps.config.maxQueuedJobs)} jobs already accepted)`
        );
    }

    const usedBytes = await deps.getStoreUsedBytes();
    if (usedBytes + deps.config.storeCapacityHeadroomBytes >= deps.config.storeCapacityBytes) {
        throw new UploadRejectedError("STORAGE_UNAVAILABLE", "durable storage capacity is exhausted");
    }

    const destDir = deps.store.sourceDir(migrationId);
    await mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, UPLOAD_FILE_NAME);
    const tmpPath = `${destPath}.partial`;

    const timeoutState: { timedOut: boolean } = { timedOut: false };
    const abortController = new AbortController();
    const timer = setTimeout(() => {
        timeoutState.timedOut = true;
        abortController.abort();
    }, deps.config.uploadTimeoutMs);

    const limiter = new UploadByteLimiter(deps.config.maxCompressedUploadBytes);
    try {
        await pipeline(fileStream, limiter, createWriteStream(tmpPath), { signal: abortController.signal });
    } catch (error) {
        await rm(tmpPath, { force: true });
        if (error instanceof UploadRejectedError) {
            throw error;
        }
        if (timeoutState.timedOut) {
            throw new UploadRejectedError(
                "UPLOAD_TIMEOUT",
                `upload did not complete within ${String(deps.config.uploadTimeoutMs)}ms`
            );
        }
        throw new UploadRejectedError(
            "TRUNCATED_UPLOAD",
            `upload transport failed: ${error instanceof Error ? error.message : String(error)}`
        );
    } finally {
        clearTimeout(timer);
    }

    if (isTruncated()) {
        await rm(tmpPath, { force: true });
        throw new UploadRejectedError("TRUNCATED_UPLOAD", "upload was truncated by the transport");
    }

    await rename(tmpPath, destPath);
    // Best-effort directory fsync for durability before the caller returns 202; Windows
    // has no directory-fsync equivalent (see migration-store.ts for the same trade-off).
    const dirHandle = await open(destDir, "r");
    try {
        await dirHandle.sync();
    } catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== "EPERM") {
            throw error;
        }
    } finally {
        await dirHandle.close();
    }

    return { path: destPath, bytes: limiter.bytes, sha256: limiter.hash.digest("hex") };
}
