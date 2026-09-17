import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve("src/generator/templates/angular-v1");

async function readJson(relativePath: string): Promise<unknown> {
    return JSON.parse(await readFile(path.join(root, relativePath), "utf8")) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

describe("Angular architecture v1 template", () => {
    it("enforces strict TypeScript and Angular template checking", async () => {
        const config = await readJson("tsconfig.json");
        expect(isRecord(config) && isRecord(config["compilerOptions"]) && config["compilerOptions"]["strict"]).toBe(true);
        expect(isRecord(config) && isRecord(config["angularCompilerOptions"]) && config["angularCompilerOptions"]["strictTemplates"]).toBe(true);
    });

    it("contains the fixed ownership directories and standalone lazy route shell", async () => {
        const required = [
            "src/app/core/api", "src/app/core/guards", "src/app/core/interceptors", "src/app/core/services", "src/app/core/models",
            "src/app/shared/components", "src/app/shared/directives", "src/app/shared/pipes", "src/app/shared/utils", "src/app/shared/models",
            "src/app/features/home/pages", "src/app/features/home/components", "src/app/features/home/services", "src/app/features/home/models",
            "src/app/layouts", "src/app/app.component.ts", "src/app/app.config.ts", "src/app/app.routes.ts"
        ];
        await Promise.all(required.map((item) => access(path.join(root, item))));
        const routes = await readFile(path.join(root, "src/app/app.routes.ts"), "utf8");
        const featureRoutes = await readFile(path.join(root, "src/app/features/home/feature.routes.ts"), "utf8");
        expect(routes).toContain("loadChildren");
        expect(featureRoutes).toContain("loadComponent");
    });
});
