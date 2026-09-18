/**
 * Generator composition (T038): Apply mapping decisions to generate target Angular project.
 * Only mapped decisions select emitted targets. Preserve safe native/custom elements where
 * unmapped/manual-review. Collect preservation blockers and generated inventory.
 */

import type { NormalizedProject } from "../analyzer/models.js";
import type { MappingPlan, MappingDecision } from "../mapper/models.js";
import type { TargetProfile } from "../validator/models.js";
import type { GeneratedProject, PreservationFinding, DependencyDecision } from "./models.js";
import { transformReactComponent } from "./react-transforms.js";
import { transformBehavior } from "./behavior-transforms.js";
import { emitStyles } from "./style-emitter.js";
import { planDependencies } from "./dependency-planner.js";
import { emitAngularProject } from "./angular-emitter.js";

export interface GeneratorInput {
    readonly project: NormalizedProject;
    readonly mappingPlan: MappingPlan;
    readonly profile: TargetProfile;
    readonly profileId: string;
}

export interface GeneratorOutput {
    readonly generated: GeneratedProject;
    readonly findings: readonly PreservationFinding[];
}

/**
 * Generate target Angular project by applying mapping decisions.
 * Only mapped decisions produce emitted Xelops components. Unmapped UI is preserved natively
 * where safe. All decisions (mapped/unmapped/manual-review) are tracked with findings.
 */
