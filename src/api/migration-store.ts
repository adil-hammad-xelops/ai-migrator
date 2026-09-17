/**
 * Durable job store (T011): jobs/<uuid>/{receipt.json,journal/,source/,work/,revisions/}.
 * One process holds an exclusive store lock. All durable writes go through a
 * write-temp-fsync-rename sequence; publication is a single atomic pointer swap so a
 * crash mid-write never exposes a partial report or a falsely completed job.
 */
import { randomUUID } from "node:crypto";
import { mkdir, open, rename, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import type { FileHandle } from "node:fs/promises";
import type { JobReceipt } from "./contracts.js";
import { decodeJobReceipt } from "./contract-decoders.js";

export class MigrationStoreError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MigrationStoreError";
    }
}

const LOCK_FILE_NAME = ".migrator.lock";
const RECEIPT_FILE_NAME = "receipt.json";
const PUBLISHED_POINTER_FILE_NAME = "published.json";

function jobDir(root: string, migrationId: string): string {
    return path.join(root, "jobs", migrationId);
}

/** Durably fsyncs file contents, then renames into place, then fsyncs the directory entry. */
async function atomicWriteFile(filePath: string, data: string | Buffer): Promise<void> {
    const dir = path.dirname(filePath);
    const tmpPath = path.join(dir, `.tmp-${randomUUID()}`);
    let handle: FileHandle | undefined;
    try {
        handle = await open(tmpPath, "w");
        await handle.writeFile(data);
        await handle.sync();
    } finally {
        await handle?.close();
    }
    await rename(tmpPath, filePath);
    // Directory fsync is a POSIX durability guarantee; Windows has no equivalent and
    // rejects it with EPERM. Best-effort only — production targets Linux (plan.md).
    const dirHandle = await open(dir, "r");
    try {
        await dirHandle.sync();
    } catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== "EPERM") {
            throw error;
        }
    } finally {
        await dirHandle.close();
    }
}

async function pathExists(target: string): Promise<boolean> {
    try {
        await stat(target);
        return true;
    } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            return false;
        }
        throw error;
    }
}

function isProcessAlive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ESRCH") {
            return false;
        }
        // EPERM means it exists but we lack permission to signal it: treat as alive.
        return true;
    }
}

async function acquireExclusiveLock(root: string): Promise<void> {
    await mkdir(root, { recursive: true });
    const lockPath = path.join(root, LOCK_FILE_NAME);
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const handle = await open(lockPath, "wx");
            try {
                await handle.writeFile(String(process.pid));
                await handle.sync();
            } finally {
                await handle.close();
            }
            return;
        } catch (error) {
            if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") {
                throw error;
            }
            const existingPid = Number.parseInt((await readFile(lockPath, "utf8")).trim(), 10);
            if (Number.isInteger(existingPid) && isProcessAlive(existingPid)) {
                throw new MigrationStoreError(
                    `store at "${root}" is already locked by running process ${existingPid}`
                );
            }
            // Stale lock from a dead process: remove it and retry once.
            await rm(lockPath, { force: true });
        }
    }
    throw new MigrationStoreError(`unable to acquire exclusive lock at "${lockPath}"`);
}

export interface MigrationStore {
    readonly root: string;
    readonly sourceDir: (migrationId: string) => string;
    readonly workDir: (migrationId: string) => string;
    readonly journalDir: (migrationId: string) => string;
    createJob(migrationId: string, initialReceipt: JobReceipt): Promise<void>;
    jobExists(migrationId: string): Promise<boolean>;
    writeReceipt(migrationId: string, receipt: JobReceipt): Promise<void>;
    readReceipt(migrationId: string): Promise<JobReceipt>;
    /**
     * Writes revision content, then atomically swaps the published pointer to it.
     * Consumers only ever observe `publishedRevisionId`; content written before the
     * pointer swap (or a swap interrupted mid-write via `atomicWriteFile`) is invisible.
     */
    publishRevision(
        migrationId: string,
        revisionId: string,
        files: ReadonlyMap<string, string | Buffer>
    ): Promise<void>;
    publishedRevisionId(migrationId: string): Promise<string | null>;
    readPublishedFile(migrationId: string, relativePath: string): Promise<Buffer | null>;
    close(): Promise<void>;
}

class FsMigrationStore implements MigrationStore {
    public constructor(public readonly root: string) { }

    public sourceDir = (migrationId: string): string => path.join(jobDir(this.root, migrationId), "source");
    public workDir = (migrationId: string): string => path.join(jobDir(this.root, migrationId), "work");
    public journalDir = (migrationId: string): string => path.join(jobDir(this.root, migrationId), "journal");

