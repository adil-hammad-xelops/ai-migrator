import type {
    SourceFile,
    FrameworkEvidence,
    AnalyzerFinding,
    InventoryCoverage,
    UiOccurrence,
    UiSemanticRole,
} from './models.js';
import type { SourceInventoryResult } from './source-inventory.js';
import type { ImportGraphResult } from './import-graph.js';
import { buildSourceInventory } from './source-inventory.js';
import { detectFramework } from './framework-detector.js';
import { buildImportGraph } from './import-graph.js';
import { analyzeReact } from './react-adapter.js';
import { analyzeAngular } from './angular-adapter.js';
import { analyzeStyles } from './style-analyzer.js';
import type { ReactAnalysis } from './react-adapter.js';
import type { AngularAnalysis } from './angular-adapter.js';
import type { StyleAnalysis } from './style-analyzer.js';

/**
 * T027: Analyzer composition
 * Orchestrates the six-stage analysis pipeline:
 * 1. Source inventory (file enumeration and classification)
 * 2. Framework detection (React vs Angular)
 * 3. Import graph (reachability and dependencies)
 * 4. Framework adapter (component/service/route detection)
 * 5. Style analyzer (CSS/SCSS and asset detection)
 * 6. Result composition (normalized project view)
 */

export interface DetectedOccurrence {
    id: string; // deterministic: path:type:name:line:col
    type:
    | 'component'
    | 'page'
    | 'route'
    | 'service'
    | 'model'
    | 'form'
    | 'state'
    | 'style'
    | 'asset';
    name: string;
    sourceFile: string;
    startLine: number;
    endLine?: number;
    startCol?: number;
    endCol?: number;
    evidence: string[];
    blockers?: { code: string; message: string }[];
}

export interface NormalizedProject {
    // Core metadata
    framework: 'react' | 'angular' | 'mixed' | 'unknown';
    frameworkVersion: string;
    applicationRoot: string;
    projectName: string;

    // Detected entities
    occurrences: DetectedOccurrence[];
    uiOccurrences: UiOccurrence[];
    coverage: InventoryCoverage;

    // Classification by type (derived from occurrences)
    pages: DetectedOccurrence[];
    components: DetectedOccurrence[];
    routes: DetectedOccurrence[];
    services: DetectedOccurrence[];
    models: DetectedOccurrence[];
    forms: DetectedOccurrence[];
    state: DetectedOccurrence[];
    styles: DetectedOccurrence[];
    assets: DetectedOccurrence[];

    // Source mappings
    sourceInventory: { files: readonly SourceFile[] };

    // Framework-specific analysis
    reactAnalysis?: ReactAnalysis;
    angularAnalysis?: AngularAnalysis;
    styleAnalysis: StyleAnalysis;

    // Disposition tracking
    statistics: {
        totalFiles: number;
        analyzedFiles: number;
        reachableFiles: number;
        unreachableFiles: number;
        failedParsing: number;
    };

    // Findings and blockers
    findings: readonly AnalyzerFinding[];

    // Unparsed regions (partial analysis)
    unparsedRegions: {
        sourceFile: string;
        reason: string;
        region: { startLine: number; endLine: number };
    }[];
}

/**
 * Main analyzer entry point
 * Runs all stages and returns normalized project
 */