export async function generateProject(input: GeneratorInput): Promise<GeneratorOutput> {
    const findings: PreservationFinding[] = [];

    // Phase 1: Validate input
    if (!input.project || !input.mappingPlan || !input.profile) {
        findings.push({
            sourceFiles: [],
            behavior: "missing generator input",
            outcome: "unsupported",
            blocking: true,
            reason: "Generator requires project, mapping plan, and profile to proceed.",
        });
        return {
            generated: {
                profileId: input.profileId,
                files: [],
                dependencyDecisions: [],
                preservationFindings: findings,
            },
            findings,
        };
    }

    // Phase 2: Plan dependencies
    const dependencyPlan = await planDependencies({
        dependencyEvidence: { declared: {}, resolved: {}, lockfileFound: false },
        actualImports: [], // TODO: Extract from analysis
        buildRequirements: [], // TODO: Extract from build evidence
        requiredBehaviors: [], // TODO: Extract from usage analysis
        targetProfile: input.profile,
    });

    findings.push(...dependencyPlan.preservationFindings);

    // Phase 3: Classify all occurrences by decision outcome
    const mappedDecisions: MappingDecision[] = [];
    const unmappedDecisions: MappingDecision[] = [];
    const manualReviewDecisions: MappingDecision[] = [];

    for (const decision of input.mappingPlan.decisions) {
        if (decision.status === "mapped") {
            mappedDecisions.push(decision);
        } else if (decision.status === "unmapped") {
            unmappedDecisions.push(decision);
        } else {
            manualReviewDecisions.push(decision);
        }
    }

    // Phase 4: Generate components for mapped decisions only
    const generatedFiles: Array<{ path: string; sha256: string; sourceFiles: readonly string[] }> = [];
    const preservationFindings: PreservationFinding[] = [];

    for (const decision of mappedDecisions) {
        try {
            // Find the source occurrence
            const occurrence = input.project.uiOccurrences.find((o) => o.id === decision.occurrenceId);
            if (!occurrence) {
                findings.push({
                    sourceFiles: [],
                    behavior: `missing occurrence for mapping decision ${decision.occurrenceId}`,
                    outcome: "unsupported",
                    blocking: true,
                    reason: `Occurrence ${decision.occurrenceId} not found in project inventory.`,
                });
                continue;
            }

            // Generate component based on framework
            if (input.project.inventory.framework.framework === "react") {
                // Transform React component for Angular
                const sourceFile = occurrence.sourceFile;
                const sourceText = ""; // Would be read from actual source in real implementation
                const transformOutput = transformReactComponent({
                    sourceFile,
                    source: sourceText,
                    componentName: occurrence.sourceElement,
                });

                preservationFindings.push(...transformOutput.findings);

                // TODO: Emit transformed component file
                generatedFiles.push({
                    path: `src/app/shared/components/${occurrence.sourceElement}/${occurrence.sourceElement}.component.ts`,
                    sha256: "", // Would be computed
                    sourceFiles: [sourceFile],
                });
            }

            // Extract behavior (forms, API calls)
            const propsSet = new Set(occurrence.properties);
            if (propsSet.has("form") || propsSet.has("formControl")) {
                const behaviorOutput = transformBehavior({
                    sourceFile: occurrence.sourceFile,
                    source: "", // Would be read from actual source
                    formName: occurrence.sourceElement,
                });

                preservationFindings.push(...behaviorOutput.findings);
            }
        } catch (error) {
            findings.push({
                sourceFiles: [decision.occurrenceId],
                behavior: "component generation error",
                outcome: "manual-review",
                blocking: true,
                reason: `Failed to generate component for ${decision.occurrenceId}: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }

    // Phase 5: Plan preservation for unmapped and manual-review
    for (const decision of [...unmappedDecisions, ...manualReviewDecisions]) {
        const occurrence = input.project.uiOccurrences.find((o) => o.id === decision.occurrenceId);
        if (occurrence) {
            // Preserve native HTML if semantically safe
            const shouldPreserve = isPreservableSafely(occurrence, decision);
            if (shouldPreserve) {
                preservationFindings.push({
                    sourceFiles: [occurrence.sourceFile],
                    behavior: occurrence.sourceElement,
                    outcome: "preserved",
                    blocking: false,
                    reason: decision.reason || "Preserved as native HTML with equivalent behavior.",
                });
            } else {
                preservationFindings.push({
                    sourceFiles: [occurrence.sourceFile],
                    behavior: occurrence.sourceElement,
                    outcome: decision.status === "unmapped" ? "unsupported" : "manual-review",
                    blocking: decision.status === "unmapped",
                    reason: decision.reason || "Cannot be safely preserved; manual review required.",
                });
            }
        }
    }

    // Phase 6: Generate styles
    for (const style of input.project.styles) {
        // Generate a style name from the source file path
        const styleName = style.sourceFile.replace(/^.*\//, "").replace(/\.(css|scss)$/, "");

        const styleOutput = emitStyles({
            sourceFile: style.sourceFile,
            source: "", // Would be read from actual source
            kind: style.kind,
            targetPath: `src/app/shared/styles/${styleName}.component.scss`,
        });

        preservationFindings.push(...styleOutput.preservationFindings);

        generatedFiles.push({
            path: styleOutput.targetPath,
            sha256: "", // Would be computed
            sourceFiles: [style.sourceFile],
        });
    }

    // Phase 7: Emit Angular project structure
    // Extract emission units from mapped decisions and routes
    const emissionUnits: any[] = []; // TODO: Build from mapped decisions
    const emissionRoutes: any[] = []; // TODO: Build from routes

    const angularProject = emitAngularProject(emissionUnits, emissionRoutes);

    // Phase 8: Reconcile counts and verify validity
    const mappedCount = mappedDecisions.length;
    const unmappedCount = unmappedDecisions.length;
    const manualReviewCount = manualReviewDecisions.length;
    const totalCount = mappedCount + unmappedCount + manualReviewCount;

    // Verify counts reconcile
    if (totalCount !== input.project.uiOccurrences.length) {
        findings.push({
            sourceFiles: [],
            behavior: "decision count mismatch",
            outcome: "unsupported",
            blocking: true,
            reason: `Decision count (${totalCount}) does not match occurrence count (${input.project.uiOccurrences.length}).`,
        });
    }

    // Check for required behavior blockers
    const blockingFindings = preservationFindings.filter((f) => f.blocking);
    if (blockingFindings.length > 0) {
        findings.push({
            sourceFiles: blockingFindings.map((f) => f.sourceFiles[0]!).filter((f): f is string => !!f),
            behavior: "required behavior blockers",
            outcome: "unsupported",
            blocking: true,
            reason: `${blockingFindings.length} preservation findings block completion.`,
        });
    }

    return {
        generated: {
            profileId: input.profileId,
            files: generatedFiles,
            dependencyDecisions: dependencyPlan.decisions,
            preservationFindings: [...preservationFindings, ...findings],
        },
        findings,
    };
}

/**
 * Determine if an occurrence can be safely preserved as native HTML.
 * Safe preservation: semantic HTML elements without required Xelops-specific behavior.
 */
function isPreservableSafely(occurrence: any, decision: MappingDecision): boolean {
    // Check if there's a native HTML equivalent that preserves semantics
    const safeNativeElements = ["input", "textarea", "button", "div", "span", "p", "label", "form"];

    // If the occurrence is a basic HTML element, it can be preserved
    if (safeNativeElements.includes(occurrence.role?.toLowerCase() ?? "")) {
        // Check if it has accessibility requirements
        if (occurrence.accessibility && Object.keys(occurrence.accessibility).length > 0) {
            // Only safe if accessibility can be met with native HTML
            const nativeAccessibility = ["aria-label", "aria-describedby", "role", "tabindex"];
            const unsafeAccessibility = Object.keys(occurrence.accessibility).filter(
                (attr) => !nativeAccessibility.includes(attr)
            );

            if (unsafeAccessibility.length > 0) {
                return false;
            }
        }

        return true;
    }

    return false;
}
