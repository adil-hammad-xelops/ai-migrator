/**
 * Import graph (T023): resolves local imports/aliases with the TypeScript compiler API,
 * computes active-vs-unused reachability from entry points, and reports unresolved
 * imports/aliases as findings rather than silently dropping them. Cycles terminate via
 * a visited set; tests/stories are treated as additional reachability roots (behavior
 * evidence) without folding their UI into the main application's occurrence counts.
 */
import path from "node:path";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import type { SourceInventoryResult } from "./source-inventory.js";

export type ImportEdgeKind = "static" | "dynamic" | "external";

export interface ImportEdge {
    readonly fromFile: string;
    readonly toFile: string;
    readonly kind: ImportEdgeKind;
}

export interface ImportGraphFinding {
    readonly code: "UNRESOLVED_IMPORT" | "UNRESOLVED_ALIAS" | "ALIAS_ESCAPES_ROOT";
    readonly message: string;
    readonly sourceFile: string;
}

export interface ImportGraphResult {
    readonly edges: readonly ImportEdge[];
    readonly reachableFiles: ReadonlySet<string>;
    readonly unreachableFiles: readonly string[];
    readonly findings: readonly ImportGraphFinding[];
}

const RESOLVABLE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"];
const SCRIPT_EXTENSIONS = new Set(RESOLVABLE_EXTENSIONS);
const TEST_OR_STORY_PATTERN = /\.(test|spec|stories)\.[jt]sx?$/;

function scriptKindFor(extension: string): ts.ScriptKind {
    switch (extension) {
        case ".tsx":
            return ts.ScriptKind.TSX;
        case ".jsx":
            return ts.ScriptKind.JSX;
        case ".js":
        case ".mjs":
        case ".cjs":
            return ts.ScriptKind.JS;
        default:
            return ts.ScriptKind.TS;
    }
}

interface RawEdge {
    readonly toSpecifier: string;
    readonly kind: ImportEdgeKind;
}

function collectImportSpecifiers(sourceFile: ts.SourceFile): RawEdge[] {
    const raw: RawEdge[] = [];

    function visit(node: ts.Node): void {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier !== undefined &&
            ts.isStringLiteral(node.moduleSpecifier)
        ) {
            raw.push({ toSpecifier: node.moduleSpecifier.text, kind: "static" });
        } else if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword &&
            node.arguments.length > 0 &&
            node.arguments[0] !== undefined &&
            ts.isStringLiteral(node.arguments[0])
        ) {
            const argument = node.arguments[0];
            if (ts.isStringLiteral(argument)) {
                raw.push({ toSpecifier: argument.text, kind: "dynamic" });
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return raw;
}

interface TsConfigAliases {
    readonly baseUrl: string | null;
    readonly paths: Readonly<Record<string, readonly string[]>>;
}

async function readTsConfigAliases(root: string): Promise<TsConfigAliases> {
    try {
        const raw = await readFile(path.join(root, "tsconfig.json"), "utf8");
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) {
            return { baseUrl: null, paths: {} };
        }
        const compilerOptions = (parsed as Record<string, unknown>)["compilerOptions"];
        if (typeof compilerOptions !== "object" || compilerOptions === null) {
            return { baseUrl: null, paths: {} };
        }
        const options = compilerOptions as Record<string, unknown>;
        const baseUrl = typeof options["baseUrl"] === "string" ? options["baseUrl"] : null;
        const pathsValue = options["paths"];
        const paths: Record<string, readonly string[]> = {};
        if (typeof pathsValue === "object" && pathsValue !== null) {
            for (const [key, value] of Object.entries(pathsValue as Record<string, unknown>)) {
                if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
                    paths[key] = value;
                }
            }
        }
        return { baseUrl, paths };
    } catch {
        return { baseUrl: null, paths: {} };
    }
}

/** Attempts each known extension and an `/index.*` form against the real inventory paths. */
function resolveToInventoryPath(candidateBase: string, knownPaths: ReadonlySet<string>): string | null {
    for (const extension of RESOLVABLE_EXTENSIONS) {
        const withExt = `${candidateBase}${extension}`;
        if (knownPaths.has(withExt)) {
            return withExt;
        }
    }
    for (const extension of RESOLVABLE_EXTENSIONS) {
        const asIndex = path.posix.join(candidateBase, `index${extension}`);
        if (knownPaths.has(asIndex)) {
            return asIndex;
        }
    }
    if (knownPaths.has(candidateBase)) {
        return candidateBase;
    }
    return null;
}

