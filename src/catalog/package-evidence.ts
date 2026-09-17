/**
 * Verifies actual package public exports/members against the catalog whitelist (T010).
 * Parses the package's pinned generated .d.ts (Angular's ɵcmp/ɵdir Ivy declarations,
 * a stable machine-generated format) rather than executing the package. This module
 * never widens the catalog: an unmatched real export is recorded as a conflict, and a
 * catalog member absent from real evidence stays unverified, but no catalog entry is
 * added, removed or renamed from what package evidence discovers.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath, URL as NodeUrl } from "node:url";
import type { CatalogSnapshot } from "./models.js";
import type { PackageEvidence, VerifiedMemberContract } from "./models.js";

interface ParsedIvyDeclaration {
    readonly className: string;
    readonly kind: "component" | "directive";
    readonly selector: string;
    readonly inputNames: readonly string[];
    readonly outputNames: readonly string[];
}

/** Splits generic type arguments on top-level commas only (depth-aware over <{[(). */
function splitTopLevelArgs(text: string): string[] {
    const args: string[] = [];
    let depth = 0;
    let current = "";
    let quote: "\"" | "'" | null = null;
    let escaped = false;
    for (const ch of text) {
        if (quote !== null) {
            current += ch;
            if (escaped) escaped = false;
            else if (ch === "\\") escaped = true;
            else if (ch === quote) quote = null;
            continue;
        }
        if (ch === "\"" || ch === "'") {
            quote = ch;
            current += ch;
            continue;
        }
        if (ch === "<" || ch === "{" || ch === "[" || ch === "(") {
            depth += 1;
        } else if (ch === ">" || ch === "}" || ch === "]" || ch === ")") {
            depth -= 1;
        }
        if (ch === "," && depth === 0) {
            args.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    args.push(current);
    return args;
}

/** Splits an object-literal-type body on top-level `;` separators only (depth-aware). */
function splitTopLevelStatements(text: string): string[] {
    const statements: string[] = [];
    let depth = 0;
    let current = "";
    for (const ch of text) {
        if (ch === "<" || ch === "{" || ch === "[" || ch === "(") {
            depth += 1;
        } else if (ch === ">" || ch === "}" || ch === "]" || ch === ")") {
            depth -= 1;
        }
        if (ch === ";" && depth === 0) {
            statements.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    statements.push(current);
    return statements;
}

const TOP_LEVEL_STATEMENT_KEY_PATTERN = /^\s*"([a-zA-Z_$][\w$]*)":/;

/**
 * Extracts top-level property names from an Ivy inputs/outputs object-literal type,
 * whose entries are either `"name": { "alias": ...; ... }` (inputs) or
 * `"name": "alias"` (outputs) — both are `;`-separated statements at depth 0.
 */
function extractTopLevelKeys(objectLiteralText: string): readonly string[] {
    const trimmed = objectLiteralText.trim();
    const withoutBraces =
        trimmed.startsWith("{") && trimmed.endsWith("}") ? trimmed.slice(1, -1) : trimmed;
    const keys: string[] = [];
    for (const statement of splitTopLevelStatements(withoutBraces)) {
        const match = TOP_LEVEL_STATEMENT_KEY_PATTERN.exec(statement);
        const key = match?.[1];
        if (key !== undefined) {
            keys.push(key);
        }
    }
    return keys;
}

const DECLARATION_START_PATTERN =
    /_angular_core\.ɵɵ(Component|Directive)Declaration<([A-Za-z_$][\w$]*),/g;

/** Parses every ɵcmp/ɵdir Ivy declaration line out of a package's generated .d.ts text. */
export function parseIvyDeclarations(declarationFileText: string): readonly ParsedIvyDeclaration[] {
    const results: ParsedIvyDeclaration[] = [];
    for (const line of declarationFileText.split("\n")) {
        DECLARATION_START_PATTERN.lastIndex = 0;
        const startMatch = DECLARATION_START_PATTERN.exec(line);
        if (startMatch === null) {
            continue;
        }
        const kind = startMatch[1] === "Component" ? "component" : "directive";
        const className = startMatch[2];
        if (className === undefined) {
            continue;
        }
        const genericsStart = startMatch.index + startMatch[0].length;
        const lastAngleClose = line.lastIndexOf(">;");
        if (lastAngleClose === -1 || lastAngleClose < genericsStart) {
            continue;
        }
        const genericsText = line.slice(genericsStart, lastAngleClose);
        const args = splitTopLevelArgs(genericsText);
        const rawSelector = args[0]?.trim();
        const inputsArg = args[2] ?? "";
        const outputsArg = args[3] ?? "";
        if (rawSelector === undefined) {
            continue;
        }
        const selectorMatch = /^"((?:[^"\\]|\\.)*)"$/.exec(rawSelector);
        if (selectorMatch === null) {
            continue;
        }
        const selector = selectorMatch[1];
        if (selector === undefined) {
            continue;
        }
        results.push({
            className,
            kind,
            selector,
            inputNames: extractTopLevelKeys(inputsArg),
            outputNames: extractTopLevelKeys(outputsArg)
        });
    }
    return results;
}

/**
 * Cross-references parsed real package declarations against the immutable catalog.
 * A catalog entry's selector must appear as one of the comma-separated selector
 * clauses of a real declaration (attribute directives declare compound selectors,
 * e.g. `input[xlpInput], textarea[xlpInput], select[xlpInput]`).
 */
export function buildPackageEvidence(
    catalog: CatalogSnapshot,
    packageName: string,
    packageVersion: string,
    integrity: string,
    declarations: readonly ParsedIvyDeclaration[]
): PackageEvidence {
    const verifiedExports = declarations.map((d) => d.className);
    const verifiedMembers: VerifiedMemberContract[] = [];
    const selectorConflicts: PackageEvidence["selectorConflicts"][number][] = [];

    for (const entry of catalog.entries) {
        const matchingDeclaration = declarations.find((d) =>
            d.selector
                .split(",")
                .map((clause) => clause.trim())
                .some((clause) =>
                    clause === entry.selector ||
                    clause.includes(`[${entry.selector}]`) ||
                    (entry.id === "input" && clause.includes("[xlpInput]"))
                )
        );

        if (matchingDeclaration === undefined) {
            selectorConflicts.push({
                entryId: entry.id,
                catalogSelector: entry.selector,
                actualSelector: "<no matching real declaration found>",
                reason: "No real package export declares a selector matching the catalog entry."
            });
            continue;
        }

        if (matchingDeclaration.selector !== entry.selector) {
            selectorConflicts.push({
                entryId: entry.id,
                catalogSelector: entry.selector,
                actualSelector: matchingDeclaration.selector,
                reason:
                    "Catalog selector does not exactly match the real declared selector; " +
                    "treat as manual-review rather than inferring a replacement."
            });
        }

        for (const catalogInput of entry.inputs) {
            verifiedMembers.push({
                entryId: entry.id,
                memberName: catalogInput,
                verified: matchingDeclaration.inputNames.includes(catalogInput),
                provenance: "package-type-declaration",
                conflict: matchingDeclaration.inputNames.includes(catalogInput)
                    ? null
                    : "catalog input has no corresponding real input"
            });
        }
        for (const catalogOutput of entry.outputs) {
            verifiedMembers.push({
                entryId: entry.id,
                memberName: catalogOutput,
                verified: matchingDeclaration.outputNames.includes(catalogOutput),
                provenance: "package-type-declaration",
                conflict: matchingDeclaration.outputNames.includes(catalogOutput)
                    ? null
                    : "catalog output has no corresponding real output"
            });
        }
    }

    return {
        packageName,
        packageVersion,
        integrity,
        verifiedExports,
        verifiedMembers,
        selectorConflicts
    };
}

export interface CandidateManifest {
    readonly packageName: string;
    readonly packageVersion: string;
    readonly integrity: string;
    readonly declarationFile: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeCandidateManifest(value: unknown): CandidateManifest {
    if (!isRecord(value)) {
        throw new Error("candidate.json must be an object");
    }
    const { packageName, packageVersion, integrity, declarationFile } = value;
    if (
        typeof packageName !== "string" ||
        typeof packageVersion !== "string" ||
        typeof integrity !== "string" ||
        typeof declarationFile !== "string"
    ) {
        throw new Error("candidate.json is missing required string fields");
    }
    return { packageName, packageVersion, integrity, declarationFile };
}

/** Loads profiles/<profileId>/candidate.json plus its pinned declaration file, and verifies it. */
export async function loadPackageEvidence(
    profileId: string,
    catalog: CatalogSnapshot
): Promise<PackageEvidence> {
    const profileDirUrl = new NodeUrl(`../../profiles/${profileId}/`, import.meta.url);
    const manifestUrl = new NodeUrl("candidate.json", profileDirUrl);
    const manifestRaw = await readFile(fileURLToPath(manifestUrl), "utf8");
    const manifest = decodeCandidateManifest(JSON.parse(manifestRaw));
    const declarationUrl = new NodeUrl(manifest.declarationFile, profileDirUrl);
    const declarationText = await readFile(fileURLToPath(declarationUrl), "utf8");
    const declarations = parseIvyDeclarations(declarationText);
    return buildPackageEvidence(
        catalog,
        manifest.packageName,
        manifest.packageVersion,
        manifest.integrity,
        declarations
    );
}
