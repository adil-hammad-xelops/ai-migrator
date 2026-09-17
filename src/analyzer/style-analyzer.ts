import { readFile } from 'fs/promises';
import { resolve, extname } from 'path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';
import scssParser from 'postcss-scss';
import type { Root, Rule } from 'postcss';
import type {
    SourceFile,
    FrameworkEvidence,
} from './models.js';

/**
 * T026: Style analyzer
 * Parses CSS/SCSS files to detect CSS Modules, utilities, scoping, and asset references.
 * Uses trusted PostCSS parsers without executing uploaded style plugins.
 */

export interface StyleFinding {
    code: string;
    message: string;
    sourceFile: string;
    lineNumber: number;
}

export interface CSSModule {
    path: string;
    name: string;
    classes: Record<string, Record<string, string | string[]>>;
    isCSSModule: boolean;
}

export interface StyleAsset {
    url: string;
    type: 'image' | 'font' | 'unknown';
    resolved: boolean;
    sourceFile: string;
    lineNumber: number;
}

export interface UtilityReference {
    framework: 'tailwind' | 'bootstrap' | 'material' | 'unknown';
    classes: string[];
    sourceFile: string;
    contexts: { class: string; selector: string; lineNumber: number }[];
}

export interface StyleAnalysis {
    cssModules: CSSModule[];
    globalStyles: {
        path: string;
        selectors: string[];
        scope: 'global' | 'nested';
    }[];
    assets: StyleAsset[];
    utilities: UtilityReference[];
    customProperties: {
        name: string;
        value: string;
        usage: number;
    }[];
    findings: StyleFinding[];
}

/**
 * Analyze styles in project
 */
export async function analyzeStyles(
    inventory: { readonly files: readonly SourceFile[] },
    _framework: FrameworkEvidence,
    rootDir: string
): Promise<StyleAnalysis> {
    const cssModules: CSSModule[] = [];
    const globalStyles: StyleAnalysis['globalStyles'] = [];
    const assets: StyleAsset[] = [];
    const utilities: UtilityReference[] = [];
    const customProperties: StyleAnalysis['customProperties'] = [];
    const findings: StyleFinding[] = [];

    // Process style files
    for (const file of inventory.files) {
        if (!file.roles.includes('style')) continue;

        const fullPath = resolve(rootDir, file.path);

        try {
            const source = await readFile(fullPath, 'utf-8');
            const ext = extname(file.path).toLowerCase();

            if (ext === '.css' || ext === '.scss') {
                const root = postcss.parse(source, {
                    from: file.path,
                    ...(ext === '.scss' ? { parser: scssParser } : {}),
                });
                // Detect CSS Module
                const isCSSModule = detectCSSModule(file.path);

                if (isCSSModule) {
                    const classes = parseClassDefinitions(root);
                    cssModules.push({
                        path: file.path,
                        name: extractModuleName(file.path),
                        classes,
                        isCSSModule: true,
                    });
                } else {
                    // Global styles
                    const selectors = parseSelectors(root);
                    globalStyles.push({
                        path: file.path,
                        selectors,
                        scope: detectScope(root),
                    });
                }

                // Extract assets (font-face, background images)
                const foundAssets = extractAssets(root, file.path);
                assets.push(...foundAssets);
                for (const asset of foundAssets) {
                    if (!asset.resolved) {
                        findings.push({
                            code: 'UNRESOLVED_ASSET',
                            message: `Asset URL requires manual resolution: ${asset.url}`,
                            sourceFile: asset.sourceFile,
                            lineNumber: asset.lineNumber,
                        });
                    }
                }

                // Extract utility references (Tailwind, Bootstrap, etc.)
                const foundUtilities = extractUtilities(root, file.path);
                utilities.push(...foundUtilities);

                // Extract custom properties
                const props = extractCustomProperties(root);
                customProperties.push(...props);

                // Validate and report findings
                validateStyleFile(root, file.path, findings);
            }
        } catch (error) {
            findings.push({
                code: 'PARSE_ERROR',
                message: `Failed to parse ${file.path}: ${error instanceof Error ? error.message : 'unknown'}`,
                sourceFile: file.path,
                lineNumber: 0,
            });
        }
    }

    return {
        cssModules,
        globalStyles,
        assets,
        utilities,
        customProperties,
        findings,
    };
}

