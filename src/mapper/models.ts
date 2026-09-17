/**
 * Mapper-owned domain models (data-model.md § MappingDecision).
 * Exactly one decision exists per detected UiOccurrence (enforced by src/mapper/mapper.ts).
 */

export type MappingStatus = "mapped" | "unmapped" | "manual-review";

export interface PropertyTranslation {
    readonly sourceProperty: string;
    readonly targetProperty: string;
}

export interface EventTranslation {
    readonly sourceEvent: string;
    readonly targetEvent: string;
}

export interface MappingDecision {
    readonly occurrenceId: string;
    readonly sourceFile: string;
    readonly sourceElement: string;
    readonly status: MappingStatus;
    readonly reasonCode: string;
    readonly reason: string;
    readonly candidateEntryIds: readonly string[];
    /** Only set when status is "mapped"; null otherwise. */
    readonly targetEntryId: string | null;
    readonly propertyTranslations: readonly PropertyTranslation[];
    readonly eventTranslations: readonly EventTranslation[];
    readonly preservedRequirements: readonly string[];
    readonly unresolvedRequirements: readonly string[];
}

export interface MappingPlan {
    readonly catalogRevision: string;
    readonly decisions: readonly MappingDecision[];
}
