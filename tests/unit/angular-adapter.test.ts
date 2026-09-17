import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeAngular } from "../../src/analyzer/angular-adapter.js";
import type { FrameworkEvidence, SourceFile } from "../../src/analyzer/models.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map(async (directory) => {
        await rm(directory, { recursive: true, force: true });
    }));
});

const angularFramework: FrameworkEvidence = {
    framework: "angular",
    version: "20.3.15",
    bootstrapFiles: ["src/main.ts"],
    manifestEvidence: ["@angular/core@20.3.15"],
    configurationEvidence: [],
    reason: "unit test"
};

async function analyzeSources(
    script: string,
    templates: Readonly<Record<string, string>> = {}
) {
    const root = await mkdtemp(path.join(tmpdir(), "angular-adapter-"));
    temporaryDirectories.push(root);
    const scriptPath = "src/app.component.ts";
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, scriptPath), script, "utf8");
    for (const [templatePath, template] of Object.entries(templates)) {
        await writeFile(path.join(root, templatePath), template, "utf8");
    }
    const files: SourceFile[] = [{
        path: scriptPath,
        sha256: "0".repeat(64),
        sizeBytes: Buffer.byteLength(script),
        disposition: "analyzed",
        reason: null,
        roles: ["script"]
    }];
    for (const [templatePath, template] of Object.entries(templates)) {
        files.push({
            path: templatePath,
            sha256: "0".repeat(64),
            sizeBytes: Buffer.byteLength(template),
            disposition: "analyzed",
            reason: null,
            roles: ["template"]
        });
    }

    return analyzeAngular({ files }, angularFramework, root);
}

describe("Angular template analysis", () => {
    it("parses external and inline templates with bindings, events and spans", async () => {
        const analysis = await analyzeSources(`
@Component({ selector: "app-root", templateUrl: "./app.component.html" })
export class AppComponent {}
@Component({ selector: "app-inline", template: \`<button [disabled]="busy" (click)="save()">Save</button>\` })
export class InlineComponent {}
`, {
            "src/app.component.html": "<input [value]=\"name\" (input)=\"update($event)\" />"
        });

        const external = analysis.components.find(({ name }) => name === "AppComponent");
        expect(external?.templateElements[0]).toMatchObject({
            name: "input",
            sourceFile: "src/app.component.html",
            inputs: ["value"],
            outputs: ["input"]
        });
        expect(external?.templateElements[0]?.span.startLine).toBe(1);

        const inline = analysis.components.find(({ name }) => name === "InlineComponent");
        expect(inline?.templateElements[0]).toMatchObject({
            name: "button",
            sourceFile: "src/app.component.ts",
            inputs: ["disabled"],
            outputs: ["click"]
        });
    });

    it("reports runtime-generated templates as coverage gaps", async () => {
        const analysis = await analyzeSources(`
const buildTemplate = () => "<main />";
@Component({ selector: "app-root", template: buildTemplate() })
export class AppComponent {}
`);

        expect(analysis.findings).toContainEqual(expect.objectContaining({
            code: "ANGULAR_DYNAMIC_TEMPLATE",
            sourceFile: "src/app.component.ts"
        }));
    });
});
