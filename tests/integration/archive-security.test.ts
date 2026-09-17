import { describe, expect, it, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { extractArchiveSafely, ArchiveSecurityError, DEFAULT_ARCHIVE_LIMITS } from "../../src/analyzer/archive-reader.js";
import { buildRawStoredZip } from "../fixtures/raw-zip.js";

const roots: string[] = [];
async function freshDir(): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), "archive-security-test-"));
    roots.push(dir);
    return dir;
}

afterEach(async () => {
    while (roots.length > 0) {
        const dir = roots.pop();
        if (dir !== undefined) {
            await rm(dir, { recursive: true, force: true });
        }
    }
});

async function writeZip(entries: Parameters<typeof buildRawStoredZip>[0]): Promise<string> {
    const dir = await freshDir();
    const zipPath = path.join(dir, "test.zip");
    await writeFile(zipPath, buildRawStoredZip(entries));
    return zipPath;
}

describe("extractArchiveSafely", () => {
    it("extracts a benign archive and records real hashes/byte counts", async () => {
        const zipPath = await writeZip([
            { name: "src/index.ts", content: Buffer.from("console.log(1);\n") },
            { name: "package.json", content: Buffer.from("{}") }
        ]);
        const dest = path.join(await freshDir(), "out");
        const files = await extractArchiveSafely(zipPath, dest);
        expect(files).toHaveLength(2);
        expect(files.find((f) => f.relativePath === "package.json")?.bytes).toBe(2);
    });

    it("rejects path traversal entries and stays within the destination root", async () => {
        const zipPath = await writeZip([{ name: "../../evil.txt", content: Buffer.from("evil") }]);
        const dest = path.join(await freshDir(), "out");
        await expect(extractArchiveSafely(zipPath, dest)).rejects.toThrow(ArchiveSecurityError);
    });

    it("rejects absolute-path entries", async () => {
        const zipPath = await writeZip([{ name: "/etc/passwd", content: Buffer.from("evil") }]);
        const dest = path.join(await freshDir(), "out");
        await expect(extractArchiveSafely(zipPath, dest)).rejects.toThrow(ArchiveSecurityError);
    });

    it("rejects duplicate/case-colliding destination paths", async () => {
        const zipPath = await writeZip([
            { name: "Foo.txt", content: Buffer.from("a") },
            { name: "foo.txt", content: Buffer.from("b") }
        ]);
        const dest = path.join(await freshDir(), "out");
        await expect(extractArchiveSafely(zipPath, dest)).rejects.toThrow(ArchiveSecurityError);
    });

    it("rejects symlink entries", async () => {
        const zipPath = await writeZip([{ name: "link.txt", content: Buffer.from("/etc/passwd"), unixMode: 0o120777 }]);
        const dest = path.join(await freshDir(), "out");
        await expect(extractArchiveSafely(zipPath, dest)).rejects.toThrow(ArchiveSecurityError);
    });

    it("rejects an entry exceeding the per-file expanded size limit", async () => {
        const zipPath = await writeZip([{ name: "big.bin", content: Buffer.alloc(1024, 1) }]);
        const dest = path.join(await freshDir(), "out");
        await expect(
            extractArchiveSafely(zipPath, dest, { ...DEFAULT_ARCHIVE_LIMITS, maxFileExpandedBytes: 100 })
        ).rejects.toThrow(ArchiveSecurityError);
    });

    it("rejects an archive exceeding the entry count limit", async () => {
        const entries = Array.from({ length: 5 }, (_, i) => ({ name: `f${String(i)}.txt`, content: Buffer.from("x") }));
        const zipPath = await writeZip(entries);
        const dest = path.join(await freshDir(), "out");
        await expect(
            extractArchiveSafely(zipPath, dest, { ...DEFAULT_ARCHIVE_LIMITS, maxEntries: 3 })
        ).rejects.toThrow(ArchiveSecurityError);
    });

    it("rejects an archive exceeding the max compressed size", async () => {
        const zipPath = await writeZip([{ name: "a.txt", content: Buffer.from("x") }]);
        const dest = path.join(await freshDir(), "out");
        await expect(
            extractArchiveSafely(zipPath, dest, { ...DEFAULT_ARCHIVE_LIMITS, maxCompressedBytes: 1 })
        ).rejects.toThrow(ArchiveSecurityError);
    });
});
