import type { UiOccurrence, UiSemanticRole } from "../analyzer/models.js";
import type { CatalogComponentEntry, CatalogSnapshot, PackageEvidence } from "../catalog/models.js";

export type CompatibilityState = "compatible" | "incompatible" | "uncertain";

export interface CandidateCompatibility {
    readonly entryIds: readonly string[];
    readonly state: CompatibilityState;
    readonly reasonCode: string;
    readonly reason: string;
    readonly propertyTranslations: readonly { sourceProperty: string; targetProperty: string }[];
    readonly eventTranslations: readonly { sourceEvent: string; targetEvent: string }[];
    readonly preservedRequirements: readonly string[];
    readonly unresolvedRequirements: readonly string[];
}

const ROLE_CANDIDATES: Readonly<Partial<Record<UiSemanticRole, readonly string[]>>> = {
    button: ["button"], input: ["input"], textarea: ["input"], select: ["select"],
    checkbox: ["checkbox"], radio: ["radio", "radio-group"], modal: ["dialog"], card: ["card"]
};
const NATIVE_PROPERTIES = new Set(["id", "name", "class", "style", "title", "type", "value", "required", "readonly", "autocomplete", "placeholder", "min", "max", "step", "pattern", "multiple"]);
const FORM_REQUIREMENTS = new Set(["value", "checked", "disabled", "required", "readonly", "name"]);

function normalizeMember(member: string): string {
    return member.replace(/^\[|\]$/g, "").replace(/^\(|\)$/g, "").replace(/^on/, "").toLowerCase();
}

function catalogEntries(snapshot: CatalogSnapshot, ids: readonly string[]): readonly CatalogComponentEntry[] {
    return ids.flatMap((id) => {
        const entry = snapshot.entries.find((candidate) => candidate.id === id);
        return entry === undefined ? [] : [entry];
    });
}

function hasVerifiedMember(evidence: PackageEvidence, entryId: string, member: string): boolean {
    return evidence.verifiedMembers.some((item) => item.entryId === entryId && item.memberName === member && item.verified && item.conflict === null);
}

export function evaluateCompatibility(occurrence: UiOccurrence, catalog: CatalogSnapshot, evidence: PackageEvidence): CandidateCompatibility {
    const entryIds = ROLE_CANDIDATES[occurrence.role] ?? [];
    if (entryIds.length === 0) return result(entryIds, "incompatible", "NO_ALLOWED_CANDIDATE", "FR-028 allows no catalog candidate for this semantic role.", [], [], [], [occurrence.role]);
    const entries = catalogEntries(catalog, entryIds);
    if (entries.length !== entryIds.length) return result(entryIds, "incompatible", "CATALOG_ENTRY_MISSING", "An FR-028 candidate is absent from the pinned catalog.", [], [], [], entryIds);
    const conflict = evidence.selectorConflicts.find(({ entryId }) => entryIds.includes(entryId));
    if (conflict !== undefined) return result(entryIds, "uncertain", "SELECTOR_EVIDENCE_CONFLICT", conflict.reason, [], [], [], [conflict.catalogSelector, conflict.actualSelector]);
    if (occurrence.role === "select") return result(entryIds, "uncertain", "SELECT_OPTION_COMPOSITION_UNKNOWN", "The catalog does not establish option composition for xlp-select.", [], [], [], ["option composition"]);
    if (occurrence.role === "modal") return result(entryIds, "uncertain", "DIALOG_SERVICE_CONTRACT_INCOMPLETE", "Dialog service configuration and close-result semantics are not established.", [], [], [], ["open/close semantics"]);
    if (occurrence.role === "card" && !occurrence.properties.includes("semantic-card")) return result(entryIds, "incompatible", "CARD_INTENT_UNPROVEN", "A card-like class or element name does not establish semantic card intent.", [], [], [], ["semantic card intent"]);

    const primary = entries[0];
    if (primary === undefined) return result(entryIds, "incompatible", "CATALOG_ENTRY_MISSING", "The candidate is absent from the pinned catalog.", [], [], [], entryIds);
    const properties: { sourceProperty: string; targetProperty: string }[] = [];
    const events: { sourceEvent: string; targetEvent: string }[] = [];
    const preserved: string[] = [];
    const unresolved: string[] = [];
    let incompatible = false;

    for (const property of occurrence.properties) {
        const normalized = normalizeMember(property);
        if (normalized.startsWith("aria-") || normalized.startsWith("data-") || NATIVE_PROPERTIES.has(normalized) || property === "semantic-card") {
            preserved.push(property);
            continue;
        }
        const catalogMember = primary.inputs.find((input) => input.toLowerCase() === normalized);
        if (catalogMember !== undefined && hasVerifiedMember(evidence, primary.id, catalogMember)) properties.push({ sourceProperty: property, targetProperty: catalogMember });
        else if (FORM_REQUIREMENTS.has(normalized)) {
            if (["checkbox", "radio", "select"].includes(occurrence.role) && primary.usage?.includes("ControlValueAccessor") === true) preserved.push(property);
            else { incompatible = true; unresolved.push(property); }
        } else unresolved.push(property);
    }
    for (const event of occurrence.events) {
        const normalized = normalizeMember(event);
        if (occurrence.role === "button" && normalized === "click" && hasVerifiedMember(evidence, "button", "xlpClick")) {
            if (occurrence.bindingReferences.some((binding) => binding.includes("$event"))) unresolved.push(`${event} payload`);
            else events.push({ sourceEvent: event, targetEvent: "xlpClick" });
        } else if (["checkbox", "radio", "select"].includes(occurrence.role) && normalized === "change") preserved.push(event);
        else unresolved.push(`${event} payload`);
    }
    for (const requirement of [...occurrence.states, ...occurrence.accessibilityRequirements]) {
        if (!occurrence.properties.includes(requirement) && !preserved.includes(requirement)) unresolved.push(requirement);
    }
    if (incompatible) return result(entryIds, "incompatible", "REQUIRED_FEATURE_INCOMPATIBLE", "A required source feature is known to be incompatible with the candidate contract.", properties, events, preserved, unresolved);
    if (unresolved.length > 0) return result(entryIds, "uncertain", "REQUIRED_FEATURE_UNKNOWN", "Candidate evidence does not establish every required source feature.", properties, events, preserved, unresolved);
    return result(entryIds, "compatible", "COMPATIBLE", "All required semantics are established by catalog and package evidence.", properties, events, preserved, []);
}

function result(entryIds: readonly string[], state: CompatibilityState, reasonCode: string, reason: string, propertyTranslations: CandidateCompatibility["propertyTranslations"], eventTranslations: CandidateCompatibility["eventTranslations"], preservedRequirements: readonly string[], unresolvedRequirements: readonly string[]): CandidateCompatibility {
    return { entryIds, state, reasonCode, reason, propertyTranslations, eventTranslations, preservedRequirements, unresolvedRequirements };
}
