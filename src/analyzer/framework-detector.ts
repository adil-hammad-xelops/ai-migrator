/**
 * Framework detection (T022, FR-003). Combines declared dependencies with a *reachable*
 * application bootstrap and applicable configuration. A dependency, filename, JSX syntax
 * or folder name alone is never sufficient; both frameworks present without a real
 * conflicting bootstrap is not itself a conflict — only genuinely mixed/unresolved
 * bootstraps are reported unsupported/indeterminate.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SourceInventoryResult } from "./source-inventory.js";
import type { FrameworkEvidence } from "./models.js";

const REACT_BOOTSTRAP_IMPORT = /from\s+["']react-dom\/client["']/;
const REACT_CREATE_ROOT_CALL = /createRoot\s*\(/;
const REACT_DOM_RENDER_IMPORT = /from\s+["']react-dom["']/;
const REACT_DOM_RENDER_CALL = /ReactDOM\s*\.\s*render\s*\(/;

const ANGULAR_BOOTSTRAP_APP_IMPORT = /from\s+["']@angular\/platform-browser["']/;
const ANGULAR_BOOTSTRAP_APP_CALL = /bootstrapApplication\s*\(/;
const ANGULAR_PLATFORM_DYNAMIC_IMPORT = /from\s+["']@angular\/platform-browser-dynamic["']/;
const ANGULAR_BOOTSTRAP_MODULE_CALL = /platformBrowserDynamic\s*\(\s*\)\s*\.\s*bootstrapModule\s*\(/;

const CANDIDATE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"]);

function bareVersion(range: string): string {
    return range.replace(/^[\^~>=<]+/, "").trim();
}

const EXACT_SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[\w.]+)?$/;

/** A declared range with no operator (e.g. "18.3.1", not "^18.3.1") is already exact. */
function resolvedVersionFor(resolved: Readonly<Record<string, string>>, declared: Readonly<Record<string, string>>, name: string): string | null {
    const fromLockfile = resolved[name];
    if (fromLockfile !== undefined) {
        return fromLockfile;
    }
    const declaredRange = declared[name];
    if (declaredRange !== undefined && EXACT_SEMVER_PATTERN.test(declaredRange)) {
        return declaredRange;
    }
    return null;
}

async function findBootstrapFiles(
    inventory: SourceInventoryResult
): Promise<{ react: string[]; angular: string[] }> {
    const react: string[] = [];
    const angular: string[] = [];

    for (const file of inventory.files) {
        if (file.disposition !== "analyzed" || !file.roles.includes("script")) {
            continue;
        }
        if (!CANDIDATE_EXTENSIONS.has(path.extname(file.path))) {
            continue;
        }
        let content: string;
        try {
            content = await readFile(path.join(inventory.applicationRoot, file.path), "utf8");
        } catch {
            continue;
        }
        const isReactBootstrap =
            (REACT_BOOTSTRAP_IMPORT.test(content) && REACT_CREATE_ROOT_CALL.test(content)) ||
            (REACT_DOM_RENDER_IMPORT.test(content) && REACT_DOM_RENDER_CALL.test(content));
        const isAngularBootstrap =
            (ANGULAR_BOOTSTRAP_APP_IMPORT.test(content) && ANGULAR_BOOTSTRAP_APP_CALL.test(content)) ||
            (ANGULAR_PLATFORM_DYNAMIC_IMPORT.test(content) && ANGULAR_BOOTSTRAP_MODULE_CALL.test(content));
        if (isReactBootstrap) {
            react.push(file.path);
        }
        if (isAngularBootstrap) {
            angular.push(file.path);
        }
    }

    return { react, angular };
}

/** Detects React/Angular/mixed/unknown from declared deps + a real reachable bootstrap. */
export async function detectFramework(inventory: SourceInventoryResult): Promise<FrameworkEvidence> {
    const { declared, resolved } = inventory.dependencyEvidence;
    const reactDepPresent = "react" in declared;
    const angularDepPresent = "@angular/core" in declared;
    const { react: reactBootstrapFiles, angular: angularBootstrapFiles } = await findBootstrapFiles(inventory);

    const manifestEvidence: string[] = [];
    if (reactDepPresent) {
        manifestEvidence.push(`package.json declares "react": "${declared["react"] ?? ""}"`);
    }
    if (angularDepPresent) {
        manifestEvidence.push(`package.json declares "@angular/core": "${declared["@angular/core"] ?? ""}"`);
    }

    const configurationEvidence: string[] = [];
    const hasAngularJson = inventory.files.some((f) => f.path === "angular.json");
    if (hasAngularJson) {
        configurationEvidence.push("angular.json workspace configuration present");
    }

    const hasReactBootstrap = reactBootstrapFiles.length > 0;
    const hasAngularBootstrap = angularBootstrapFiles.length > 0;

    if (hasReactBootstrap && hasAngularBootstrap) {
        return {
            framework: "mixed",
            version: null,
            bootstrapFiles: [...reactBootstrapFiles, ...angularBootstrapFiles],
            manifestEvidence,
            configurationEvidence,
            reason:
                "Both a React (react-dom/client createRoot) and an Angular (bootstrapApplication) " +
                "bootstrap were found reachable; this is a genuinely mixed application, not a " +
                "guessable single framework."
        };
    }

    if (hasReactBootstrap && !hasAngularBootstrap) {
        if (!reactDepPresent) {
            return {
                framework: "unknown",
                version: null,
                bootstrapFiles: reactBootstrapFiles,
                manifestEvidence,
                configurationEvidence,
                reason: "A React-shaped bootstrap was found but package.json does not declare a react dependency."
            };
        }
        const reactVersion = resolvedVersionFor(resolved, declared, "react");
        if (reactVersion === null) {
            manifestEvidence.push(
                `declared range "${declared["react"] ?? ""}" unresolved (bareVersion="${bareVersion(declared["react"] ?? "")}"), no lockfile evidence`
            );
        }
        return {
            framework: "react",
            version: reactVersion,
            bootstrapFiles: reactBootstrapFiles,
            manifestEvidence,
            configurationEvidence,
            reason: "React dependency declared and a react-dom/client createRoot bootstrap is reachable."
        };
    }

    if (hasAngularBootstrap && !hasReactBootstrap) {
        if (!angularDepPresent) {
            return {
                framework: "unknown",
                version: null,
                bootstrapFiles: angularBootstrapFiles,
                manifestEvidence,
                configurationEvidence,
                reason: "An Angular-shaped bootstrap was found but package.json does not declare an @angular/core dependency."
            };
        }
        const angularVersion = resolvedVersionFor(resolved, declared, "@angular/core");
        if (angularVersion === null) {
            manifestEvidence.push(
                `declared range "${declared["@angular/core"] ?? ""}" unresolved (bareVersion="${bareVersion(declared["@angular/core"] ?? "")}"), no lockfile evidence`
            );
        }
        return {
            framework: "angular",
            version: angularVersion,
            bootstrapFiles: angularBootstrapFiles,
            manifestEvidence,
            configurationEvidence,
            reason: "Angular dependency declared and a bootstrapApplication bootstrap is reachable."
        };
    }

    return {
        framework: "unknown",
        version: null,
        bootstrapFiles: [],
        manifestEvidence,
        configurationEvidence,
        reason:
            "No reachable React or Angular application bootstrap was found. Dependencies, JSX " +
            "syntax or filenames alone are not sufficient evidence per FR-003."
    };
}
