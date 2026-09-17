/**
 * Analyzer-owned domain models (data-model.md § SourceInventory, SourceFile,
 * NormalizedProject, UiOccurrence). All types are readonly; instances are produced only
 * by src/analyzer/*.
 */

/** A location in a specific source file, 1-based line/column, source-relative POSIX path. */
export interface SourceSpan {
    readonly path: string;
    readonly startLine: number;
    readonly startColumn: number;
    readonly endLine: number;
    readonly endColumn: number;
}

export type SourceFileDisposition = "analyzed" | "excluded" | "failed";

export interface SourceFile {
    readonly path: string;
    readonly sha256: string;
    readonly sizeBytes: number;
    readonly disposition: SourceFileDisposition;
    readonly reason: string | null;
    readonly roles: readonly string[];
}

export type DetectedFramework = "react" | "angular" | "unknown" | "mixed";

export interface FrameworkEvidence {
    readonly framework: DetectedFramework;
    readonly version: string | null;
    readonly bootstrapFiles: readonly string[];
    readonly manifestEvidence: readonly string[];
    readonly configurationEvidence: readonly string[];
    readonly reason: string;
}

export type InventoryCoverage = "complete" | "partial" | "unknown";

export interface SourceInventory {
    readonly archiveSha256: string;
    readonly applicationRoot: string;
    readonly framework: FrameworkEvidence;
    readonly files: readonly SourceFile[];
    readonly parseDiagnostics: readonly AnalyzerFinding[];
    readonly coverage: InventoryCoverage;
}

export interface AnalyzerFinding {
    readonly code: string;
    readonly message: string;
    readonly severity: "warning" | "error";
    readonly sourceFiles: readonly string[];
}

/** Normalized semantic role of a UI occurrence, independent of source framework syntax. */
export type UiSemanticRole =
    | "button"
    | "input"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "link"
    | "table"
    | "modal"
    | "card"
    | "tabs"
    | "menu"
    | "form"
    | "native-other";

export interface UiOccurrence {
    readonly id: string;
    readonly sourceFile: string;
    readonly span: SourceSpan;
    readonly sourceElement: string;
    readonly role: UiSemanticRole;
    readonly properties: readonly string[];
    readonly events: readonly string[];
    readonly states: readonly string[];
    readonly accessibilityRequirements: readonly string[];
    readonly bindingReferences: readonly string[];
}

export interface RouteDefinition {
    readonly path: string;
    readonly sourceFile: string;
    readonly componentReference: string;
    readonly guards: readonly string[];
    readonly params: readonly string[];
    readonly lazy: boolean;
}

export interface FormDefinition {
    readonly id: string;
    readonly sourceFile: string;
    readonly fields: readonly string[];
    readonly validation: readonly string[];
    readonly resetBehavior: string | null;
}

export interface ServiceDefinition {
    readonly id: string;
    readonly sourceFile: string;
    readonly scope: string;
    readonly methods: readonly string[];
}

export interface ModelDefinition {
    readonly id: string;
    readonly sourceFile: string;
    readonly fields: readonly string[];
}

export interface StateDefinition {
    readonly id: string;
    readonly sourceFile: string;
    readonly kind: "component-state" | "reducer" | "context" | "store" | "signal" | "observable";
    readonly description: string;
}

export interface StyleDefinition {
    readonly sourceFile: string;
    readonly kind: "css" | "scss" | "css-module" | "inline" | "utility";
    readonly scope: "global" | "component" | "module";
    readonly dependsOnAssets: readonly string[];
}

export interface DependencyGraphEdge {
    readonly fromFile: string;
    readonly toFile: string;
    readonly kind: "import" | "dynamic-import" | "asset-reference";
}

export interface PreservationRequirement {
    readonly sourceFiles: readonly string[];
    readonly behavior: string;
}

export interface NormalizedProject {
    readonly inventory: SourceInventory;
    readonly pages: readonly RouteDefinition[];
    readonly components: readonly string[];
    readonly routes: readonly RouteDefinition[];
    readonly forms: readonly FormDefinition[];
    readonly services: readonly ServiceDefinition[];
    readonly models: readonly ModelDefinition[];
    readonly state: readonly StateDefinition[];
    readonly styles: readonly StyleDefinition[];
    readonly dependencyGraph: readonly DependencyGraphEdge[];
    readonly uiOccurrences: readonly UiOccurrence[];
    readonly preservationRequirements: readonly PreservationRequirement[];
}
