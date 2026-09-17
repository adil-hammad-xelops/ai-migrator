import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildImportGraph } from "../../src/analyzer/import-graph.js";
import { buildSourceInventory } from "../../src/analyzer/source-inventory.js";

const roots: string[] = [];

afterEach(() => {
    // Vitest's temporary directories are left to the OS; this avoids destructive cleanup
    // if a test is interrupted while another process is inspecting the fixture.
    roots.length = 0;
});

async function fixture(): Promise<string> {
    const root = await mkdtemp(path.join(os.tmpdir(), "xelops-graph-"));
    roots.push(root);
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "tsconfig.json"), JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"] } }
    }));
    return root;
}

describe("buildImportGraph", () => {
    it("resolves aliases, terminates cycles, and includes tests as evidence roots", async () => {
        const root = await fixture();
        await writeFile(path.join(root, "src/main.ts"), 'import { value } from "@/a"; console.log(value);');
        await writeFile(path.join(root, "src/a.ts"), 'import "./b"; export const value = 1;');
        await writeFile(path.join(root, "src/b.ts"), 'import "./a";');
        await writeFile(path.join(root, "src/unused.ts"), "export const unused = true;");
        await writeFile(path.join(root, "src/a.spec.ts"), 'import "./unused";');

        const result = await buildImportGraph(await buildSourceInventory(root), ["src/main.ts"]);
        expect(result.findings).toHaveLength(0);
        expect([...result.reachableFiles].sort()).toEqual([
            "src/a.spec.ts", "src/a.ts", "src/b.ts", "src/main.ts", "src/unused.ts"
        ]);
        expect(result.unreachableFiles).toEqual([]);
    });

    it("reports unresolved imports, aliases escaping the root, and missing entries", async () => {
        const root = await fixture();
        await writeFile(path.join(root, "src/main.ts"), [
            'import "./missing";',
            'import "@/not-there";',
            'import "@outside/x";'
        ].join("\n"));
        await writeFile(path.join(root, "src/ok.ts"), "export {};");
        await writeFile(path.join(root, "tsconfig.json"), JSON.stringify({
            compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"], "@outside/*": ["../outside/*"] } }
        }));

        const result = await buildImportGraph(await buildSourceInventory(root), ["src/main.ts", "src/nope.ts"]);
        expect(result.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining([
            "UNRESOLVED_IMPORT", "UNRESOLVED_ALIAS", "ALIAS_ESCAPES_ROOT"
        ]));
    });
});
