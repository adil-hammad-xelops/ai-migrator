import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeStyles } from "../../src/analyzer/style-analyzer.js";
import type { FrameworkEvidence, SourceFile } from "../../src/analyzer/models.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map(async (directory) => {
        await rm(directory, { recursive: true, force: true });
    }));
});

const framework: FrameworkEvidence = {
    framework: "react",
    version: "18.3.1",
    bootstrapFiles: ["src/main.tsx"],
    manifestEvidence: [],
    configurationEvidence: [],
    reason: "unit test"
};

async function analyzeStyle(relativePath: string, source: string) {
    const root = await mkdtemp(path.join(tmpdir(), "style-analyzer-"));
    temporaryDirectories.push(root);
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, relativePath), source, "utf8");
    const file: SourceFile = {
        path: relativePath,
        sha256: "0".repeat(64),
        sizeBytes: Buffer.byteLength(source),
        disposition: "analyzed",
        reason: null,
        roles: ["style"]
    };
    return analyzeStyles({ files: [file] }, framework, root);
}

describe("style analyzer parser integration", () => {
    it("parses nested SCSS selectors, declarations, custom properties and URLs", async () => {
        const analysis = await analyzeStyle("src/Card.module.scss", `
.card {
    --gap: 1rem;
    background-image: url("./card.png");
    gap: var(--gap);
    &:hover { color: red; }
    .title { box-shadow: 0 0 1px red, 0 0 2px blue; }
}
`);

        expect(analysis.findings).toEqual([]);
        expect(analysis.cssModules[0]?.classes["card"]).toMatchObject({
            "--gap": "1rem",
            "background-image": "url(\"./card.png\")",
            gap: "var(--gap)"
        });
        expect(analysis.cssModules[0]?.classes["title"]?.["box-shadow"]).toEqual([
            "0 0 1px red",
            "0 0 2px blue"
        ]);
        expect(analysis.assets).toContainEqual(expect.objectContaining({
            url: "./card.png",
            type: "image",
            resolved: true,
            lineNumber: 4
        }));
        expect(analysis.customProperties).toContainEqual({
            name: "--gap",
            value: "1rem",
            usage: 1
        });
    });

    it("reports malformed styles without claiming parsed output", async () => {
        const analysis = await analyzeStyle("src/broken.css", ".card { color: red;");

        expect(analysis.globalStyles).toEqual([]);
        expect(analysis.findings[0]).toMatchObject({
            code: "PARSE_ERROR",
            sourceFile: "src/broken.css"
        });
    });
});