export async function analyzeProject(
    rootDir: string
): Promise<NormalizedProject> {
    const findings: AnalyzerFinding[] = [];

    try {
        // Stage 1: Source inventory
        const sourceInventory = await buildSourceInventory(rootDir);

        // Stage 2: Framework detection
        const frameworkEvidence = await detectFramework(sourceInventory);

        // Stage 3: Import graph
        let importGraph: ImportGraphResult = {
            edges: [],
            reachableFiles: new Set(),
            unreachableFiles: [],
            findings: [],
        };

        try {
            // Determine entry files based on framework
            const entryFiles = determineEntryFiles(
                sourceInventory,
                frameworkEvidence
            );

            if (entryFiles.length > 0) {
                importGraph = await buildImportGraph(sourceInventory, entryFiles);
            }
        } catch (error) {
            findings.push({
                code: 'IMPORT_GRAPH_ERROR',
                message: `Failed to build import graph: ${error instanceof Error ? error.message : 'unknown'}`,
                sourceFiles: [],
                severity: 'warning',
            });
        }

        // Stage 4: Framework-specific analysis
        let reactAnalysis: ReactAnalysis | undefined;
        let angularAnalysis: AngularAnalysis | undefined;

        if (frameworkEvidence.framework === 'react') {
            try {
                reactAnalysis = await analyzeReact(
                    sourceInventory,
                    frameworkEvidence,
                    rootDir
                );
                // Filter findings to only push those with proper AnalyzerFinding structure
                const reactFindings = reactAnalysis.findings.map(f => ({
                    code: f.code || 'REACT_FINDING',
                    message: f.message,
                    sourceFiles: f.sourceFile ? [f.sourceFile] : [],
                    severity: 'warning' as const,
                }));
                findings.push(...reactFindings);
            } catch (error) {
                findings.push({
                    code: 'REACT_ANALYSIS_ERROR',
                    message: `React analysis failed: ${error instanceof Error ? error.message : 'unknown'}`,
                    sourceFiles: [],
                    severity: 'error',
                });
            }
        } else if (frameworkEvidence.framework === 'angular') {
            try {
                angularAnalysis = await analyzeAngular(
                    sourceInventory,
                    frameworkEvidence,
                    rootDir
                );
                // Filter findings to only push those with proper AnalyzerFinding structure
                const angularFindings = angularAnalysis.findings.map(f => ({
                    code: f.code || 'ANGULAR_FINDING',
                    message: f.message,
                    sourceFiles: f.sourceFile ? [f.sourceFile] : [],
                    severity: 'warning' as const,
                }));
                findings.push(...angularFindings);
            } catch (error) {
                findings.push({
                    code: 'ANGULAR_ANALYSIS_ERROR',
                    message: `Angular analysis failed: ${error instanceof Error ? error.message : 'unknown'}`,
                    sourceFiles: [],
                    severity: 'error',
                });
            }
        } else if (frameworkEvidence.framework === 'mixed') {
            findings.push({
                code: 'MIXED_FRAMEWORK',
                message: 'Project contains both React and Angular code; cannot determine primary framework',
                sourceFiles: [],
                severity: 'error',
            });
        } else {
            findings.push({
                code: 'UNKNOWN_FRAMEWORK',
                message: 'Could not detect framework type',
                sourceFiles: [],
                severity: 'error',
            });
        }

        // Stage 5: Style analysis
        let styleAnalysis: StyleAnalysis = {
            cssModules: [],
            globalStyles: [],
            assets: [],
            utilities: [],
            customProperties: [],
            findings: [],
        };

        try {
            styleAnalysis = await analyzeStyles(
                sourceInventory,
                frameworkEvidence,
                rootDir
            );
            // Filter findings to only push those with proper AnalyzerFinding structure
            const styleFindings = styleAnalysis.findings.map(f => ({
                code: f.code || 'STYLE_FINDING',
                message: f.message,
                sourceFiles: f.sourceFile ? [f.sourceFile] : [],
                severity: 'warning' as const,
            }));
            findings.push(...styleFindings);
        } catch (error) {
            findings.push({
                code: 'STYLE_ANALYSIS_ERROR',
                message: `Style analysis failed: ${error instanceof Error ? error.message : 'unknown'}`,
                sourceFiles: [],
                severity: 'warning',
            });
        }

        // Stage 6: Compose normalized project
        const uiOccurrences = composeUiOccurrences(reactAnalysis, angularAnalysis);
        const occurrences = composeOccurrences(
            sourceInventory,
            frameworkEvidence,
            reactAnalysis,
            angularAnalysis,
            styleAnalysis
        );

        // Assign deterministic IDs
        const occurrencesWithIds = occurrences.map((occ) => ({
            ...occ,
            id: generateOccurrenceId(occ),
        }));

        // Collect unparsed regions
        const unparsedRegions = collectUnparsedRegions(
            sourceInventory,
            occurrencesWithIds
        );
        const analyzedUiFiles = sourceInventory.files.filter(
            (file) =>
                file.disposition === 'analyzed' &&
                (file.roles.includes('script') || file.roles.includes('template'))
        );
        if (uiOccurrences.length === 0 && analyzedUiFiles.length > 0) {
            findings.push({
                code: 'ANALYSIS_ZERO_UI_PARTIAL',
                message: 'Analyzed script/template files produced no UI occurrences; coverage cannot be complete',
                sourceFiles: analyzedUiFiles.map(({ path }) => path),
                severity: 'warning',
            });
        }
        const coverage = determineCoverage(
            frameworkEvidence,
            sourceInventory.files,
            findings,
            uiOccurrences
        );

        // Calculate statistics
        const stats = {
            totalFiles: sourceInventory.files.length,
            analyzedFiles: sourceInventory.files.filter(
                (file) => file.disposition === 'analyzed'
            ).length,
            reachableFiles: importGraph.reachableFiles.size,
            unreachableFiles: importGraph.unreachableFiles.length,
            failedParsing: findings.filter((f) =>
                f.code.includes('PARSE_ERROR')
            ).length,
        };

        // Categorize occurrences
        const pages = occurrencesWithIds.filter((o) => o.type === 'page');
        const components = occurrencesWithIds.filter(
            (o) => o.type === 'component'
        );
        const routes = occurrencesWithIds.filter((o) => o.type === 'route');
        const services = occurrencesWithIds.filter((o) => o.type === 'service');
        const models = occurrencesWithIds.filter((o) => o.type === 'model');
        const forms = occurrencesWithIds.filter((o) => o.type === 'form');
        const state = occurrencesWithIds.filter((o) => o.type === 'state');
        const styles = occurrencesWithIds.filter((o) => o.type === 'style');
        const assets = occurrencesWithIds.filter((o) => o.type === 'asset');

        return {
            framework: frameworkEvidence.framework,
            frameworkVersion: frameworkEvidence.version ?? 'unknown',
            applicationRoot: rootDir,
            projectName: extractProjectName(rootDir),
            occurrences: occurrencesWithIds,
            uiOccurrences,
            coverage,
            pages,
            components,
            routes,
            services,
            models,
            forms,
            state,
            styles,
            assets,
            sourceInventory,
            ...(reactAnalysis && { reactAnalysis }),
            ...(angularAnalysis && { angularAnalysis }),
            styleAnalysis,
            statistics: stats,
            findings,
            unparsedRegions,
        };
    } catch (error) {
        throw new Error(
            `Analyzer failed at root: ${error instanceof Error ? error.message : 'unknown'}`,
            { cause: error }
        );
    }
}