/**
 * Detect if file is a CSS Module (naming convention)
 */
function detectCSSModule(filePath: string): boolean {
    return (
        filePath.includes('.module.css') ||
        filePath.includes('.module.scss') ||
        filePath.endsWith('.modules.css') ||
        filePath.endsWith('.modules.scss')
    );
}

/**
 * Extract module name from path
 */
function extractModuleName(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    const fileName = parts.at(-1) ?? filePath;
    return fileName.replace(/\.(module\.)?(css|scss)$/, '');
}

/**
 * Parse class definitions from CSS/SCSS
 */
function parseClassDefinitions(
    root: Root
): Record<string, Record<string, string | string[]>> {
    const classes: Record<string, Record<string, string | string[]>> = {};

    root.walkRules((rule) => {
        const ast = selectorParser().astSync(rule.selector);
        ast.walkClasses((classNode) => {
            classes[classNode.value] = {
                ...(classes[classNode.value] ?? {}),
                ...parseProperties(rule),
            };
        });
    });

    return classes;
}

/**
 * Parse CSS properties from rule
 */
function parseProperties(rule: Rule): Record<string, string | string[]> {
    const properties: Record<string, string | string[]> = {};

    for (const node of rule.nodes) {
        if (node.type !== 'decl') continue;
        const propName = node.prop;
        const propValue = node.value;
        if (propName === 'animation' || propName === 'box-shadow') {
            properties[propName] = valueParser(propValue).nodes
                .reduce<string[]>((values, valueNode) => {
                    if (valueNode.type === 'div' && valueNode.value === ',') {
                        values.push('');
                    } else {
                        const index = values.length - 1;
                        values[index] = `${values[index] ?? ''}${valueParser.stringify(valueNode)}`;
                    }
                    return values;
                }, [''])
                .map((value) => value.trim());
        } else {
            properties[propName] = propValue;
        }
    }

    return properties;
}

/**
 * Parse selectors from CSS/SCSS
 */
function parseSelectors(root: Root): string[] {
    const selectors: string[] = [];

    root.walkRules((rule) => {
        const ast = selectorParser().astSync(rule.selector);
        for (const selector of ast.nodes) selectors.push(selector.toString().trim());
    });

    return [...new Set(selectors)];
}

/**
 * Detect scope (global vs nested/scoped)
 */
function detectScope(root: Root): 'global' | 'nested' {
    const rules: Rule[] = [];
    root.walkRules((rule) => {
        rules.push(rule);
    });
    const nested = rules.some((rule) =>
            rule.selector.includes(':global') ||
            rule.selector.includes(':local') ||
            rule.parent?.type === 'rule' ||
            (rule.parent?.type === 'atrule' &&
                (rule.parent.name === 'media' || rule.parent.name === 'supports'))
    );
    return nested ? 'nested' : 'global';
}

/**
 * Extract asset references (fonts, images)
 */
