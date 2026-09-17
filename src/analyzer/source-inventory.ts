/**
 * Source inventory (T021): enumerates every application-owned file under the submitted
 * root — not just `src/` — classifies it, hashes it, and reads lockfile-only dependency
 * evidence. Exclusions are the exact FR-026 configured list only; `.gitignore` is never
 * consulted and no folder is excluded merely because its name resembles an output dir.
 */
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { SourceFile } from "./models.js";

/** FR-026: the exact configured exclusion list — never extended by name heuristics. */
const EXCLUDED_DIRECTORY_NAMES = new Set([
    "node_modules",
    ".git",
    ".svn",
    ".hg",
    "dist",
    "build",
    "out",
    ".next",
    ".angular",
    ".cache",
    "coverage",
    ".nyc_output",
    ".vscode",
    ".idea"
]);

const SCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"]);
const TEMPLATE_EXTENSIONS = new Set([".html"]);
const STYLE_EXTENSIONS = new Set([".css", ".scss"]);
const CONFIG_EXTENSIONS = new Set([".json"]);
const ASSET_EXTENSIONS = new Set([
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot"
]);

const LOCKFILE_NAMES = ["package-lock.json"] as const;
const EXCLUDED_FILE_SUFFIXES = [".map", ".log"];

function toPosixRelative(root: string, absolutePath: string): string {
    return path.relative(root, absolutePath).split(path.sep).join("/");
}

function classifyRole(extension: string): string | null {
    if (SCRIPT_EXTENSIONS.has(extension)) return "script";
    if (TEMPLATE_EXTENSIONS.has(extension)) return "template";
    if (STYLE_EXTENSIONS.has(extension)) return "style";
    if (CONFIG_EXTENSIONS.has(extension)) return "config";
    if (ASSET_EXTENSIONS.has(extension)) return "asset";
    return null;
}

interface WalkResult {
    readonly files: SourceFile[];
    readonly excludedDirectories: readonly string[];
}

async function hashFile(absolutePath: string): Promise<{ sha256: string; sizeBytes: number }> {
    const content = await readFile(absolutePath);
    return { sha256: createHash("sha256").update(content).digest("hex"), sizeBytes: content.length };
}

async function walk(root: string, dir: string, out: WalkResult): Promise<void> {
    let entries;
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
        const relative = toPosixRelative(root, dir);
        out.files.push({
            path: relative.length > 0 ? `${relative}/` : "./",
            sha256: "0".repeat(64),
            sizeBytes: 0,
            disposition: "failed",
            reason: `unreadable directory: ${error instanceof Error ? error.message : String(error)}`,
            roles: []
        });
        return;
    }

    for (const entry of entries) {
        const absolutePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRECTORY_NAMES.has(entry.name)) {
                (out.excludedDirectories as string[]).push(toPosixRelative(root, absolutePath));
                continue;
            }
            await walk(root, absolutePath, out);
            continue;
        }
        if (!entry.isFile()) {
            // Symlinks/special files should never reach here (archive-reader already rejects
            // them at intake), but classify defensively rather than silently skip.
            out.files.push({
                path: toPosixRelative(root, absolutePath),
                sha256: "0".repeat(64),
                sizeBytes: 0,
                disposition: "excluded",
                reason: "not a regular file",
                roles: []
            });
            continue;
        }

        const relativePath = toPosixRelative(root, absolutePath);
        if (EXCLUDED_FILE_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) {
            out.files.push({
                path: relativePath,
                sha256: "0".repeat(64),
                sizeBytes: 0,
                disposition: "excluded",
                reason: "source map or log file",
                roles: []
            });
            continue;
        }

        const extension = path.extname(entry.name).toLowerCase();
        const role = classifyRole(extension);
        try {
            const { sha256, sizeBytes } = await hashFile(absolutePath);
            if (role === null) {
                out.files.push({
                    path: relativePath,
                    sha256,
                    sizeBytes,
                    disposition: "excluded",
                    reason: `unrecognized extension "${extension || "(none)"}" is not an owned source/asset type`,
                    roles: []
                });
            } else {
                out.files.push({
                    path: relativePath,
                    sha256,
                    sizeBytes,
                    disposition: "analyzed",
                    reason: null,
                    roles: [role]
                });
            }
        } catch (error) {
            out.files.push({
                path: relativePath,
                sha256: "0".repeat(64),
                sizeBytes: 0,
                disposition: "failed",
                reason: `unreadable file: ${error instanceof Error ? error.message : String(error)}`,
                roles: []
            });
        }
    }
}