/**
 * Determine entry files based on framework evidence
 */
function determineEntryFiles(
    inventory: SourceInventoryResult,
    framework: FrameworkEvidence
): string[] {
    const entryFiles: string[] = [];

    // Framework-specific entry points
    if (framework.bootstrapFiles.length > 0) {
        entryFiles.push(...framework.bootstrapFiles);
    }

    // Fallback: common entry file patterns
    for (const file of inventory.files) {
        if (
            file.path.includes('main.ts') ||
            file.path.includes('main.tsx') ||
            file.path.includes('index.ts') ||
            file.path.includes('index.tsx')
        ) {
            if (file.path.includes('src/')) {
                entryFiles.push(file.path);
            }
        }
    }

    return entryFiles;
}

function composeUiOccurrences(
    reactAnalysis: ReactAnalysis | undefined,
    angularAnalysis: AngularAnalysis | undefined
): UiOccurrence[] {
    const occurrences: UiOccurrence[] = [];

    for (const element of reactAnalysis?.uiElements ?? []) {
        occurrences.push({
            id: generateUiOccurrenceId(
                element.sourceFile,
                element.span.startLine,
                element.span.startColumn,
                element.sourceElement
            ),
            sourceFile: element.sourceFile,
            span: element.span,
            sourceElement: element.sourceElement,
            role: classifyUiRole(element.sourceElement, element.attributeValues),
            properties: element.properties,
            events: element.events,
            states: element.states,
            accessibilityRequirements: element.accessibilityRequirements,
            bindingReferences: element.bindingReferences,
        });
    }

    for (const component of angularAnalysis?.components ?? []) {
        for (const element of component.templateElements) {
            const propertyNames = [...element.attributes, ...element.inputs];
            occurrences.push({
                id: generateUiOccurrenceId(
                    element.sourceFile,
                    element.span.startLine,
                    element.span.startColumn,
                    element.name
                ),
                sourceFile: element.sourceFile,
                span: element.span,
                sourceElement: element.name,
                role: classifyUiRole(element.name, element.attributeValues),
                properties: [...new Set(propertyNames)],
                events: element.outputs,
                states: propertyNames.filter((name) =>
                    ['disabled', 'checked', 'selected', 'readonly', 'required', 'loading', 'value']
                        .includes(name.toLowerCase())
                ),
                accessibilityRequirements: propertyNames.filter((name) =>
                    name.startsWith('aria-') ||
                    ['role', 'tabindex', 'alt', 'label'].includes(name.toLowerCase())
                ),
                bindingReferences: [
                    ...element.inputs.map((name) => `[${name}]`),
                    ...element.outputs.map((name) => `(${name})`),
                ],
            });
        }
    }

    return occurrences.sort((left, right) => left.id.localeCompare(right.id));
}

