import { describe, expect, it } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { analyzeProject } from "../../src/analyzer/analyzer.js";

interface ExpectedFixture {
    readonly framework: string;
    readonly frameworkVersion: string;
    readonly applicationRoot: string;
    readonly routes: readonly { path: string; component: string; sourceFile: string }[];
    readonly sharedComponents: readonly { name: string; sourceFile: string; usedBy: readonly string[] }[];
    readonly models: readonly { name: string; sourceFile: string; fields: readonly string[] }[];
    readonly services: readonly { name: string; sourceFile: string; callsApi: boolean }[];
    readonly forms: readonly {
        name: string;
        sourceFile: string;
        fields: readonly string[];
        hasValidation: boolean;
        hasReset: boolean;
    }[];
    readonly state: readonly { kind: string; sourceFile: string; usesReducer: boolean }[];
    readonly styles: readonly { sourceFile: string; kind: string; scope: string }[];
    readonly detectedUiElementRoleCounts: Readonly<Record<string, number>>;
}

async function loadExpectedInventory(): Promise<{ react: ExpectedFixture; angular: ExpectedFixture }> {
    const raw = await readFile(
        path.join(import.meta.dirname, "..", "fixtures", "expected-inventory.json"),
        "utf8"
    );
    return JSON.parse(raw) as { react: ExpectedFixture; angular: ExpectedFixture };
}

