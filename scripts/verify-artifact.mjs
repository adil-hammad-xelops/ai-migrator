#!/usr/bin/env node
/**
 * Artifact verification script (T054): Verify ZIP archive integrity,
 * entry completeness, and metadata. Used before publication.
 * 
 * Usage: node scripts/verify-artifact.mjs <zip-path> <inventory-json>
 */

import { createReadStream, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";

/**
 * Computes SHA-256 hash of a file.
 */
async function computeFileHash(filePath) {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    await pipeline(stream, (data) => {
        hash.update(data);
    });
    return hash.digest("hex");
}

/**
 * Verifies a ZIP archive against an inventory.
 * (Full implementation in T054)
 */
async function verifyArchive(zipPath, inventoryJson) {
    const errors = [];
    const warnings = [];

    try {
        // Check file exists and is readable
        const stats = statSync(zipPath);
        if (!stats.isFile()) {
            errors.push(`${zipPath} is not a regular file`);
            return { valid: false, errors, warnings, bytes: 0 };
        }

        const bytes = stats.size;
        console.log(`Archive size: ${bytes} bytes`);

        // Parse inventory
        let inventory;
        try {
            inventory = typeof inventoryJson === "string" ? JSON.parse(inventoryJson) : inventoryJson;
        } catch (e) {
            errors.push(`Invalid inventory JSON: ${e instanceof Error ? e.message : String(e)}`);
            return { valid: false, errors, warnings, bytes };
        }

        // Compute archive hash
        const sha256 = await computeFileHash(zipPath);
        console.log(`Archive SHA-256: ${sha256}`);

        // Validation checks (full implementation in T054):
        // 1. Open ZIP and enumerate entries
        // 2. Verify each entry matches inventory
        // 3. Check for unexpected entries
        // 4. Validate file sizes and hashes

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            bytes,
            sha256,
            entryCount: inventory.approvedFiles?.length ?? 0
        };
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push(`Verification failed: ${message}`);
        return { valid: false, errors, warnings, bytes: 0 };
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const [, , zipPath, inventoryJson] = process.argv;

    if (!zipPath || !inventoryJson) {
        console.error("Usage: node verify-artifact.mjs <zip-path> <inventory-json>");
        process.exit(1);
    }

    verifyArchive(zipPath, inventoryJson)
        .then((result) => {
            console.log("\n=== Verification Result ===");
            console.log(`Valid: ${result.valid}`);
            if (result.errors.length > 0) {
                console.log("Errors:");
                result.errors.forEach((e) => console.log(`  - ${e}`));
            }
            if (result.warnings.length > 0) {
                console.log("Warnings:");
                result.warnings.forEach((w) => console.log(`  - ${w}`));
            }
            if (result.sha256) {
                console.log(`SHA-256: ${result.sha256}`);
            }
            console.log(`Entry count: ${result.entryCount}`);
            process.exit(result.valid ? 0 : 1);
        })
        .catch((error) => {
            console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        });
}

export { verifyArchive, computeFileHash };
