import { describe, expect, it } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
// NOTE: analyzeProject does not exist yet (T027). This import intentionally fails today
// (TDD red) until the analyzer composition task lands; do not stub/mock it to pass early.
// @ts-expect-error -- module does not exist until T027
import { analyzeProject } from "../../src/analyzer/analyzer.js";

interface ExpectedFixture {
    readonly framework: string;
    readonly frameworkVersion: string;
    readonly applicationRoot: string;
    readonly routes: readonly { path: string; component: string; sourceFile: string }[];
    readonly sharedComponents: readonly { name: string; sourceFile: string; usedBy: readonly string[] }[];
    readonly models: readonly { name: string; sourceFile: string; fields: readonly string[] }[];
    readonly detectedUiElementRoleCounts: Readonly<Record<string, number>>;
}

async function loadExpectedInventory(): Promise<{ react: ExpectedFixture; angular: ExpectedFixture }> {
    const raw = await readFile(
        path.join(import.meta.dirname, "..", "fixtures", "expected-inventory.json"),
        "utf8"
    );
    return JSON.parse(raw) as { react: ExpectedFixture; angular: ExpectedFixture };
}

/** Narrows the not-yet-implemented import (currently `any`) via a runtime check only. */
function asAnalyzeProjectFn(value: unknown): (root: string) => Promise<unknown> {
    if (typeof value !== "function") {
        throw new TypeError("src/analyzer/analyzer.ts does not export analyzeProject yet (T027)");
    }
    return value as (root: string) => Promise<unknown>;
}

const analyze = asAnalyzeProjectFn(analyzeProject as unknown);

describe("migration-core (analyzer acceptance, TDD red until T027)", () => {
    it("analyzes the React fixture and matches the expected inventory", async () => {
        const expected = (await loadExpectedInventory()).react;
        const root = path.join(import.meta.dirname, "..", "fixtures", "react-supported");

        const result = await analyze(root);

        expect(result).toMatchObject({
            framework: { framework: expected.framework, version: expected.frameworkVersion }
        });
    });

    it("analyzes the Angular fixture and matches the expected inventory", async () => {
        const expected = (await loadExpectedInventory()).angular;
        const root = path.join(import.meta.dirname, "..", "fixtures", "angular-supported");

        const result = await analyze(root);

        expect(result).toMatchObject({
            framework: { framework: expected.framework, version: expected.frameworkVersion }
        });
    });
});
