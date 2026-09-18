import type { AngularAnalysis } from "../analyzer/angular-adapter.js";
import type { PreservationFinding } from "./models.js";

export interface AngularTransformResult {
    readonly sourceFile: string;
    readonly className: string;
    readonly template: string;
    readonly imports: readonly string[];
    readonly providers: readonly string[];
    readonly lifecycle: readonly string[];
    readonly findings: readonly PreservationFinding[];
}

export function transformAngularComponent(
    component: AngularAnalysis["components"][number],
): AngularTransformResult {
    const findings: PreservationFinding[] = [];
    if (!component.standalone) {
        findings.push(finding(component.sourceFile, "NgModule declaration scope", "NgModule ownership must be reviewed before standalone conversion."));
    }
    if (component.providers.length > 0) {
        findings.push(finding(component.sourceFile, "component provider scope", "Component-scoped providers must remain component-scoped after conversion."));
    }
    if (component.templateKind === "dynamic") {
        findings.push(finding(component.sourceFile, "runtime-generated template", "A dynamic template cannot be safely converted from static evidence."));
    }
    if (component.lifecycle.includes("DoCheck")) {
        findings.push(finding(component.sourceFile, "custom change detection", "DoCheck timing has no direct standalone transform."));
    }
    const imports = component.imports.map((value) => `import ${value} from "@angular/common";`).sort();
    return {
        sourceFile: component.sourceFile,
        className: component.name,
        template: component.template ?? "",
        imports,
        providers: [...component.providers].sort(),
        lifecycle: [...component.lifecycle].sort(),
        findings: unique(findings),
    };
}

export function transformAngularService(
    service: AngularAnalysis["services"][number],
): { readonly sourceFile: string; readonly className: string; readonly providedIn: string; readonly methods: readonly string[]; readonly findings: readonly PreservationFinding[] } {
    const findings: PreservationFinding[] = [];
    if (service.providedIn !== "root" && service.providedIn !== "platform") {
        findings.push(finding(service.sourceFile, "service lifetime", `The ${service.providedIn} provider scope must be preserved explicitly.`));
    }
    if (service.observables.length > 0 && !service.methods.some((method) => /destroy|cleanup|unsubscribe/i.exec(method) !== null)) {
        findings.push(finding(service.sourceFile, "observable subscription cleanup", "Observable lifetime has no statically proven cleanup path."));
    }
    return { sourceFile: service.sourceFile, className: service.name, providedIn: service.providedIn, methods: [...service.methods].sort(), findings: unique(findings) };
}

function finding(sourceFile: string, behavior: string, reason: string): PreservationFinding {
    return { sourceFiles: [sourceFile], behavior, outcome: "manual-review", blocking: true, reason };
}

function unique(findings: readonly PreservationFinding[]): readonly PreservationFinding[] {
    const seen = new Set<string>();
    return findings.filter((item) => {
        const key = `${item.sourceFiles.join(",")}:${item.behavior}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