function extractAssets(
    root: Root,
    sourceFile: string
): StyleAsset[] {
    const assets: StyleAsset[] = [];

    root.walkDecls((declaration) => {
        const parsedValue = valueParser(declaration.value);
        parsedValue.walk((node) => {
            if (node.type !== 'function' || node.value.toLowerCase() !== 'url') return;
            const rawUrl = valueParser.stringify(node.nodes).trim();
            const url = rawUrl.replace(/^(['"])(.*)\1$/, '$2');
            const inFontFace = declaration.parent?.type === 'atrule' &&
                declaration.parent.name.toLowerCase() === 'font-face';
            assets.push({
                url,
                type: inFontFace ? 'font' : getAssetType(url),
                resolved: !url.startsWith('http') &&
                    !url.includes('${') &&
                    !url.startsWith('data:'),
                sourceFile,
                lineNumber: declaration.source?.start?.line ?? 1,
            });
        });
    });

    return assets;
}

/**
 * Determine asset type from URL
 */
function getAssetType(url: string): 'image' | 'font' | 'unknown' {
    const imageExts = /\.(png|jpg|jpeg|gif|svg|webp|avif)$/i;
    const fontExts = /\.(woff|woff2|ttf|eot|otf)$/i;

    if (imageExts.test(url)) return 'image';
    if (fontExts.test(url)) return 'font';
    return 'unknown';
}

/**
 * Detect utility framework references (Tailwind, Bootstrap, Material)
 */
function extractUtilities(
    root: Root,
    sourceFile: string
): UtilityReference[] {
    const utilities: UtilityReference[] = [];
    const atRules: { name: string; params: string }[] = [];
    root.walkAtRules(({ name, params }) => {
        atRules.push({
            name: name.toLowerCase(),
            params,
        });
    });
    const tailwindRules = atRules.filter(({ name }) =>
        name === 'tailwind' || name === 'apply'
    );
    const tailwindClasses = tailwindRules
        .filter(({ name }) => name === 'apply')
        .flatMap(({ params }) => params.split(/\s+/).filter(Boolean));
    const hasTailwind = tailwindRules.length > 0;
    const hasBootstrap = atRules.some(({ params }) => params.includes('bootstrap'));
    const hasMaterial = atRules.some(({ params }) => params.includes('material'));
    if (hasTailwind) {
        utilities.push({
            framework: 'tailwind',
            classes: [...new Set(tailwindClasses)],
            sourceFile,
            contexts: [],
        });
    }
    if (hasBootstrap) {
        utilities.push({
            framework: 'bootstrap',
            classes: [],
            sourceFile,
            contexts: [],
        });
    }
    if (hasMaterial) {
        utilities.push({
            framework: 'material',
            classes: [],
            sourceFile,
            contexts: [],
        });
    }

    return utilities;
}

/**
 * Extract CSS custom properties (variables)
 */
function extractCustomProperties(
    root: Root
): StyleAnalysis['customProperties'] {
    const properties: StyleAnalysis['customProperties'] = [];
    const propMap = new Map<string, { value: string; usage: number }>();

    root.walkDecls((declaration) => {
        if (declaration.prop.startsWith('--') && !propMap.has(declaration.prop)) {
            propMap.set(declaration.prop, { value: declaration.value, usage: 0 });
        }
    });
    root.walkDecls((declaration) => {
        valueParser(declaration.value).walk((node) => {
            if (node.type !== 'function' || node.value !== 'var') return;
            const referencedName = valueParser.stringify(node.nodes).split(',')[0]?.trim();
            if (referencedName === undefined) return;
            const property = propMap.get(referencedName);
            if (property !== undefined) property.usage += 1;
        });
    });

    for (const [varName, data] of propMap) {
        properties.push({
            name: varName,
            value: data.value,
            usage: data.usage,
        });
    }

    return properties;
}

/**
 * Validate style file for common issues
 */
function validateStyleFile(
    root: Root,
    sourceFile: string,
    findings: StyleFinding[]
): void {
    root.walkDecls((declaration) => {
        const lineNumber = declaration.source?.start?.line ?? 1;
        if (declaration.value.includes('${')) {
            findings.push({
                code: 'UNRESOLVED_DYNAMIC',
                message: 'Contains unresolved template/dynamic binding',
                sourceFile,
                lineNumber,
            });
        }

        // Check for inline expressions
        const functions = new Set<string>();
        valueParser(declaration.value).walk((node) => {
            if (node.type === 'function') functions.add(node.value.toLowerCase());
        });
        if (functions.has('expression') || functions.has('calc')) {
            findings.push({
                code: 'COMPLEX_VALUE',
                message: 'Uses complex CSS expressions',
                sourceFile,
                lineNumber,
            });
        }

        // Check for !important (generally a sign of poor cascade management)
        if (declaration.important) {
            findings.push({
                code: 'IMPORTANT_FLAG',
                message: 'Uses !important which may indicate specificity issues',
                sourceFile,
                lineNumber,
            });
        }

    });
}
