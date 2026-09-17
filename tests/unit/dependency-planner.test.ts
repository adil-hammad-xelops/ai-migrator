import { describe, expect, it } from "vitest";
import { normalizePackageSpecifier, planDependencies } from "../../src/generator/dependency-planner.js";
import type { TargetProfile } from "../../src/validator/models.js";

const profile: TargetProfile = {
    profileId: "angular20",
    architectureRevision: "xelops-angular-v1",
    packages: [
        { name: "@angular/router", version: "20.3.15", integrity: "sha512-router" },
        { name: "@angular/forms", version: "20.3.15", integrity: "sha512-forms" },
        { name: "date-fns", version: "4.1.0", integrity: "sha512-date" }
    ],
    lockfileSha256: "0".repeat(64),
    supportExpiresAt: "2027-11-28T00:00:00.000Z",
    admissionStatus: "admitted",
    admissionChecks: []
};

describe("dependency planner", () => {
    it("normalizes external package subpaths while rejecting local and Node imports", () => {
        expect(normalizePackageSpecifier("@scope/pkg/subpath")).toBe("@scope/pkg");
        expect(normalizePackageSpecifier("date-fns/format")).toBe("date-fns");
        expect(normalizePackageSpecifier("./local.js")).toBeNull();
        expect(normalizePackageSpecifier("node:path")).toBeNull();
    });

    it("uses imports and admitted versions to preserve, replace and remove dependencies", () => {
        const plan = planDependencies({
            dependencyEvidence: {
                declared: { react: "^19.0.0", "react-router-dom": "^7.0.0", "date-fns": "^4.0.0", vite: "^7.0.0", lodash: "^4.17.0" },
                resolved: { react: "19.1.1", "react-router-dom": "7.8.2", "date-fns": "4.1.0", vite: "7.1.0", lodash: "4.17.21" },
                lockfileFound: true
            },
            actualImports: ["react", "react-router-dom", "date-fns/format"],
            buildRequirements: ["vite"],
            requiredBehaviors: [],
            targetProfile: profile
        });

        expect(plan.decisions).toEqual(expect.arrayContaining([
            expect.objectContaining({ sourcePackage: "date-fns", sourceVersion: "4.1.0", targetPackage: "date-fns", targetVersion: "4.1.0", decision: "preserved" }),
            expect.objectContaining({ sourcePackage: "react-router-dom", targetPackage: "@angular/router", targetVersion: "20.3.15", decision: "replaced" }),
            expect.objectContaining({ sourcePackage: "react", targetPackage: null, decision: "removed" }),
            expect.objectContaining({ sourcePackage: "vite", targetPackage: null, decision: "removed" }),
            expect.objectContaining({ sourcePackage: "lodash", targetPackage: null, decision: "removed" })
        ]));
        expect(plan.preservationFindings).toEqual([]);
    });

    it("blocks actually used unsupported behavior instead of silently removing it", () => {
        const plan = planDependencies({
            dependencyEvidence: { declared: { "opaque-grid": "^3.0.0" }, resolved: {}, lockfileFound: false },
            actualImports: ["opaque-grid/runtime"],
            buildRequirements: [],
            requiredBehaviors: [{ packageName: "opaque-grid", behavior: "virtualized keyboard navigation", sourceFiles: ["src/Grid.tsx"] }],
            targetProfile: profile
        });
        expect(plan.decisions[0]).toMatchObject({ sourceVersion: "^3.0.0", decision: "manual-review", targetPackage: null });
        expect(plan.preservationFindings[0]).toMatchObject({ outcome: "unsupported", blocking: true, sourceFiles: ["src/Grid.tsx"] });
    });

    it("reports an imported package even when the source manifest omitted it", () => {
        const plan = planDependencies({
            dependencyEvidence: { declared: {}, resolved: {}, lockfileFound: false },
            actualImports: ["undeclared-widget/client"], buildRequirements: [], requiredBehaviors: [], targetProfile: profile
        });
        expect(plan.decisions).toEqual([expect.objectContaining({
            sourcePackage: "undeclared-widget", sourceVersion: null, decision: "manual-review"
        })]);
        expect(plan.preservationFindings[0]?.blocking).toBe(true);
    });

    it("rejects planning against an unadmitted profile", () => {
        expect(() => planDependencies({
            dependencyEvidence: { declared: {}, resolved: {}, lockfileFound: false }, actualImports: [], buildRequirements: [], requiredBehaviors: [],
            targetProfile: { ...profile, admissionStatus: "unverified" }
        })).toThrow(/requires an admitted target profile/);
    });
});
