/**
 * Loads and validates the immutable Xelops component catalog (T009).
 * The catalog is copied verbatim to src/catalog/xelops-components.json; this module
 * never edits it and never invents fields the raw JSON does not contain.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath, URL as NodeUrl } from "node:url";
import type { CatalogComponentEntry, CatalogMetadataDiagnostic, CatalogSnapshot } from "./models.js";

export const EXPECTED_CATALOG_ENTRY_COUNT = 74;
export const EXPECTED_CATALOG_SHA256 =
    "c4fa4aac267f51089162cb87d0087beae369fd027e4350130f83517c070a1640";
export const CATALOG_REVISION = EXPECTED_CATALOG_SHA256.slice(0, 12);

export class CatalogLoadError extends Error {
    constructor(reason: string) {
        super(`catalog failed to load: ${reason}`);
        this.name = "CatalogLoadError";
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Array.isArray narrows `unknown` to `any[]`; this guard avoids that unsafe widening. */
function isUnknownArray(value: unknown): value is readonly unknown[] {
    return Array.isArray(value);
}

function decodeStringArray(value: unknown, entryId: string, field: string): readonly string[] {
    if (value === undefined) {
        return [];
    }
    if (!isUnknownArray(value) || value.some((item) => typeof item !== "string")) {
        throw new CatalogLoadError(`entry "${entryId}" has a non-string-array "${field}"`);
    }
    return value.filter((item): item is string => typeof item === "string");
}

function decodeEntry(id: string, value: unknown): CatalogComponentEntry {
    if (!isRecord(value)) {
        throw new CatalogLoadError(`entry "${id}" is not an object`);
    }
    const selector = value["selector"];
    const importPath = value["importPath"];
    const description = value["description"];
    const usage = value["usage"];
    if (typeof selector !== "string" || selector.length === 0) {
        throw new CatalogLoadError(`entry "${id}" has a missing/invalid "selector"`);
    }
    if (typeof importPath !== "string" || importPath.length === 0) {
        throw new CatalogLoadError(`entry "${id}" has a missing/invalid "importPath"`);
    }
    if (typeof description !== "string" || description.length === 0) {
        throw new CatalogLoadError(`entry "${id}" has a missing/invalid "description"`);
    }
    if (usage !== undefined && typeof usage !== "string") {
        throw new CatalogLoadError(`entry "${id}" has a non-string "usage"`);
    }
    return {
        id,
        selector,
        importPath,
        description,
        usage: usage ?? null,
        inputs: decodeStringArray(value["inputs"], id, "inputs"),
        outputs: decodeStringArray(value["outputs"], id, "outputs")
    };
}

/** Structural + duplicate-identity + immutable revision/hash validation of raw catalog bytes. */
export function parseCatalogSnapshot(rawBytes: string): CatalogSnapshot {
    const sha256 = createHash("sha256").update(rawBytes, "utf8").digest("hex");
    if (sha256 !== EXPECTED_CATALOG_SHA256) {
        throw new CatalogLoadError(
            `SHA-256 mismatch: expected ${EXPECTED_CATALOG_SHA256}, got ${sha256}. ` +
            "A hash mismatch means the catalog was replaced or edited; identify and " +
            "explicitly authorize the new revision rather than silently accepting it."
        );
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawBytes);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new CatalogLoadError(`malformed JSON: ${message}`);
    }
    if (!isRecord(parsed)) {
        throw new CatalogLoadError("root value must be a JSON object keyed by component id");
    }

    const entries: CatalogComponentEntry[] = [];
    const metadataDiagnostics: CatalogMetadataDiagnostic[] = [];
    const seenIds = new Set<string>();
    const seenSelectors = new Map<string, string>();

    for (const [id, value] of Object.entries(parsed)) {
        if (seenIds.has(id)) {
            throw new CatalogLoadError(`duplicate entry id "${id}"`);
        }
        seenIds.add(id);
        const entry = decodeEntry(id, value);
        const priorOwner = seenSelectors.get(entry.selector);
        if (priorOwner !== undefined) {
            throw new CatalogLoadError(`duplicate selector "${entry.selector}" (ids "${priorOwner}", "${id}")`);
        }
        seenSelectors.set(entry.selector, id);
        if (entry.inputs.length === 0 && entry.outputs.length === 0) {
            metadataDiagnostics.push({
                entryId: id,
                code: "CATALOG_NO_MEMBERS",
                message: `entry "${id}" declares no inputs or outputs; dependent mappings have no bindable members`
            });
        }
        entries.push(entry);
    }

    if (entries.length !== EXPECTED_CATALOG_ENTRY_COUNT) {
        throw new CatalogLoadError(
            `expected ${EXPECTED_CATALOG_ENTRY_COUNT} entries, found ${entries.length}`
        );
    }

    return {
        revision: CATALOG_REVISION,
        sha256,
        rawBytes,
        entryCount: entries.length,
        entries,
        metadataDiagnostics
    };
}

const CATALOG_FILE_URL = new NodeUrl("./xelops-components.json", import.meta.url);

/** Loads the bundled catalog file from disk. Malformed catalogs fail startup (no fallback). */
export async function loadCatalogSnapshot(): Promise<CatalogSnapshot> {
    let rawBytes: string;
    try {
        rawBytes = await readFile(fileURLToPath(CATALOG_FILE_URL), "utf8");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new CatalogLoadError(`unable to read catalog file: ${message}`);
    }
    return parseCatalogSnapshot(rawBytes);
}
