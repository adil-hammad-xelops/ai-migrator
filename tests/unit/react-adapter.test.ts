import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeReact } from "../../src/analyzer/react-adapter.js";
import type { FrameworkEvidence, SourceFile } from "../../src/analyzer/models.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map(async (directory) => {
        await rm(directory, { recursive: true, force: true });
    }));
});

const reactFramework: FrameworkEvidence = {
    framework: "react",
    version: "18.3.1",
    bootstrapFiles: ["src/main.tsx"],
    manifestEvidence: ["react@18.3.1"],
    configurationEvidence: [],
    reason: "unit test"
};

async function analyzeSource(source: string) {
    const root = await mkdtemp(path.join(tmpdir(), "react-adapter-"));
    temporaryDirectories.push(root);
    const relativePath = "src/App.tsx";
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, relativePath), source, "utf8");
    const file: SourceFile = {
        path: relativePath,
        sha256: "0".repeat(64),
        sizeBytes: Buffer.byteLength(source),
        disposition: "analyzed",
        reason: null,
        roles: ["script"]
    };

    return analyzeReact({ files: [file] }, reactFramework, root);
}

describe("React adapter uncertainty evidence", () => {
    it("records source spans for components and static routes", async () => {
        const analysis = await analyzeSource(`
export function HomePage() { return <main>Home</main>; }
export function App() {
    return <Route path="/" element={<HomePage />} />;
}
`);

        const app = analysis.components.find(({ name }) => name === "App");
        expect(app?.span.startLine).toBe(3);
        expect(app?.span.endLine).toBeGreaterThanOrEqual(5);
        expect(analysis.routes[0]?.span.startLine).toBe(4);
    });

    it("reports dynamic route paths instead of treating them as static", async () => {
        const analysis = await analyzeSource(`
const routePath = window.location.pathname;
export function HomePage() { return <main>Home</main>; }
export function App() {
    return <Route path={routePath} element={<HomePage />} />;
}
`);

        expect(analysis.routes).toHaveLength(0);
        expect(analysis.findings).toContainEqual(expect.objectContaining({
            code: "REACT_DYNAMIC_ROUTE",
            sourceFile: "src/App.tsx",
            startLine: 5
        }));
    });

    it("reports hooks with conditional timing", async () => {
        const analysis = await analyzeSource(`
export function App({ enabled }: { enabled: boolean }) {
    if (enabled) {
        useEffect(() => undefined, []);
    }
    return <main />;
}
`);

        expect(analysis.findings).toContainEqual(expect.objectContaining({
            code: "REACT_UNCERTAIN_HOOK_TIMING",
            sourceFile: "src/App.tsx",
            startLine: 4
        }));
    });
});
