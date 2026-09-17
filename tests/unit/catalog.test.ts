import { describe, expect, it } from "vitest";
import { loadCatalogSnapshot } from "../../src/catalog/catalog-loader.js";
import { loadPackageEvidence } from "../../src/catalog/package-evidence.js";

describe("FR-028 catalog contract", () => {
    it("contains only the documented native-category selectors and members", async () => {
        const catalog = await loadCatalogSnapshot();
        const byId = new Map(catalog.entries.map((entry) => [entry.id, entry]));

        expect(byId.get("button")).toMatchObject({ selector: "xlp-button", outputs: ["xlpClick"] });
        expect(byId.get("input")).toMatchObject({ selector: "xlp-input", inputs: ["size", "invalid"], outputs: [] });
        expect(byId.get("select")).toMatchObject({ selector: "xlp-select", inputs: ["placeholder", "size"], outputs: [] });
        expect(byId.get("checkbox")).toMatchObject({ selector: "xlp-checkbox", inputs: ["disabled"], outputs: [] });
        expect(byId.get("radio")).toMatchObject({ selector: "xlp-radio", inputs: ["value"], outputs: [] });
        expect(byId.get("radio-group")).toMatchObject({ selector: "xlp-radio-group", inputs: ["orientation"], outputs: [] });
        expect(byId.get("dialog")).toMatchObject({ selector: "xlp-dialog", inputs: [], outputs: [] });
        expect(byId.get("card")).toMatchObject({ selector: "xlp-card", inputs: ["variant"], outputs: [] });

        const serialized = JSON.stringify([...byId.values()].filter(({ id }) => ["button", "input", "select", "checkbox", "radio", "radio-group", "dialog", "card"].includes(id)));
        expect(serialized).not.toContain("clicked");
        expect(serialized).not.toContain("xlp-textarea");
        expect(serialized).not.toContain("xlp-option");
        expect(serialized).not.toContain("xlp-modal");
        expect(serialized).not.toContain("designToken");
    });

    it("records the real input attribute-selector conflict", async () => {
        const catalog = await loadCatalogSnapshot();
        const evidence = await loadPackageEvidence("angular20", catalog);
        expect(evidence.selectorConflicts).toContainEqual(expect.objectContaining({
            entryId: "input",
            catalogSelector: "xlp-input",
            actualSelector: "input[xlpInput], textarea[xlpInput], select[xlpInput]"
        }));
    });
});