export interface DependencyEvidence {
    /** package.json dependencies + devDependencies, declared version ranges. */
    readonly declared: Readonly<Record<string, string>>;
    /** Resolved versions read only from a lockfile, never used as a target lockfile. */
    readonly resolved: Readonly<Record<string, string>>;
    readonly lockfileFound: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractDeclaredDependencies(packageJson: unknown): Record<string, string> {
    const declared: Record<string, string> = {};
    if (!isRecord(packageJson)) {
        return declared;
    }
    for (const field of ["dependencies", "devDependencies"]) {
        const section = packageJson[field];
        if (isRecord(section)) {
            for (const [name, version] of Object.entries(section)) {
                if (typeof version === "string") {
                    declared[name] = version;
                }
            }
        }
    }
    return declared;
}

/** Supports npm lockfile v1 (`dependencies`) and v2/v3 (`packages`) shapes only. */
function extractResolvedVersions(lockfile: unknown): Record<string, string> {
    const resolved: Record<string, string> = {};
    if (!isRecord(lockfile)) {
        return resolved;
    }
    const packages = lockfile["packages"];
    if (isRecord(packages)) {
        for (const [key, value] of Object.entries(packages)) {
            if (key === "" || !key.startsWith("node_modules/") || !isRecord(value)) {
                continue;
            }
            const name = key.slice("node_modules/".length);
            if (name.includes("node_modules/")) {
                continue; // nested transitive copy; top-level resolution is sufficient evidence.
            }
            const version = value["version"];
            if (typeof version === "string") {
                resolved[name] = version;
            }
        }
        return resolved;
    }
    const dependencies = lockfile["dependencies"];
    if (isRecord(dependencies)) {
        for (const [name, value] of Object.entries(dependencies)) {
            if (isRecord(value) && typeof value["version"] === "string") {
                resolved[name] = value["version"];
            }
        }
    }
    return resolved;
}

async function readDependencyEvidence(root: string): Promise<DependencyEvidence> {
    let declared: Record<string, string>;
    try {
        const raw = await readFile(path.join(root, "package.json"), "utf8");
        declared = extractDeclaredDependencies(JSON.parse(raw));
    } catch {
        declared = {};
    }

    for (const lockfileName of LOCKFILE_NAMES) {
        try {
            const raw = await readFile(path.join(root, lockfileName), "utf8");
            const resolved = extractResolvedVersions(JSON.parse(raw));
            return { declared, resolved, lockfileFound: true };
        } catch {
            continue;
        }
    }
    return { declared, resolved: {}, lockfileFound: false };
}

export interface SourceInventoryResult {
    readonly applicationRoot: string;
    readonly files: readonly SourceFile[];
    readonly excludedDirectories: readonly string[];
    readonly dependencyEvidence: DependencyEvidence;
}

/** Builds the full inventory: every owned file (recursively, beyond just `src/`), hashed
 * and classified, plus lockfile-only dependency evidence for framework detection. */
export async function buildSourceInventory(applicationRoot: string): Promise<SourceInventoryResult> {
    const resolvedRoot = path.resolve(applicationRoot);
    const walkResult: WalkResult = { files: [], excludedDirectories: [] };
    await walk(resolvedRoot, resolvedRoot, walkResult);
    const dependencyEvidence = await readDependencyEvidence(resolvedRoot);

    return {
        applicationRoot: resolvedRoot,
        files: walkResult.files,
        excludedDirectories: walkResult.excludedDirectories,
        dependencyEvidence
    };
}