describe("migration-core analyzer acceptance", () => {
    it("analyzes the React fixture and matches the expected inventory", async () => {
        const expected = (await loadExpectedInventory()).react;
        const root = path.join(import.meta.dirname, "..", "fixtures", "react-supported");

        const result = await analyzeProject(root);
        const repeated = await analyzeProject(root);

        expect(result).toMatchObject({
            framework: expected.framework,
            frameworkVersion: expected.frameworkVersion,
            coverage: "complete"
        });
        expect(result.uiOccurrences.length).toBeGreaterThan(0);
        expect(result.uiOccurrences.map(({ id }) => id)).toEqual(
            repeated.uiOccurrences.map(({ id }) => id)
        );
        expect(new Set(result.uiOccurrences.map(({ id }) => id)).size).toBe(
            result.uiOccurrences.length
        );
        expect(result.uiOccurrences.every(({ span }) => span.startLine > 0)).toBe(true);
        expect(result.pages.map(({ name, sourceFile }) => ({ name, sourceFile }))).toEqual(
            expected.routes.map(({ component: name, sourceFile }) => ({ name, sourceFile }))
        );
        for (const component of expected.sharedComponents) {
            const actual = result.components.find(({ name }) => name === component.name);
            expect(actual?.sourceFile).toBe(component.sourceFile);
        }

        const analysis = result.reactAnalysis;
        expect(analysis).toBeDefined();
        if (analysis === undefined) throw new Error("React adapter result is missing");
        expect(analysis.routes.map(({ path: routePath, component, sourceFile, params, guards, lazy }) => ({
            path: routePath,
            component,
            sourceFile,
            params,
            guards,
            lazy
        }))).toEqual(
            expected.routes.map(({ path: routePath, component }) => ({
                path: routePath,
                component,
                sourceFile: "src/App.tsx",
                params: [],
                guards: [],
                lazy: false
            }))
        );
        for (const model of expected.models) {
            const actual = analysis.models.find(({ name }) => name === model.name);
            expect(actual?.sourceFile).toBe(model.sourceFile);
            expect(Object.keys(actual?.properties ?? {})).toEqual(model.fields);
        }
        for (const service of expected.services) {
            const actual = analysis.services.find(({ name }) => name === service.name);
            expect(actual?.sourceFile).toBe(service.sourceFile);
            expect((actual?.apiCalls.length ?? 0) > 0).toBe(service.callsApi);
        }
        for (const form of expected.forms) {
            const actual = analysis.forms.find(({ name }) => name === form.name);
            expect(actual?.sourceFile).toBe(form.sourceFile);
            expect(actual?.fields).toEqual(form.fields);
            expect(Object.keys(actual?.validation ?? {}).length > 0).toBe(form.hasValidation);
            expect(actual?.handlers.includes("onReset")).toBe(form.hasReset);
        }
        const roleCounts = analysis.components
            .flatMap(({ jsxElements }) => jsxElements)
            .filter((element) => element in expected.detectedUiElementRoleCounts)
            .reduce<Record<string, number>>((counts, element) => {
                counts[element] = (counts[element] ?? 0) + 1;
                return counts;
            }, {});
        expect(roleCounts).toEqual(expected.detectedUiElementRoleCounts);
        const normalizedRoleCounts = result.uiOccurrences
            .filter(({ role }) => role in expected.detectedUiElementRoleCounts)
            .reduce<Record<string, number>>((counts, { role }) => {
                counts[role] = (counts[role] ?? 0) + 1;
                return counts;
            }, {});
        expect(normalizedRoleCounts).toEqual(expected.detectedUiElementRoleCounts);
    });

    it("analyzes the Angular fixture and matches the expected inventory", async () => {
        const expected = (await loadExpectedInventory()).angular;
        const root = path.join(import.meta.dirname, "..", "fixtures", "angular-supported");

        const result = await analyzeProject(root);
        const repeated = await analyzeProject(root);

        expect(result).toMatchObject({
            framework: expected.framework,
            frameworkVersion: expected.frameworkVersion,
            coverage: "complete"
        });
        expect(result.uiOccurrences.length).toBeGreaterThan(0);
        expect(result.uiOccurrences.map(({ id }) => id)).toEqual(
            repeated.uiOccurrences.map(({ id }) => id)
        );
        expect(new Set(result.uiOccurrences.map(({ id }) => id)).size).toBe(
            result.uiOccurrences.length
        );
        expect(result.uiOccurrences.every(({ span }) => span.startLine > 0)).toBe(true);
        expect(result.pages.map(({ name, sourceFile }) => ({ name, sourceFile }))).toEqual(
            expected.routes.map(({ component: name, sourceFile }) => ({ name, sourceFile }))
        );
        for (const component of expected.sharedComponents) {
            const actual = result.components.find(({ name }) => name === component.name);
            expect(actual?.sourceFile).toBe(component.sourceFile);
        }

        const analysis = result.angularAnalysis;
        expect(analysis).toBeDefined();
        if (analysis === undefined) throw new Error("Angular adapter result is missing");
        expect(analysis.routes).toHaveLength(expected.routes.length);
        for (const route of expected.routes) {
            const actual = analysis.routes.find(({ path: routePath }) => routePath === route.path);
            expect(actual?.sourceFile).toBe("src/app/app.routes.ts");
            expect(actual?.loadComponent).toContain(route.component);
        }
        for (const model of expected.models) {
            const actual = analysis.models.find(({ name }) => name === model.name);
            expect(actual?.sourceFile).toBe(model.sourceFile);
            expect(Object.keys(actual?.properties ?? {})).toEqual(model.fields);
        }
        for (const service of expected.services) {
            const actual = analysis.services.find(({ name }) => name === service.name);
            expect(actual?.sourceFile).toBe(service.sourceFile);
        }
        for (const form of expected.forms) {
            const actual = analysis.forms.find(({ name }) => name === form.name);
            expect(actual?.sourceFile).toBe(form.sourceFile);
            expect(actual?.controls).toEqual(form.fields);
            expect((actual?.validators.length ?? 0) > 0).toBe(form.hasValidation);
        }
        const roleCounts = analysis.components
            .flatMap(({ templateElements }) => templateElements)
            .map(({ name }) => name)
            .filter((element) => element in expected.detectedUiElementRoleCounts)
            .reduce<Record<string, number>>((counts, element) => {
                counts[element] = (counts[element] ?? 0) + 1;
                return counts;
            }, {});
        expect(roleCounts).toEqual(expected.detectedUiElementRoleCounts);
        const normalizedRoleCounts = result.uiOccurrences
            .filter(({ role }) => role in expected.detectedUiElementRoleCounts)
            .reduce<Record<string, number>>((counts, { role }) => {
                counts[role] = (counts[role] ?? 0) + 1;
                return counts;
            }, {});
        expect(normalizedRoleCounts).toEqual(expected.detectedUiElementRoleCounts);
    });
});
