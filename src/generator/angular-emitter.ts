import { createHash } from "node:crypto";
import type { GeneratedFile } from "./models.js";

export type AngularOwnerKind =
    | "routed-page" | "feature-component" | "feature-service" | "feature-model"
    | "shared-component" | "shared-directive" | "shared-pipe" | "shared-util" | "shared-model"
    | "core-api" | "core-guard" | "core-interceptor" | "core-service" | "core-model"
    | "layout";

export interface AngularImport {
    readonly moduleSpecifier: string;
    readonly symbols: readonly string[];
}

export interface AngularEmissionUnit {
    readonly sourceFile: string;
    readonly sourceName: string;
    readonly ownerKind: AngularOwnerKind;
    readonly feature: string | null;
    readonly imports: readonly AngularImport[];
    readonly body: string;
}

export interface AngularRouteEmission {
    readonly sourceFile: string;
    readonly feature: string;
    readonly path: string;
    readonly pageSourceName: string;
    readonly guards: readonly { readonly symbol: string; readonly moduleSpecifier: string }[];
    readonly params: readonly string[];
}

export interface EmittedAngularFile extends GeneratedFile {
    readonly content: string;
}

export interface AngularEmissionPlan {
    readonly files: readonly EmittedAngularFile[];
    readonly sourceToTargets: Readonly<Record<string, readonly string[]>>;
}

export function emitAngularProject(units: readonly AngularEmissionUnit[], routes: readonly AngularRouteEmission[]): AngularEmissionPlan {
    const allocated = allocatePaths(units);
    const files: EmittedAngularFile[] = allocated.map(({ unit, path }) => emitted(path, renderUnit(unit), [unit.sourceFile]));
    const routeGroups = new Map<string, AngularRouteEmission[]>();
    for (const route of routes) {
        const feature = kebab(route.feature);
        const group = routeGroups.get(feature) ?? [];
        group.push(route);
        routeGroups.set(feature, group);
    }
    for (const [feature, featureRoutes] of [...routeGroups].sort(([left], [right]) => left.localeCompare(right))) {
        const pageUnits = allocated.filter(({ unit }) => unit.ownerKind === "routed-page" && kebab(unit.feature ?? "") === feature);
        files.push(emitted(`src/app/features/${feature}/feature.routes.ts`, renderRoutes(featureRoutes, pageUnits), featureRoutes.map(({ sourceFile }) => sourceFile)));
    }
    files.sort((left, right) => left.path.localeCompare(right.path));
    const associations = new Map<string, string[]>();
    for (const file of files) for (const source of file.sourceFiles) associations.set(source, [...(associations.get(source) ?? []), file.path]);
    return { files, sourceToTargets: Object.fromEntries([...associations].sort(([left], [right]) => left.localeCompare(right)).map(([source, targets]) => [source, [...new Set(targets)].sort()])) };
}

function allocatePaths(units: readonly AngularEmissionUnit[]): readonly { unit: AngularEmissionUnit; path: string }[] {
    const sorted = [...units].sort((left, right) => `${left.sourceFile}:${left.sourceName}`.localeCompare(`${right.sourceFile}:${right.sourceName}`));
    const used = new Set<string>();
    return sorted.map((unit) => {
        const base = targetPath(unit, kebab(unit.sourceName));
        const path = used.has(base) ? targetPath(unit, `${kebab(unit.sourceName)}-${shortHash(unit.sourceFile)}`) : base;
        if (used.has(path)) throw new Error(`unable to resolve deterministic target collision for ${unit.sourceFile}`);
        used.add(path);
        return { unit, path };
    });
}

