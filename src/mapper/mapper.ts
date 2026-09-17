import type { NormalizedProject } from "../analyzer/models.js";
import type { CatalogSnapshot, PackageEvidence } from "../catalog/models.js";
import { evaluateCompatibility } from "./compatibility.js";
import type { MappingDecision, MappingPlan } from "./models.js";

export function createMappingPlan(project: Pick<NormalizedProject, "uiOccurrences">, catalog: CatalogSnapshot, evidence: PackageEvidence): MappingPlan {
    const decisions = project.uiOccurrences.map((occurrence): MappingDecision => {
        const compatibility = evaluateCompatibility(occurrence, catalog, evidence);
        const status = compatibility.state === "compatible" ? "mapped" : compatibility.state === "incompatible" ? "unmapped" : "manual-review";
        return {
            occurrenceId: occurrence.id, sourceFile: occurrence.sourceFile, sourceElement: occurrence.sourceElement,
            status, reasonCode: compatibility.reasonCode, reason: compatibility.reason,
            candidateEntryIds: compatibility.entryIds,
            targetEntryId: status === "mapped" ? compatibility.entryIds[0] ?? null : null,
            propertyTranslations: compatibility.propertyTranslations, eventTranslations: compatibility.eventTranslations,
            preservedRequirements: compatibility.preservedRequirements, unresolvedRequirements: compatibility.unresolvedRequirements
        };
    });
    if (new Set(decisions.map(({ occurrenceId }) => occurrenceId)).size !== decisions.length) throw new Error("mapping plan requires one unique decision per UI occurrence");
    return { catalogRevision: catalog.revision, decisions };
}