function resolveAlias(specifier: string, aliases: TsConfigAliases): string | null {
    for (const [pattern, targets] of Object.entries(aliases.paths)) {
        const prefix = pattern.replace(/\*$/, "");
        if (!specifier.startsWith(prefix)) {
            continue;
        }
        const rest = specifier.slice(prefix.length);
        const target = targets[0];
        if (target === undefined) {
            continue;
        }
        const targetBase = target.replace(/\*$/, "");
        const base = aliases.baseUrl ?? ".";
        return path.posix.normalize(path.posix.join(base, targetBase, rest));
    }
    return null;
}

function isOutsideRoot(candidate: string): boolean {
    return candidate === ".." || candidate.startsWith("../");
}

/** Builds the resolved import graph and computes reachability from `entryFiles`. */
export async function buildImportGraph(
    inventory: SourceInventoryResult,
    entryFiles: readonly string[]
): Promise<ImportGraphResult> {
    const scriptFiles = inventory.files.filter(
        (f) => f.disposition === "analyzed" && SCRIPT_EXTENSIONS.has(path.extname(f.path))
    );
    const knownPaths = new Set(scriptFiles.map((f) => f.path));
    const aliases = await readTsConfigAliases(inventory.applicationRoot);

    const edges: ImportEdge[] = [];
    const findings: ImportGraphFinding[] = [];
    const adjacency = new Map<string, string[]>();

    for (const file of scriptFiles) {
        const absolutePath = path.join(inventory.applicationRoot, file.path);
        let content: string;
        try {
            content = await readFile(absolutePath, "utf8");
        } catch {
            continue;
        }
        const sourceFile = ts.createSourceFile(
            file.path,
            content,
            ts.ScriptTarget.Latest,
            true,
            scriptKindFor(path.extname(file.path))
        );
        const rawEdges = collectImportSpecifiers(sourceFile);
        const neighbors: string[] = [];

        for (const raw of rawEdges) {
            const specifier = raw.toSpecifier;
            if (specifier.startsWith(".")) {
                const candidateBase = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), specifier));
                const resolved = resolveToInventoryPath(candidateBase, knownPaths);
                if (resolved === null) {
                    findings.push({
                        code: "UNRESOLVED_IMPORT",
                        message: `import "${specifier}" does not resolve to any owned source file`,
                        sourceFile: file.path
                    });
                    continue;
                }
                edges.push({ fromFile: file.path, toFile: resolved, kind: raw.kind });
                neighbors.push(resolved);
                continue;
            }

            const aliasTarget = resolveAlias(specifier, aliases);
            if (aliasTarget !== null) {
                if (isOutsideRoot(aliasTarget)) {
                    findings.push({
                        code: "ALIAS_ESCAPES_ROOT",
                        message: `alias "${specifier}" resolves outside the application root and was not followed`,
                        sourceFile: file.path
                    });
                    continue;
                }
                const resolved = resolveToInventoryPath(aliasTarget, knownPaths);
                if (resolved === null) {
                    findings.push({
                        code: "UNRESOLVED_ALIAS",
                        message: `alias "${specifier}" did not resolve to any owned source file`,
                        sourceFile: file.path
                    });
                    continue;
                }
                edges.push({ fromFile: file.path, toFile: resolved, kind: raw.kind });
                neighbors.push(resolved);
                continue;
            }

            // Bare specifier: an installed package, not local source. Recorded, not traversed.
            edges.push({ fromFile: file.path, toFile: specifier, kind: "external" });
        }

        adjacency.set(file.path, neighbors);
    }

    const testOrStoryRoots = scriptFiles
        .map((f) => f.path)
        .filter((relativePath) => TEST_OR_STORY_PATTERN.test(relativePath));
    const roots = new Set<string>();
    for (const entryFile of entryFiles) {
        if (knownPaths.has(entryFile)) {
            roots.add(entryFile);
        } else {
            findings.push({
                code: "UNRESOLVED_IMPORT",
                message: `entry file "${entryFile}" is not an analyzed source file`,
                sourceFile: entryFile
            });
        }
    }
    for (const testOrStoryRoot of testOrStoryRoots) {
        roots.add(testOrStoryRoot);
    }

    const reachable = new Set<string>();
    const queue = [...roots];
    while (queue.length > 0) {
        const current = queue.shift();
        if (current === undefined || reachable.has(current)) {
            continue;
        }
        reachable.add(current);
        for (const neighbor of adjacency.get(current) ?? []) {
            if (!reachable.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }

    const unreachableFiles = scriptFiles.map((f) => f.path).filter((p) => !reachable.has(p));

    return { edges, reachableFiles: reachable, unreachableFiles, findings };
}
