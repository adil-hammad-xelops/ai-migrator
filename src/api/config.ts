/**
 * Backend runtime configuration (T013). All values are required; there is no
 * insecure default token/path, and a missing/invalid value fails startup loudly.
 */
import { isAbsolute } from "node:path";

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigError";
    }
}

export interface AppConfig {
    readonly authToken: string;
    readonly storeRoot: string;
    readonly containerRuntime: string;
    readonly profile: string;
    readonly host: string;
    readonly port: number;
    /** Compressed upload size cap (spec default 50 MiB). */
    readonly maxCompressedUploadBytes: number;
    /** Aggregate expanded archive size cap (spec default 500 MiB). */
    readonly maxExpandedBytes: number;
    /** Per-file expanded size cap (spec default 20 MiB). */
    readonly maxFileExpandedBytes: number;
    readonly maxArchiveEntries: number;
    readonly maxExpansionRatio: number;
    /** Upload transport timeout in ms (spec default 120 s). */
    readonly uploadTimeoutMs: number;
    /** Maximum accepted-but-not-yet-running jobs (spec default 20). */
    readonly maxQueuedJobs: number;
    /** Total store budget in bytes (spec default 20 GiB). */
    readonly storeCapacityBytes: number;
    /** Bytes reserved so a failure report can always be written even near capacity. */
    readonly storeCapacityHeadroomBytes: number;
    readonly rateLimitPerMinutePerToken: number;
    readonly artifactRetentionMs: number;
    readonly statusRetentionMs: number;
}

function requireNonEmpty(env: NodeJS.ProcessEnv, name: string): string {
    const value = env[name];
    if (value === undefined || value.trim().length === 0) {
        throw new ConfigError(`missing required environment variable "${name}"`);
    }
    return value;
}

function optionalPositiveInt(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
    const raw = env[name];
    if (raw === undefined || raw.trim().length === 0) {
        return fallback;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new ConfigError(`environment variable "${name}" must be a positive integer`);
    }
    return parsed;
}

const MIB = 1024 * 1024;
const GIB = 1024 * MIB;

/** Loads and validates configuration from environment variables; throws on any gap. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
    const authToken = requireNonEmpty(env, "MIGRATOR_AUTH_TOKEN");
    const storeRoot = requireNonEmpty(env, "MIGRATOR_STORE_ROOT");
    if (!isAbsolute(storeRoot)) {
        throw new ConfigError('"MIGRATOR_STORE_ROOT" must be an absolute path');
    }
    const containerRuntime = requireNonEmpty(env, "MIGRATOR_CONTAINER_RUNTIME");
    const profile = requireNonEmpty(env, "MIGRATOR_PROFILE");
    const host = env["MIGRATOR_HOST"] ?? "127.0.0.1";
    const port = optionalPositiveInt(env, "MIGRATOR_PORT", 3000);
    if (port > 65535) {
        throw new ConfigError('"MIGRATOR_PORT" must be a valid TCP port');
    }

    return {
        authToken,
        storeRoot,
        containerRuntime,
        profile,
        host,
        port,
        maxCompressedUploadBytes: optionalPositiveInt(env, "MIGRATOR_MAX_COMPRESSED_UPLOAD_BYTES", 50 * MIB),
        maxExpandedBytes: optionalPositiveInt(env, "MIGRATOR_MAX_EXPANDED_BYTES", 500 * MIB),
        maxFileExpandedBytes: optionalPositiveInt(env, "MIGRATOR_MAX_FILE_EXPANDED_BYTES", 20 * MIB),
        maxArchiveEntries: optionalPositiveInt(env, "MIGRATOR_MAX_ARCHIVE_ENTRIES", 10_000),
        maxExpansionRatio: optionalPositiveInt(env, "MIGRATOR_MAX_EXPANSION_RATIO", 100),
        uploadTimeoutMs: optionalPositiveInt(env, "MIGRATOR_UPLOAD_TIMEOUT_MS", 120_000),
        maxQueuedJobs: optionalPositiveInt(env, "MIGRATOR_MAX_QUEUED_JOBS", 20),
        storeCapacityBytes: optionalPositiveInt(env, "MIGRATOR_STORE_CAPACITY_BYTES", 20 * GIB),
        storeCapacityHeadroomBytes: optionalPositiveInt(env, "MIGRATOR_STORE_CAPACITY_HEADROOM_BYTES", 1 * GIB),
        rateLimitPerMinutePerToken: optionalPositiveInt(env, "MIGRATOR_RATE_LIMIT_PER_MINUTE", 5),
        artifactRetentionMs: optionalPositiveInt(env, "MIGRATOR_ARTIFACT_RETENTION_MS", 24 * 60 * 60 * 1000),
        statusRetentionMs: optionalPositiveInt(env, "MIGRATOR_STATUS_RETENTION_MS", 7 * 24 * 60 * 60 * 1000)
    };
}
