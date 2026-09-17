import { describe, expect, it } from "vitest";
import { emitAngularProject, type AngularEmissionUnit } from "../../src/generator/angular-emitter.js";

function unit(overrides: Partial<AngularEmissionUnit>): AngularEmissionUnit {
    return { sourceFile: "src/Home.tsx", sourceName: "HomePage", ownerKind: "routed-page", feature: "account", imports: [], body: "export class HomePage {}", ...overrides };
}

describe("Angular architecture emitter", () => {
    it("assigns every ownership kind to its architecture-v1 boundary", () => {
        const plan = emitAngularProject([
            unit({ ownerKind: "routed-page" }),
            unit({ sourceFile: "src/Avatar.tsx", sourceName: "Avatar", ownerKind: "shared-component", feature: null }),
            unit({ sourceFile: "src/Auth.ts", sourceName: "Auth", ownerKind: "core-service", feature: null }),
            unit({ sourceFile: "src/Shell.tsx", sourceName: "Shell", ownerKind: "layout", feature: null })
        ], [{ sourceFile: "src/routes.tsx", feature: "account", path: "users", pageSourceName: "HomePage", guards: [{ symbol: "authGuard", moduleSpecifier: "../../core/guards/auth.guard" }], params: ["id"] }]);
        expect(plan.files.map(({ path }) => path)).toEqual(expect.arrayContaining([
            "src/app/features/account/pages/home-page.page.ts",
            "src/app/features/account/feature.routes.ts",
            "src/app/shared/components/avatar.component.ts",
            "src/app/core/services/auth.service.ts",
            "src/app/layouts/shell.layout.ts"
        ]));
        const routes = plan.files.find(({ path }) => path.endsWith("feature.routes.ts"))?.content;
        expect(routes).toContain('path: "users/:id"');
        expect(routes).toContain("canActivate: [authGuard]");
        expect(routes).toContain('import { authGuard } from "../../core/guards/auth.guard";');
    });

    it("sorts imports and resolves path collisions deterministically", () => {
        const units = [
            unit({ sourceFile: "src/a/Card.tsx", sourceName: "Card", ownerKind: "shared-component", feature: null, imports: [{ moduleSpecifier: "z", symbols: ["Z"] }, { moduleSpecifier: "a", symbols: ["B", "A"] }] }),
            unit({ sourceFile: "src/b/Card.tsx", sourceName: "Card", ownerKind: "shared-component", feature: null })
        ];
        const first = emitAngularProject(units, []);
        const second = emitAngularProject([...units].reverse(), []);
        expect(first).toEqual(second);
        expect(first.files.map(({ path }) => path)).toEqual([
            "src/app/shared/components/card-c759d7bb.component.ts",
            "src/app/shared/components/card.component.ts"
        ]);
        expect(first.files.find(({ path }) => path.endsWith("card.component.ts"))?.content).toMatch(/^import \{ A, B \} from "a";\nimport \{ Z \} from "z";/);
    });

    it("requires explicit feature ownership and route page resolution", () => {
        expect(() => emitAngularProject([unit({ feature: null })], [])).toThrow(/requires explicit feature ownership/);
        expect(() => emitAngularProject([], [{ sourceFile: "src/routes.ts", feature: "home", path: "", pageSourceName: "Missing", guards: [], params: [] }])).toThrow(/has no routed page/);
    });
});