    private revisionsDir(migrationId: string): string {
        return path.join(jobDir(this.root, migrationId), "revisions");
    }

    public async createJob(migrationId: string, initialReceipt: JobReceipt): Promise<void> {
        const dir = jobDir(this.root, migrationId);
        if (await pathExists(dir)) {
            throw new MigrationStoreError(`job "${migrationId}" already exists`);
        }
        await mkdir(this.sourceDir(migrationId), { recursive: true });
        await mkdir(this.workDir(migrationId), { recursive: true });
        await mkdir(this.journalDir(migrationId), { recursive: true });
        await mkdir(this.revisionsDir(migrationId), { recursive: true });
        await this.writeReceipt(migrationId, initialReceipt);
    }

    public async jobExists(migrationId: string): Promise<boolean> {
        return pathExists(jobDir(this.root, migrationId));
    }

    public async writeReceipt(migrationId: string, receipt: JobReceipt): Promise<void> {
        const dir = jobDir(this.root, migrationId);
        if (!(await pathExists(dir))) {
            throw new MigrationStoreError(`job "${migrationId}" does not exist`);
        }
        await atomicWriteFile(path.join(dir, RECEIPT_FILE_NAME), JSON.stringify(receipt, null, 2));
    }

    public async readReceipt(migrationId: string): Promise<JobReceipt> {
        const dir = jobDir(this.root, migrationId);
        let raw: string;
        try {
            raw = await readFile(path.join(dir, RECEIPT_FILE_NAME), "utf8");
        } catch (error) {
            throw new MigrationStoreError(
                `job "${migrationId}" has no readable receipt: ${error instanceof Error ? error.message : String(error)}`
            );
        }
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            throw new MigrationStoreError(
                `job "${migrationId}" receipt is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
            );
        }
        return decodeJobReceipt(parsed);
    }

    public async publishRevision(
        migrationId: string,
        revisionId: string,
        files: ReadonlyMap<string, string | Buffer>
    ): Promise<void> {
        const revisionDir = path.join(this.revisionsDir(migrationId), revisionId);
        if (await pathExists(revisionDir)) {
            throw new MigrationStoreError(`revision "${revisionId}" already exists for job "${migrationId}"`);
        }
        await mkdir(revisionDir, { recursive: true });
        for (const [relativePath, content] of files) {
            if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
                throw new MigrationStoreError(`refusing unsafe revision file path "${relativePath}"`);
            }
            const targetPath = path.join(revisionDir, relativePath);
            await mkdir(path.dirname(targetPath), { recursive: true });
            await atomicWriteFile(targetPath, content);
        }
        // Only after every file is durably written does the pointer move: this is the
        // single moment a revision becomes visible/"published".
        await atomicWriteFile(
            path.join(this.revisionsDir(migrationId), PUBLISHED_POINTER_FILE_NAME),
            JSON.stringify({ revisionId }, null, 2)
        );
    }

    public async publishedRevisionId(migrationId: string): Promise<string | null> {
        const pointerPath = path.join(this.revisionsDir(migrationId), PUBLISHED_POINTER_FILE_NAME);
        let raw: string;
        try {
            raw = await readFile(pointerPath, "utf8");
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "ENOENT") {
                return null;
            }
            throw error;
        }
        const parsed: unknown = JSON.parse(raw);
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed) ||
            typeof (parsed as Record<string, unknown>)["revisionId"] !== "string"
        ) {
            throw new MigrationStoreError(`corrupt published pointer for job "${migrationId}"`);
        }
        return (parsed as Record<string, unknown>)["revisionId"] as string;
    }

    public async readPublishedFile(migrationId: string, relativePath: string): Promise<Buffer | null> {
        if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
            throw new MigrationStoreError(`refusing unsafe read path "${relativePath}"`);
        }
        const revisionId = await this.publishedRevisionId(migrationId);
        if (revisionId === null) {
            return null;
        }
        const filePath = path.join(this.revisionsDir(migrationId), revisionId, relativePath);
        try {
            return await readFile(filePath);
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    public async close(): Promise<void> {
        await rm(path.join(this.root, LOCK_FILE_NAME), { force: true });
    }
}

/** Opens the store, acquiring the single-process exclusive lock (throws if already held). */
export async function openMigrationStore(root: string): Promise<MigrationStore> {
    await acquireExclusiveLock(root);
    return new FsMigrationStore(root);
}
