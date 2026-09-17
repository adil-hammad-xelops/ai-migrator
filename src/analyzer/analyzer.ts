import { resolve } from 'path';
import type {
    SourceFile,
    FrameworkEvidence,
    AnalyzerFinding,
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
    blockers?: Array<{ code: string; message: string }>;
}

export interface NormalizedProject {
    // Core metadata
    framework: 'react' | 'angular' | 'mixed' | 'unknown';
    frameworkVersion: string;
    applicationRoot: string;
    projectName: string;

    // Detected entities
    occurrences: DetectedOccurrence[];

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
    unparsedRegions: Array<{
        sourceFile: string;
        reason: string;
        region: { startLine: number; endLine: number };
    }>;
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
        const occurrences = composeOccurrences(
            sourceInventory,
            frameworkEvidence,
            reactAnalysis,
            angularAnalysis,
            styleAnalysis
        );

        // Assign deterministic IDs
        const occurrencesWithIds = occurrences.map((occ, index) => ({
            ...occ,
            id: generateOccurrenceId(occ, index),
        }));

        // Collect unparsed regions
        const unparsedRegions = collectUnparsedRegions(
            sourceInventory,
            occurrencesWithIds
        );

        // Calculate statistics
        const stats = {
            totalFiles: sourceInventory.files.length,
            analyzedFiles: sourceInventory.files.filter((f) =>
                f.disposition.includes('script')
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
            frameworkVersion: frameworkEvidence.version || 'unknown',
            applicationRoot: rootDir,
            projectName: extractProjectName(rootDir),
            occurrences: occurrencesWithIds,
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
            `Analyzer failed at root: ${error instanceof Error ? error.message : 'unknown'}`
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
    if (framework.bootstrapFiles && framework.bootstrapFiles.length > 0) {
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
                startLine: 0,
                evidence: [`React ${comp.isPage ? 'page' : 'component'} declaration`],
            });
        });

        // Routes
        reactAnalysis.routes.forEach((route) => {
            occurrences.push({
                type: 'route',
                name: route.path,
                sourceFile: '',
                startLine: 0,
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
            occurrences.push({
                type: 'component',
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
                sourceFile: '',
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
            name: style.path.split('/').pop() || 'global',
            sourceFile: style.path,
            startLine: 0,
            evidence: [`Global stylesheet with ${style.selectors.length} selectors`],
        });
    });

    // Assets
    styleAnalysis.assets.forEach((asset) => {
        occurrences.push({
            type: 'asset',
            name: asset.url.split('/').pop() || asset.url,
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
    occ: Omit<DetectedOccurrence, 'id'>,
    index: number
): string {
    // Format: path:type:name:line:index
    const sanitizedPath = occ.sourceFile.replace(/[\\/:]/g, '_');
    const sanitizedName = occ.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${sanitizedPath}:${occ.type}:${sanitizedName}:${occ.startLine}:${index}`;
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
            file.disposition.includes('script') &&
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
    const parts = rootDir.split(/[\\\/]/);
    const lastPart = parts[parts.length - 1];
    return lastPart || 'unknown';
}
