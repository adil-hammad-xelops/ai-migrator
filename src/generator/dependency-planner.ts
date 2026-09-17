import type { DependencyEvidence } from "../analyzer/source-inventory.js";
import type { TargetProfile } from "../validator/models.js";
import type { DependencyDecision, PreservationFinding } from "./models.js";

export interface RequiredDependencyBehavior {
    readonly packageName: string;
    readonly behavior: string;
    readonly sourceFiles: readonly string[];
}

export interface DependencyPlannerInput {
    readonly dependencyEvidence: DependencyEvidence;
    readonly actualImports: readonly string[];
    readonly buildRequirements: readonly string[];
    readonly requiredBehaviors: readonly RequiredDependencyBehavior[];
    readonly targetProfile: TargetProfile;
}

export interface DependencyPlan {
    readonly decisions: readonly DependencyDecision[];
    readonly preservationFindings: readonly PreservationFinding[];
}

const REACT_RUNTIME = new Set(["react", "react-dom", "react-router", "react-router-dom"]);
const SOURCE_BUILD_ONLY = new Set([
    "@vitejs/plugin-react", "vite", "webpack", "webpack-cli", "react-scripts",
    "@babel/core", "@babel/preset-react", "@swc/core", "eslint-plugin-react"
]);
const VERIFIED_REPLACEMENTS: Readonly<Record<string, string>> = {
    "react-router": "@angular/router",
    "react-router-dom": "@angular/router",
    "formik": "@angular/forms",
    "react-hook-form": "@angular/forms"
};

export function normalizePackageSpecifier(specifier: string): string | null {
    if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("node:")) return null;
    const segments = specifier.split("/");
    if (specifier.startsWith("@")) return segments.length >= 2 ? `${segments[0]}/${segments[1]}` : specifier;
    return segments[0] ?? null;
}

export function planDependencies(input: DependencyPlannerInput): DependencyPlan {
    if (input.targetProfile.admissionStatus !== "admitted") {
        throw new Error(`dependency planning requires an admitted target profile, got ${input.targetProfile.admissionStatus}`);
    }
    const imported = normalizeEvidence(input.actualImports);
    const buildRequired = normalizeEvidence(input.buildRequirements);
    const targetPackages = new Map(input.targetProfile.packages.map((item) => [item.name, item]));
    const decisions: DependencyDecision[] = [];
    const preservationFindings: PreservationFinding[] = [];

    const sourcePackages = new Set([
        ...Object.keys(input.dependencyEvidence.declared),
        ...imported,
        ...input.requiredBehaviors.map(({ packageName }) => packageName)
    ]);
    for (const sourcePackage of [...sourcePackages].sort()) {
        const sourceVersion = input.dependencyEvidence.resolved[sourcePackage] ?? input.dependencyEvidence.declared[sourcePackage] ?? null;
        const requiredBehavior = input.requiredBehaviors.filter(({ packageName }) => packageName === sourcePackage);
        const used = imported.has(sourcePackage) || buildRequired.has(sourcePackage) || requiredBehavior.length > 0;
        const replacementName = VERIFIED_REPLACEMENTS[sourcePackage];
        const replacement = replacementName === undefined ? undefined : targetPackages.get(replacementName);
        const sameTarget = targetPackages.get(sourcePackage);

        if (replacement !== undefined && used) {
            decisions.push(decision(sourcePackage, sourceVersion, replacement.name, replacement.version, "replaced", `Used source behavior is replaced by admitted ${replacement.name}@${replacement.version}.`));
            continue;
        }
        if (sameTarget !== undefined && used) {
            decisions.push(decision(sourcePackage, sourceVersion, sameTarget.name, sameTarget.version, "preserved", `Actual imports/build needs retain the admitted target package version ${sameTarget.version}.`));
            continue;
        }
        if (!used || SOURCE_BUILD_ONLY.has(sourcePackage) || REACT_RUNTIME.has(sourcePackage)) {
            decisions.push(decision(sourcePackage, sourceVersion, null, null, "removed", used ? "Source framework/build runtime is not copied into the Angular target." : "No actual import or trusted target build requirement uses this declared dependency."));
            for (const requirement of requiredBehavior) {
                preservationFindings.push(blocker(requirement, `Required behavior still depends on removed package ${sourcePackage}; no admitted replacement is verified.`));
            }
            continue;
        }

        decisions.push(decision(sourcePackage, sourceVersion, null, null, "manual-review", "The package is actually used but no admitted compatible target package or verified replacement exists."));
        if (requiredBehavior.length > 0) {
            for (const requirement of requiredBehavior) preservationFindings.push(blocker(requirement, `Required behavior depends on unsupported package ${sourcePackage}.`));
        } else {
            preservationFindings.push({ sourceFiles: [], behavior: `Dependency behavior provided by ${sourcePackage}`, outcome: "manual-review", blocking: true, reason: `Actual imports use ${sourcePackage}, but its required behavior and target compatibility are unresolved.` });
        }
    }
    return { decisions, preservationFindings };
}

function normalizeEvidence(specifiers: readonly string[]): ReadonlySet<string> {
    return new Set(specifiers.flatMap((specifier) => {
        const normalized = normalizePackageSpecifier(specifier);
        return normalized === null ? [] : [normalized];
    }));
}

function decision(sourcePackage: string, sourceVersion: string | null, targetPackage: string | null, targetVersion: string | null, kind: DependencyDecision["decision"], reason: string): DependencyDecision {
    return { sourcePackage, sourceVersion, targetPackage, targetVersion, decision: kind, reason };
}

function blocker(requirement: RequiredDependencyBehavior, reason: string): PreservationFinding {
    return { sourceFiles: requirement.sourceFiles, behavior: requirement.behavior, outcome: "unsupported", blocking: true, reason };
}
