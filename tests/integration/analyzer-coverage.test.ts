import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeProject } from "../../src/analyzer/analyzer.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map(async (directory) => {
        await rm(directory, { recursive: true, force: true });
    }));
});

describe("analyzer coverage composition", () => {
    it("retains parsed UI while marking unresolved dynamic routes partial", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "analyzer-coverage-"));
        temporaryDirectories.push(root);
        await mkdir(path.join(root, "src"), { recursive: true });
        await writeFile(path.join(root, "package.json"), JSON.stringify({
            dependencies: {
                react: "18.3.1",
                "react-dom": "18.3.1",
                "react-router-dom": "6.30.1"
            }
        }), "utf8");
        await writeFile(path.join(root, "src/main.tsx"), `
import { createRoot } from "react-dom/client";
import { Route } from "react-router-dom";
const routePath = window.location.pathname;
function App() {
    return <Route path={routePath} element={<button>Open</button>} />;
}
createRoot(document.getElementById("root")!).render(<App />);
`, "utf8");

        const result = await analyzeProject(root);

        expect(result.coverage).toBe("partial");
        expect(result.uiOccurrences.some(({ role }) => role === "button")).toBe(true);
        expect(result.findings).toContainEqual(expect.objectContaining({
            code: "REACT_DYNAMIC_ROUTE",
            sourceFiles: ["src/main.tsx"]
        }));
    });
});
