import { describe, expect, it } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { analyzeProject } from "../../src/analyzer/analyzer.js";
import type { MappingPlan } from "../../src/mapper/models.js";
import { createMappingPlan } from "../../src/mapper/mapper.js";
import type { CatalogSnapshot, PackageEvidence } from "../../src/catalog/models.js";
import type { TargetProfile } from "../../src/validator/models.js";
import { validateProject } from "../../src/validator/validator.js";
import { admitProfile } from "../../src/validator/profile-admission.js";

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

describe("migration-core full pipeline", () => {
    it("maps React fixture occurrences with compatibility evaluation", async () => {
        const root = path.join(import.meta.dirname, "..", "fixtures", "react-supported");
        const analyzed = await analyzeProject(root);

        expect(analyzed.uiOccurrences.length).toBeGreaterThan(0);

        // Create minimal mock catalog for testing
        const mockCatalog: CatalogSnapshot = {
            revision: "1.0.0",
            sha256: "0000000000000000000000000000000000000000000000000000000000000000",
            rawBytes: "",
            entryCount: 0,
            entries: [],
            metadataDiagnostics: [],
        };

        const mockEvidence: PackageEvidence = {
            packageName: "@xelops/ui-angular",
            packageVersion: "0.0.5",
            integrity: "sha512-...",
            verifiedExports: [],
            verifiedMembers: [],
            selectorConflicts: [],
        };

        // Should not throw and should produce one decision per occurrence
        const mappingPlan = createMappingPlan(analyzed, mockCatalog, mockEvidence);
        expect(mappingPlan.decisions.length).toBe(analyzed.uiOccurrences.length);

        // Count by status
        const mapped = mappingPlan.decisions.filter((d) => d.status === "mapped").length;
        const unmapped = mappingPlan.decisions.filter((d) => d.status === "unmapped").length;
        const manualReview = mappingPlan.decisions.filter((d) => d.status === "manual-review").length;
        expect(mapped + unmapped + manualReview).toBe(analyzed.uiOccurrences.length);
    });

    it("maps Angular fixture occurrences with compatibility evaluation", async () => {
        const root = path.join(import.meta.dirname, "..", "fixtures", "angular-supported");
        const analyzed = await analyzeProject(root);

        expect(analyzed.uiOccurrences.length).toBeGreaterThan(0);

        // Create minimal mock catalog for testing
        const mockCatalog: CatalogSnapshot = {
            revision: "1.0.0",
            sha256: "0000000000000000000000000000000000000000000000000000000000000000",
            rawBytes: "",
            entryCount: 0,
            entries: [],
            metadataDiagnostics: [],
        };

        const mockEvidence: PackageEvidence = {
            packageName: "@xelops/ui-angular",
            packageVersion: "0.0.5",
            integrity: "sha512-...",
            verifiedExports: [],
            verifiedMembers: [],
            selectorConflicts: [],
        };

        // Should not throw and should produce one decision per occurrence
        const mappingPlan = createMappingPlan(analyzed, mockCatalog, mockEvidence);
        expect(mappingPlan.decisions.length).toBe(analyzed.uiOccurrences.length);

        // Count by status
        const mapped = mappingPlan.decisions.filter((d) => d.status === "mapped").length;
        const unmapped = mappingPlan.decisions.filter((d) => d.status === "unmapped").length;
        const manualReview = mappingPlan.decisions.filter((d) => d.status === "manual-review").length;
        expect(mapped + unmapped + manualReview).toBe(analyzed.uiOccurrences.length);
    });

    it("validates profile admission for React fixture", async () => {
        const admissionResult = await admitProfile({
            profileId: "xelops-angular-v1-lts-2024",
            requiredVersions: {
                angular: "20.0.0",
                typescript: "5.9.0",
                rxjs: "7.0.0",
            },
            lockfileHash: "",
        });

        // Profile should be properly classified
        expect(["admitted", "expired", "incompatible", "unverified"]).toContain(
            admissionResult.status
        );

        if (admissionResult.status === "admitted") {
            expect(admissionResult.profileExists).toBe(true);
            expect(admissionResult.versionsCompatible).toBe(true);
            expect(admissionResult.supportNotExpired).toBe(true);
        }
    });

    it("runs all six validator gates for React fixture", async () => {
        // Note: This test creates a mock profile for testing gate execution
        const mockProfile: TargetProfile = {
            profileId: "xelops-angular-v1-lts-2024",
            architectureRevision: "xelops-angular-v1",
            packages: [
                { name: "@angular/core", version: "20.3.15", integrity: "sha512-..." },
                { name: "typescript", version: "5.9.3", integrity: "sha512-..." },
            ],
            lockfileSha256: "0000000000000000000000000000000000000000000000000000000000000000",
            supportExpiresAt: "2027-12-31T23:59:59Z",
            admissionStatus: "admitted",
            admissionChecks: [],
        };

        const projectPath = path.join(import.meta.dirname, "..", "fixtures", "react-supported");
        const result = await validateProject({
            projectPath,
            profile: mockProfile,
            timeoutMs: 60000,
            diagnosticBytesLimit: 1024 * 1024,
            runTests: false, // Zero required tests
        });

        // Six gates should be executed
        expect(result.gateResults).toHaveLength(6);

        // Gates should be in order
        const gateOrder = result.gateResults.map((g) => g.gate);
        expect(gateOrder).toEqual([
            "installation",
            "typescript",
            "angular-build",
            "lint",
            "tests",
            "xelops-compliance",
        ]);

        // Each gate should have a status
        for (const gate of result.gateResults) {
            expect(["passed", "failed", "skipped"]).toContain(gate.status);
        }
    });

    it("runs all six validator gates for Angular fixture", async () => {
        // Note: This test creates a mock profile for testing gate execution
        const mockProfile: TargetProfile = {
            profileId: "xelops-angular-v1-lts-2024",
            architectureRevision: "xelops-angular-v1",
            packages: [
                { name: "@angular/core", version: "20.3.15", integrity: "sha512-..." },
                { name: "typescript", version: "5.9.3", integrity: "sha512-..." },
            ],
            lockfileSha256: "0000000000000000000000000000000000000000000000000000000000000000",
            supportExpiresAt: "2027-12-31T23:59:59Z",
            admissionStatus: "admitted",
            admissionChecks: [],
        };

        const projectPath = path.join(import.meta.dirname, "..", "fixtures", "angular-supported");
        const result = await validateProject({
            projectPath,
            profile: mockProfile,
            timeoutMs: 60000,
            diagnosticBytesLimit: 1024 * 1024,
            runTests: false,
        });

        // Six gates should be executed
        expect(result.gateResults).toHaveLength(6);

        // Each gate should have a status
        for (const gate of result.gateResults) {
            expect(["passed", "failed", "skipped"]).toContain(gate.status);
        }
    });

    it("maintains deterministic occurrence IDs across analysis runs", async () => {
        const root = path.join(import.meta.dirname, "..", "fixtures", "react-supported");

        const run1 = await analyzeProject(root);
        const run2 = await analyzeProject(root);
        const run3 = await analyzeProject(root);

        const ids1 = run1.uiOccurrences.map((o) => o.id).sort();
        const ids2 = run2.uiOccurrences.map((o) => o.id).sort();
        const ids3 = run3.uiOccurrences.map((o) => o.id).sort();

        expect(ids1).toEqual(ids2);
        expect(ids2).toEqual(ids3);
    });

    it("preserves mapping decision integrity across runs", async () => {
        const root = path.join(import.meta.dirname, "..", "fixtures", "react-supported");

        const mockCatalog: CatalogSnapshot = {
            revision: "1.0.0",
            sha256: "0000000000000000000000000000000000000000000000000000000000000000",
            rawBytes: "",
            entryCount: 0,
            entries: [],
            metadataDiagnostics: [],
        };

        const mockEvidence: PackageEvidence = {
            packageName: "@xelops/ui-angular",
            packageVersion: "0.0.5",
            integrity: "sha512-...",
            verifiedExports: [],
            verifiedMembers: [],
            selectorConflicts: [],
        };

        const analyzed1 = await analyzeProject(root);
        const mapping1 = createMappingPlan(analyzed1, mockCatalog, mockEvidence);

        const analyzed2 = await analyzeProject(root);
        const mapping2 = createMappingPlan(analyzed2, mockCatalog, mockEvidence);

        expect(mapping1.decisions.length).toBe(mapping2.decisions.length);

        // Same occurrences should have same decisions
        for (let i = 0; i < mapping1.decisions.length; i++) {
            const d1 = mapping1.decisions[i];
            const d2 = mapping2.decisions[i];
            expect(d1?.occurrenceId).toBe(d2?.occurrenceId);
            expect(d1?.status).toBe(d2?.status);
        }
    });
});
