import { beforeAll, describe, expect, it } from "vitest";
import type { UiOccurrence, UiSemanticRole } from "../../src/analyzer/models.js";
import { loadCatalogSnapshot } from "../../src/catalog/catalog-loader.js";
import type { CatalogSnapshot, PackageEvidence } from "../../src/catalog/models.js";
import { loadPackageEvidence } from "../../src/catalog/package-evidence.js";
import { createMappingPlan } from "../../src/mapper/mapper.js";

let catalog: CatalogSnapshot;
let evidence: PackageEvidence;

beforeAll(async () => {
    catalog = await loadCatalogSnapshot();
    evidence = await loadPackageEvidence("angular20", catalog);
});

function occurrence(role: UiSemanticRole, overrides: Partial<UiOccurrence> = {}): UiOccurrence {
    return {
        id: `src/App.tsx:1:1:${role}`,
        sourceFile: "src/App.tsx",
        span: { path: "src/App.tsx", startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
        sourceElement: role === "modal" ? "dialog" : role,
        role,
        properties: [], events: [], states: [], accessibilityRequirements: [], bindingReferences: [],
        ...overrides
    };
}

function map(...occurrences: readonly UiOccurrence[]) {
    return createMappingPlan({ uiOccurrences: occurrences }, catalog, evidence);
}

describe("FR-028 mapping decisions", () => {
    it("covers every allowed native category without inventing APIs", () => {
        const plan = map(
            occurrence("button", { events: ["onClick"] }),
            occurrence("input"), occurrence("textarea"), occurrence("select"),
            occurrence("checkbox", { properties: ["checked", "disabled"] }),
            occurrence("radio", { properties: ["value", "name"] }),
            occurrence("modal"), occurrence("card", { properties: ["semantic-card"] })
        );
        expect(plan.decisions.map(({ status }) => status)).toEqual([
            "mapped", "manual-review", "manual-review", "manual-review",
            "mapped", "mapped", "manual-review", "mapped"
        ]);
        expect(plan.decisions[0]).toMatchObject({ targetEntryId: "button", eventTranslations: [{ sourceEvent: "onClick", targetEvent: "xlpClick" }] });
        expect(plan.decisions[1]).toMatchObject({ targetEntryId: null, reasonCode: "SELECTOR_EVIDENCE_CONFLICT" });
        expect(plan.decisions[5]).toMatchObject({ candidateEntryIds: ["radio", "radio-group"], targetEntryId: "radio" });
        expect(JSON.stringify(plan)).not.toMatch(/clicked|xlp-textarea|xlp-option|xlp-modal|token/i);
    });

    it("uses manual review for an unknown event payload", () => {
        const decision = map(occurrence("button", { events: ["onClick"], bindingReferences: ["handler($event)"] })).decisions[0];
        expect(decision).toMatchObject({ status: "manual-review", targetEntryId: null, unresolvedRequirements: ["onClick payload"] });
    });

    it("rejects a known incompatible required feature", () => {
        const decision = map(occurrence("button", { properties: ["checked"] })).decisions[0];
        expect(decision).toMatchObject({ status: "unmapped", reasonCode: "REQUIRED_FEATURE_INCOMPATIBLE", targetEntryId: null });
    });

    it("keeps multiple plausible evidence in manual review", () => {
        const conflicted: PackageEvidence = {
            ...evidence,
            selectorConflicts: [...evidence.selectorConflicts, {
                entryId: "button", catalogSelector: "xlp-button", actualSelector: "button[xlpButton]",
                reason: "Two selector forms remain plausible."
            }]
        };
        const decision = createMappingPlan({ uiOccurrences: [occurrence("button")] }, catalog, conflicted).decisions[0];
        expect(decision).toMatchObject({ status: "manual-review", reasonCode: "SELECTOR_EVIDENCE_CONFLICT", targetEntryId: null });
    });

    it("emits one stable decision per occurrence and rejects duplicate IDs", () => {
        const first = occurrence("button");
        const second = occurrence("checkbox", { id: "src/App.tsx:2:1:checkbox" });
        expect(map(first, second).decisions.map(({ occurrenceId }) => occurrenceId)).toEqual([first.id, second.id]);
        expect(() => map(first, { ...second, id: first.id })).toThrow(/unique decision/);
    });
});