function generateUiOccurrenceId(
    sourceFile: string,
    line: number,
    column: number,
    sourceElement: string
): string {
    const pathPart = sourceFile.replace(/[^a-zA-Z0-9._-]/g, '_');
    const elementPart = sourceElement.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${pathPart}:${line}:${column}:${elementPart}`;
}

function classifyUiRole(
    sourceElement: string,
    attributeValues: Readonly<Record<string, string>>
): UiSemanticRole {
    const element = sourceElement.toLowerCase();
    if (element === 'input') {
        const inputType = attributeValues['type']?.toLowerCase();
        if (inputType === 'checkbox') return 'checkbox';
        if (inputType === 'radio') return 'radio';
        return 'input';
    }
    const roles: Readonly<Record<string, UiSemanticRole>> = {
        button: 'button',
        textarea: 'textarea',
        select: 'select',
        a: 'link',
        table: 'table',
        dialog: 'modal',
        article: 'card',
        form: 'form',
        menu: 'menu',
    };
    return roles[element] ?? 'native-other';
}

function determineCoverage(
    framework: FrameworkEvidence,
    files: readonly SourceFile[],
    findings: readonly AnalyzerFinding[],
    uiOccurrences: readonly UiOccurrence[]
): InventoryCoverage {
    if (framework.framework === 'unknown' || framework.framework === 'mixed') {
        return 'unknown';
    }
    const hasFailedFiles = files.some(({ disposition }) => disposition === 'failed');
    const hasCoverageGap = findings.some(({ code, severity }) =>
        severity === 'error' ||
        code.includes('PARSE_ERROR') ||
        code.includes('DYNAMIC') ||
        code.includes('UNAVAILABLE') ||
        code.includes('ANALYSIS_ERROR') ||
        code === 'ANALYSIS_ZERO_UI_PARTIAL'
    );
    return hasFailedFiles || hasCoverageGap || uiOccurrences.length === 0
        ? 'partial'
        : 'complete';
}

/**
 * Compose normalized occurrences from all analyses
 */
function composeOccurrences(
    inventory: { readonly files: readonly SourceFile[] },
    framework: FrameworkEvidence,
    reactAnalysis: ReactAnalysis | undefined,
    angularAnalysis: AngularAnalysis | undefined,
    styleAnalysis: StyleAnalysis
): Omit<DetectedOccurrence, 'id'>[] {
    const occurrences: Omit<DetectedOccurrence, 'id'>[] = [];

    // React occurrences
    if (reactAnalysis) {
        // Components
        reactAnalysis.components.forEach((comp) => {
            occurrences.push({
                type: comp.isPage ? 'page' : 'component',
                name: comp.name,
                sourceFile: comp.sourceFile,
                startLine: comp.span.startLine,
                endLine: comp.span.endLine,
                startCol: comp.span.startColumn,
                endCol: comp.span.endColumn,
                evidence: [`React ${comp.isPage ? 'page' : 'component'} declaration`],
            });
        });

        // Routes
        reactAnalysis.routes.forEach((route) => {
            occurrences.push({
                type: 'route',
                name: route.path,
                sourceFile: route.sourceFile,
                startLine: route.span.startLine,
                endLine: route.span.endLine,
                startCol: route.span.startColumn,
                endCol: route.span.endColumn,
                evidence: [`React Router 6/7 route: ${route.path}`],
            });
        });

        // Services
        reactAnalysis.services.forEach((svc) => {
            occurrences.push({
                type: 'service',
                name: svc.name,
                sourceFile: svc.sourceFile,
                startLine: 0,
                evidence: [`Service with ${svc.apiCalls.length} API calls`],
            });
        });

        // Models
        reactAnalysis.models.forEach((model) => {
            occurrences.push({
                type: 'model',
                name: model.name,
                sourceFile: model.sourceFile,
                startLine: 0,
                evidence: [
                    `React ${model.isInterface ? 'interface' : 'type'} with ${Object.keys(model.properties).length} properties`,
                ],
            });
        });

        // Forms
        reactAnalysis.forms.forEach((form) => {
            occurrences.push({
                type: 'form',
                name: form.name,
                sourceFile: form.sourceFile,
                startLine: 0,
                evidence: [`Form with ${form.fields.length} fields`],
            });
        });

        // State
        reactAnalysis.state.forEach((st) => {
            occurrences.push({
                type: 'state',
                name: st.name,
                sourceFile: st.sourceFile,
                startLine: 0,
                evidence: [`React ${st.type === 'useState' ? 'state' : st.type}`],
            });
        });
    }

    // Angular occurrences
    if (angularAnalysis) {
        // Components
        angularAnalysis.components.forEach((comp) => {
            const isPage = angularAnalysis.routes.some(
                (route) =>
                    route.component?.includes(comp.name) === true ||
                    route.loadComponent?.includes(comp.name) === true
            );
            occurrences.push({
                type: isPage ? 'page' : 'component',
                name: comp.name,
                sourceFile: comp.sourceFile,
                startLine: 0,
                evidence: [
                    `Angular ${comp.decorator} (${comp.standalone ? 'standalone' : 'NgModule'})`,
                ],
            });
        });

        // Routes
        angularAnalysis.routes.forEach((route) => {
            occurrences.push({
                type: 'route',
                name: route.path,
                sourceFile: route.sourceFile,
                startLine: 0,
                evidence: [`Angular route: ${route.path}`],
            });
        });

        // Services
        angularAnalysis.services.forEach((svc) => {
            occurrences.push({
                type: 'service',
                name: svc.name,
                sourceFile: svc.sourceFile,
                startLine: 0,
                evidence: [
                    `@Injectable service (providedIn: ${svc.providedIn})`,
                ],
            });
        });

        // Models
        angularAnalysis.models.forEach((model) => {
            occurrences.push({
                type: 'model',
                name: model.name,
                sourceFile: model.sourceFile,
                startLine: 0,
                evidence: [
                    `Angular ${model.isInterface ? 'interface' : 'type'} with ${Object.keys(model.properties).length} properties`,
                ],
            });
        });

        // Forms
        angularAnalysis.forms.forEach((form) => {
            occurrences.push({
                type: 'form',
                name: form.name,
                sourceFile: form.sourceFile,
                startLine: 0,
                evidence: [
                    `Angular ${form.type} form with ${form.controls.length} controls`,
                ],
            });
        });

        // Signals
        angularAnalysis.signals.forEach((sig) => {
            occurrences.push({
                type: 'state',
                name: sig.name,
                sourceFile: sig.sourceFile,
                startLine: 0,
                evidence: [`Angular signal/observable (${sig.type})`],
            });
        });
    }

    // Styles
    styleAnalysis.cssModules.forEach((mod) => {
        occurrences.push({
            type: 'style',
            name: mod.name,
            sourceFile: mod.path,
            startLine: 0,
            evidence: [`CSS Module with ${Object.keys(mod.classes).length} classes`],
        });
    });

    styleAnalysis.globalStyles.forEach((style) => {
        occurrences.push({
            type: 'style',
            name: style.path.split('/').pop() ?? 'global',
            sourceFile: style.path,
            startLine: 0,
            evidence: [`Global stylesheet with ${style.selectors.length} selectors`],
        });
    });

    // Assets
    styleAnalysis.assets.forEach((asset) => {
        occurrences.push({
            type: 'asset',
            name: asset.url.split('/').pop() ?? asset.url,
            sourceFile: asset.sourceFile,
            startLine: asset.lineNumber,
            evidence: [`Asset reference: ${asset.url} (${asset.type})`],
        });
    });

    return occurrences;
}

/**
 * Generate deterministic occurrence ID
 */
function generateOccurrenceId(
    occ: Omit<DetectedOccurrence, 'id'>
): string {
    // Format is derived only from source identity and span, never traversal order.
    const sanitizedPath = occ.sourceFile.replace(/[\\/:]/g, '_');
    const sanitizedName = occ.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${sanitizedPath}:${occ.type}:${sanitizedName}:${occ.startLine}:${occ.startCol ?? 0}:${occ.endLine ?? 0}:${occ.endCol ?? 0}`;
}

/**
 * Collect regions that couldn't be fully parsed
 */
function collectUnparsedRegions(
    inventory: SourceInventoryResult,
    occurrences: DetectedOccurrence[]
): NormalizedProject['unparsedRegions'] {
    const unparsed: NormalizedProject['unparsedRegions'] = [];

    // Files with no detected occurrences may have unparsed content
    const occurrencePaths = new Set(occurrences.map((o) => o.sourceFile));

    for (const file of inventory.files) {
        if (
            file.roles.includes('script') &&
            !occurrencePaths.has(file.path)
        ) {
            unparsed.push({
                sourceFile: file.path,
                reason: 'No analyzable entities detected; may contain generic utilities or unrecognized patterns',
                region: { startLine: 0, endLine: -1 }, // -1 = entire file
            });
        }
    }

    return unparsed;
}

/**
 * Extract project name from root directory
 */
function extractProjectName(rootDir: string): string {
    const parts = rootDir.split(/[\\/]/);
    const lastPart = parts[parts.length - 1];
    return lastPart ?? 'unknown';
}