function targetPath(unit: AngularEmissionUnit, fileStem: string): string {
    const feature = unit.feature === null ? null : kebab(unit.feature);
    const featureRoot = feature === null ? null : `src/app/features/${feature}`;
    switch (unit.ownerKind) {
        case "routed-page": return `${requireFeature(featureRoot, unit)}/pages/${fileStem}.page.ts`;
        case "feature-component": return `${requireFeature(featureRoot, unit)}/components/${fileStem}.component.ts`;
        case "feature-service": return `${requireFeature(featureRoot, unit)}/services/${fileStem}.service.ts`;
        case "feature-model": return `${requireFeature(featureRoot, unit)}/models/${fileStem}.model.ts`;
        case "shared-component": return `src/app/shared/components/${fileStem}.component.ts`;
        case "shared-directive": return `src/app/shared/directives/${fileStem}.directive.ts`;
        case "shared-pipe": return `src/app/shared/pipes/${fileStem}.pipe.ts`;
        case "shared-util": return `src/app/shared/utils/${fileStem}.ts`;
        case "shared-model": return `src/app/shared/models/${fileStem}.model.ts`;
        case "core-api": return `src/app/core/api/${fileStem}.api.ts`;
        case "core-guard": return `src/app/core/guards/${fileStem}.guard.ts`;
        case "core-interceptor": return `src/app/core/interceptors/${fileStem}.interceptor.ts`;
        case "core-service": return `src/app/core/services/${fileStem}.service.ts`;
        case "core-model": return `src/app/core/models/${fileStem}.model.ts`;
        case "layout": return `src/app/layouts/${fileStem}.layout.ts`;
    }
}

function requireFeature(featureRoot: string | null, unit: AngularEmissionUnit): string {
    if (featureRoot === null || unit.feature?.trim() === "") throw new Error(`${unit.ownerKind} requires explicit feature ownership`);
    return featureRoot;
}

function renderUnit(unit: AngularEmissionUnit): string {
    const imports = [...unit.imports]
        .sort((left, right) => left.moduleSpecifier.localeCompare(right.moduleSpecifier))
        .map(({ moduleSpecifier, symbols }) => `import { ${[...new Set(symbols)].sort().join(", ")} } from ${JSON.stringify(moduleSpecifier)};`);
    return `${imports.length === 0 ? "" : `${imports.join("\n")}\n\n`}${unit.body.trim()}\n`;
}

function renderRoutes(routes: readonly AngularRouteEmission[], pages: readonly { unit: AngularEmissionUnit; path: string }[]): string {
    const guardImports = new Map<string, Set<string>>();
    for (const route of routes) for (const guard of route.guards) {
        const symbols = guardImports.get(guard.moduleSpecifier) ?? new Set<string>();
        symbols.add(guard.symbol);
        guardImports.set(guard.moduleSpecifier, symbols);
    }
    const imports = [...guardImports].sort(([left], [right]) => left.localeCompare(right)).map(([moduleSpecifier, symbols]) =>
        `import { ${[...symbols].sort().join(", ")} } from ${JSON.stringify(moduleSpecifier)};`
    );
    const records = [...routes].sort((left, right) => `${left.path}:${left.pageSourceName}`.localeCompare(`${right.path}:${right.pageSourceName}`)).map((route) => {
        const page = pages.find(({ unit }) => unit.sourceName === route.pageSourceName);
        if (page === undefined) throw new Error(`route ${route.path} has no routed page ${route.pageSourceName}`);
        const importPath = `./${page.path.split("/features/")[1]?.split("/").slice(1).join("/").replace(/\.ts$/, "") ?? ""}`;
        const path = appendParams(route.path, route.params);
        const guards = route.guards.length === 0 ? "" : `, canActivate: [${route.guards.map(({ symbol }) => symbol).sort().join(", ")}]`;
        return `  { path: ${JSON.stringify(path)}, loadComponent: () => import(${JSON.stringify(importPath)}).then((module) => module.${route.pageSourceName})${guards} }`;
    });
    return `import type { Routes } from "@angular/router";\n${imports.length === 0 ? "" : `${imports.join("\n")}\n`}\nexport const FEATURE_ROUTES: Routes = [\n${records.join(",\n")}\n];\n`;
}

function appendParams(routePath: string, params: readonly string[]): string {
    const existing = new Set(routePath.split("/").filter((part) => part.startsWith(":")).map((part) => part.slice(1)));
    const missing = params.filter((param) => !existing.has(param));
    return [routePath.replace(/^\//, "").replace(/\/$/, ""), ...missing.map((param) => `:${param}`)].filter(Boolean).join("/");
}

function emitted(path: string, content: string, sourceFiles: readonly string[]): EmittedAngularFile {
    return { path, content, sha256: createHash("sha256").update(content).digest("hex"), sourceFiles: [...new Set(sourceFiles)].sort() };
}

function kebab(value: string): string {
    const normalized = value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    if (normalized === "") throw new Error("target names must contain an alphanumeric character");
    return normalized;
}

function shortHash(value: string): string {
    return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
