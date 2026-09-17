import { describe, expect, it, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { openMigrationStore, MigrationStoreError } from "../../src/api/migration-store.js";
import type { JobReceipt } from "../../src/api/contracts.js";

const NIL_ARTIFACT = { available: false, url: null, sha256: null, bytes: null, expiresAt: null };

function baseReceipt(migrationId: string): JobReceipt {
    const now = new Date().toISOString();
    return {
        migrationId,
        schemaVersion: "1.0.0",
        state: "accepted",
        createdAt: now,
        updatedAt: now,
        currentStage: null,
        stages: [],
        catalogRevision: null,
        targetProfileId: null,
        publishedRevision: null,
        counts: { detected: 0, mapped: 0, unmapped: 0, manualReview: 0 },
        coverage: "unknown",
        finalArtifact: NIL_ARTIFACT,
        diagnosticArtifact: NIL_ARTIFACT,
        warnings: [],
        errors: [],
        expiresAt: new Date(Date.now() + 86_400_000).toISOString()
    };
}

const roots: string[] = [];
async function freshRoot(): Promise<string> {
    const root = await mkdtemp(path.join(tmpdir(), "migrator-store-test-"));
    roots.push(root);
    return root;
}

afterEach(async () => {
    while (roots.length > 0) {
        const root = roots.pop();
        if (root !== undefined) {
            await rm(root, { recursive: true, force: true });
        }
    }
});

describe("migration store", () => {
    it("creates the required job directory layout and durable receipt", async () => {
        const root = await freshRoot();
        const store = await openMigrationStore(root);
        const id = randomUUID();
        await store.createJob(id, baseReceipt(id));

        expect(await store.jobExists(id)).toBe(true);
        const receipt = await store.readReceipt(id);
        expect(receipt.migrationId).toBe(id);
        await store.close();
    });

    it("refuses a second exclusive lock while the first is held", async () => {
        const root = await freshRoot();
        const store = await openMigrationStore(root);
        await expect(openMigrationStore(root)).rejects.toThrow(MigrationStoreError);
        await store.close();
    });

    it("allows re-acquiring the lock after close", async () => {
        const root = await freshRoot();
        const first = await openMigrationStore(root);
        await first.close();
        const second = await openMigrationStore(root);
        await second.close();
    });

    it("exposes no published revision until publishRevision completes", async () => {
        const root = await freshRoot();
        const store = await openMigrationStore(root);
        const id = randomUUID();
        await store.createJob(id, baseReceipt(id));

        expect(await store.publishedRevisionId(id)).toBeNull();
        await store.publishRevision(
            id,
            "rev-1",
            new Map([
                ["migration-report.json", JSON.stringify({ ok: true })],
                ["migration-report.md", "# Report"]
            ])
        );
        expect(await store.publishedRevisionId(id)).toBe("rev-1");
        const content = await store.readPublishedFile(id, "migration-report.json");
        expect(content?.toString()).toBe('{"ok":true}');
        await store.close();
    });

    it("never exposes a partial revision written outside the atomic publish path", async () => {
        const root = await freshRoot();
        const store = await openMigrationStore(root);
        const id = randomUUID();
        await store.createJob(id, baseReceipt(id));

        // Simulate a crash mid-publish: content written directly to disk, bypassing the
        // store API, without ever swapping the atomic pointer.
        const revDir = path.join(root, "jobs", id, "revisions", "rev-partial");
        await mkdir(revDir, { recursive: true });
        await writeFile(path.join(revDir, "migration-report.json"), '{"partial":true}');

        expect(await store.publishedRevisionId(id)).toBeNull();
        expect(await store.readPublishedFile(id, "migration-report.json")).toBeNull();
        await store.close();
    });

    it("rejects unsafe revision file paths", async () => {
        const root = await freshRoot();
        const store = await openMigrationStore(root);
        const id = randomUUID();
        await store.createJob(id, baseReceipt(id));

        await expect(
            store.publishRevision(id, "rev-evil", new Map([["../../evil.txt", "x"]]))
        ).rejects.toThrow(MigrationStoreError);
    });

    it("rejects a malformed persisted receipt on read", async () => {
        const root = await freshRoot();
        const store = await openMigrationStore(root);
        const id = randomUUID();
        await store.createJob(id, baseReceipt(id));

        await writeFile(path.join(root, "jobs", id, "receipt.json"), JSON.stringify({ not: "a receipt" }));
        await expect(store.readReceipt(id)).rejects.toThrow();
        await store.close();
    });
});
