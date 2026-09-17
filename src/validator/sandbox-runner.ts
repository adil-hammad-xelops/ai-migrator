/**
 * Disposable, unprivileged Linux container execution for validator gates (T014/T015).
 * Every invocation runs `docker` with an explicit argv (never a shell) so there is no
 * host-execution fallback path if isolation is unavailable; if `docker` itself is
 * missing/unreachable the call fails, it never silently runs on the host.
 */
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import type { ValidationGate } from "./models.js";

export class SandboxError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SandboxError";
    }
}

/** Plan.md § Constraints: authoritative per-gate budgets (minutes converted to ms). */
export const PHASE_TIMEOUTS_MS: Readonly<Record<ValidationGate, number>> = {
    installation: 10 * 60_000,
    typescript: 2 * 60_000,
    "angular-build": 5 * 60_000,
    lint: 2 * 60_000,
    tests: 5 * 60_000,
    "xelops-compliance": 2 * 60_000
};

/** Plan.md § Constraints: the authoritative ceiling across the whole job, not just gates. */
export const TOTAL_JOB_BUDGET_MS = 30 * 60_000;

export const MAX_RETAINED_DIAGNOSTIC_BYTES = 1 * 1024 * 1024;

export interface SandboxResourceLimits {
    readonly cpus: number;
    readonly memoryBytes: number;
    readonly pidsLimit: number;
}

export const DEFAULT_SANDBOX_RESOURCE_LIMITS: SandboxResourceLimits = {
    cpus: 2,
    memoryBytes: 4 * 1024 * 1024 * 1024,
    pidsLimit: 256
};

export interface SandboxPhaseRequest {
    readonly phase: ValidationGate;
    readonly image: string;
    /** Explicit argv executed directly inside the container; never a shell string. */
    readonly command: readonly string[];
    /** Mounted read-only at /workspace/app. */
    readonly sourceDir: string;
    /** Mounted read-write at /workspace/work; the container's working directory. */
    readonly workDir: string;
    /** Only the `installation` gate may set this true (registry access for `npm ci`). */
    readonly networkEnabled: boolean;
    readonly env?: Readonly<Record<string, string>>;
    readonly timeoutMs?: number;
    readonly resourceLimits?: SandboxResourceLimits;
    /** Secret values to redact from captured diagnostics (e.g. registry auth tokens). */
    readonly redactSecrets?: readonly string[];
}

export interface SandboxPhaseResult {
    readonly phase: ValidationGate;
    readonly exitCode: number | null;
    readonly timedOut: boolean;
    readonly durationMs: number;
    readonly stdout: string;
    readonly stderr: string;
}

function redact(text: string, secrets: readonly string[]): string {
    let result = text;
    for (const secret of secrets) {
        if (secret.length === 0) {
            continue;
        }
        result = result.split(secret).join("***REDACTED***");
    }
    return result;
}

/** Truncates to `maxBytes` (UTF-8), appending a marker so truncation is never silent. */
function boundOutput(text: string, maxBytes: number): string {
    const buffer = Buffer.from(text, "utf8");
    if (buffer.length <= maxBytes) {
        return text;
    }
    return `${buffer.subarray(0, maxBytes).toString("utf8")}\n...[truncated, ${String(buffer.length)} bytes total]`;
}

function buildDockerArgs(request: SandboxPhaseRequest, containerName: string): string[] {
    const limits = request.resourceLimits ?? DEFAULT_SANDBOX_RESOURCE_LIMITS;
    const args: string[] = [
        "run",
        "--rm",
        "--init",
        "--name",
        containerName,
        "--user",
        "10001:10001",
        "--read-only",
        "--cap-drop=ALL",
        "--security-opt",
        "no-new-privileges",
        "--pids-limit",
        String(limits.pidsLimit),
        "--cpus",
        String(limits.cpus),
        "--memory",
        String(limits.memoryBytes),
        "--network",
        request.networkEnabled ? "bridge" : "none",
        "--tmpfs",
        "/tmp:rw,size=256m",
        "-v",
        `${request.sourceDir}:/workspace/app:ro`,
        "-v",
        `${request.workDir}:/workspace/work:rw`,
        "-w",
        "/workspace/work"
    ];
    for (const [key, value] of Object.entries(request.env ?? {})) {
        args.push("-e", `${key}=${value}`);
    }
    args.push(request.image, ...request.command);
    return args;
}

/** Best-effort `docker kill` so a timeout terminates the whole container process tree. */
function killContainer(containerName: string): void {
    const killer = spawn("docker", ["kill", containerName], { stdio: "ignore" });
    killer.on("error", () => {
        // Container may already be gone (--rm); nothing further to do.
    });
}

/**
 * Runs one validator gate's command inside a disposable container. Never falls back to
 * host execution: if `docker` cannot be spawned at all, this rejects with `SandboxError`.
 */
export async function runSandboxPhase(request: SandboxPhaseRequest): Promise<SandboxPhaseResult> {
    const containerName = `xelops-migrator-${request.phase}-${randomUUID()}`;
    const timeoutMs = request.timeoutMs ?? PHASE_TIMEOUTS_MS[request.phase];
    const args = buildDockerArgs(request, containerName);
    const secrets = request.redactSecrets ?? [];

    const startedAt = Date.now();
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;

    return new Promise<SandboxPhaseResult>((resolve, reject) => {
        let child;
        try {
            child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"], shell: false });
        } catch (error) {
            reject(
                new SandboxError(
                    `unable to start disposable sandbox container: ${error instanceof Error ? error.message : String(error)}`
                )
            );
            return;
        }

        let timedOut = false;
        let settled = false;
        const timer = setTimeout(() => {
            timedOut = true;
            killContainer(containerName);
            child.kill("SIGKILL");
        }, timeoutMs);

        child.stdout.on("data", (chunk: Buffer) => {
            if (stdoutBytes < MAX_RETAINED_DIAGNOSTIC_BYTES) {
                stdoutChunks.push(chunk);
                stdoutBytes += chunk.length;
            }
        });
        child.stderr.on("data", (chunk: Buffer) => {
            if (stderrBytes < MAX_RETAINED_DIAGNOSTIC_BYTES) {
                stderrChunks.push(chunk);
                stderrBytes += chunk.length;
            }
        });

        child.on("error", (error) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            reject(new SandboxError(`docker invocation failed: ${error.message}`));
        });

        child.on("close", (exitCode) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            const stdout = boundOutput(
                redact(Buffer.concat(stdoutChunks).toString("utf8"), secrets),
                MAX_RETAINED_DIAGNOSTIC_BYTES
            );
            const stderr = boundOutput(
                redact(Buffer.concat(stderrChunks).toString("utf8"), secrets),
                MAX_RETAINED_DIAGNOSTIC_BYTES
            );
            resolve({
                phase: request.phase,
                exitCode,
                timedOut,
                durationMs: Date.now() - startedAt,
                stdout,
                stderr
            });
        });
    });
}
