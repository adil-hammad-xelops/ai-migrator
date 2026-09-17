import { readFile } from 'fs/promises';
import { resolve, extname } from 'path';
import type {
    SourceFile,
    FrameworkEvidence,
} from './models.js';

/**
 * T026: Style analyzer
 * Parses CSS/SCSS files to detect CSS Modules, utilities, scoping, and asset references.
 * Uses trusted regex parsing, no execution of style plugins.
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
    contexts: Array<{ class: string; selector: string; lineNumber: number }>;
}

export interface StyleAnalysis {
    cssModules: CSSModule[];
    globalStyles: Array<{
        path: string;
        selectors: string[];
        scope: 'global' | 'nested';
    }>;
    assets: StyleAsset[];
    utilities: UtilityReference[];
    customProperties: Array<{
        name: string;
        value: string;
        usage: number;
    }>;
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
                // Detect CSS Module
                const isCSSModule = detectCSSModule(file.path);

                if (isCSSModule) {
                    const classes = parseClassDefinitions(source);
                    cssModules.push({
                        path: file.path,
                        name: extractModuleName(file.path),
                        classes,
                        isCSSModule: true,
                    });
                } else {
                    // Global styles
                    const selectors = parseSelectors(source);
                    globalStyles.push({
                        path: file.path,
                        selectors,
                        scope: detectScope(source),
                    });
                }

                // Extract assets (font-face, background images)
                const foundAssets = extractAssets(source, file.path);
                assets.push(...foundAssets);

                // Extract utility references (Tailwind, Bootstrap, etc.)
                const foundUtilities = extractUtilities(source, file.path);
                utilities.push(...foundUtilities);

                // Extract custom properties
                const props = extractCustomProperties(source);
                customProperties.push(...props);

                // Validate and report findings
                validateStyleFile(source, file.path, findings);
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
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.(module\.)?(css|scss)$/, '');
}

/**
 * Parse class definitions from CSS/SCSS
 */
function parseClassDefinitions(
    source: string
): Record<string, Record<string, string | string[]>> {
    const classes: Record<string, Record<string, string | string[]>> = {};

    // Match .className { ... }
    const classRegex = /\.([\w-]+)\s*\{([^}]*)\}/g;
    let match;

    while ((match = classRegex.exec(source)) !== null) {
        const className = match[1];
        const properties = parseProperties(match[2]);
        classes[className] = properties;
    }

    return classes;
}

/**
 * Parse CSS properties from rule
 */
function parseProperties(rule: string): Record<string, string | string[]> {
    const properties: Record<string, string | string[]> = {};

    // Match property: value;
    const propRegex = /([\w-]+)\s*:\s*([^;]*);/g;
    let match;

    while ((match = propRegex.exec(rule)) !== null) {
        const propName = match[1].trim();
        const propValue = match[2].trim();

        // Handle multiple values (e.g., animations, shadows)
        if (propName === 'animation' || propName === 'box-shadow') {
            properties[propName] = propValue.split(',').map((v) => v.trim());
        } else {
            properties[propName] = propValue;
        }
    }

    return properties;
}

/**
 * Parse selectors from CSS/SCSS
 */
function parseSelectors(source: string): string[] {
    const selectors: string[] = [];

    // Match any selector (class, id, element, pseudo, attribute)
    const selectorRegex = /([.\w\-#:\[\]"'=\s>+~,]+)\s*\{/g;
    let match;

    while ((match = selectorRegex.exec(source)) !== null) {
        const selector = match[1].trim();
        // Split multiple selectors by comma
        selector.split(',').forEach((s) => {
            const trimmed = s.trim();
            if (trimmed) selectors.push(trimmed);
        });
    }

    return [...new Set(selectors)];
}

/**
 * Detect scope (global vs nested/scoped)
 */
function detectScope(source: string): 'global' | 'nested' {
    // If contains :global or :local, it's explicitly scoped
    if (source.includes(':global') || source.includes(':local')) {
        return 'nested';
    }

    // Count nesting depth; if any @media/@supports, it has nesting
    if (source.includes('@media') || source.includes('@supports')) {
        return 'nested';
    }

    return 'global';
}

/**
 * Extract asset references (fonts, images)
 */
function extractAssets(
    source: string,
    sourceFile: string
): StyleAsset[] {
    const assets: StyleAsset[] = [];

    // Match url() references
    const urlRegex = /url\(['"]?([^'")\s]+)['"]?\)/gi;
    let match;
    let lineNumber = 1;

    while ((match = urlRegex.exec(source)) !== null) {
        const url = match[1];
        const type = getAssetType(url);

        // Count line numbers up to this match
        lineNumber = source.substring(0, match.index).split('\n').length;

        assets.push({
            url,
            type,
            resolved: !url.startsWith('http') && !url.includes('${'),
            sourceFile,
            lineNumber,
        });
    }

    // Match @font-face references
    const fontFaceRegex = /@font-face\s*\{([^}]*)\}/gi;
    while ((match = fontFaceRegex.exec(source)) !== null) {
        const fontRule = match[1];
        const fontUrlMatch = /src\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/i.exec(
            fontRule
        );
        if (fontUrlMatch) {
            lineNumber = source.substring(0, match.index).split('\n').length;

            assets.push({
                url: fontUrlMatch[1],
                type: 'font',
                resolved: true,
                sourceFile,
                lineNumber,
            });
        }
    }

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
    source: string,
    sourceFile: string
): UtilityReference[] {
    const utilities: UtilityReference[] = [];

    // Detect Tailwind imports
    if (source.includes('@tailwind')) {
        const tailwindClasses = extractTailwindClasses(source);
        if (tailwindClasses.length > 0) {
            utilities.push({
                framework: 'tailwind',
                classes: tailwindClasses,
                sourceFile,
                contexts: [],
            });
        }
    }

    // Detect Bootstrap imports
    if (
        source.includes('bootstrap/css') ||
        source.includes('bootstrap-icons')
    ) {
        utilities.push({
            framework: 'bootstrap',
            classes: [],
            sourceFile,
            contexts: [],
        });
    }

    // Detect Material Design
    if (source.includes('material-icons') || source.includes('@angular/material')) {
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
 * Extract Tailwind @layer directives
 */
function extractTailwindClasses(source: string): string[] {
    const classes: string[] = [];

    // Match @apply directives and their class names
    const applyRegex = /@apply\s+([\w\s-]+);/g;
    let match;

    while ((match = applyRegex.exec(source)) !== null) {
        const classNames = match[1].split(/\s+/);
        classes.push(...classNames);
    }

    return [...new Set(classes)];
}

/**
 * Extract CSS custom properties (variables)
 */
function extractCustomProperties(
    source: string
): StyleAnalysis['customProperties'] {
    const properties: StyleAnalysis['customProperties'] = [];
    const propMap = new Map<string, { value: string; usage: number }>();

    // Match --variable-name: value
    const varRegex = /--([a-zA-Z0-9\-_]+)\s*:\s*([^;]+);/g;
    let match;

    while ((match = varRegex.exec(source)) !== null) {
        const varName = `--${match[1]}`;
        const value = match[2].trim();

        if (!propMap.has(varName)) {
            propMap.set(varName, { value, usage: 0 });
        }
    }

    // Count usage of each variable
    for (const [varName, data] of propMap) {
        const usageRegex = new RegExp(`var\\(${varName}`, 'g');
        const usages = source.match(usageRegex);
        data.usage = usages ? usages.length : 0;
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
    source: string,
    sourceFile: string,
    findings: StyleFinding[]
): void {
    let lineNumber = 1;

    for (const line of source.split('\n')) {
        // Check for unresolved dynamic values
        if (line.includes('${') && !line.includes('//')) {
            findings.push({
                code: 'UNRESOLVED_DYNAMIC',
                message: 'Contains unresolved template/dynamic binding',
                sourceFile,
                lineNumber,
            });
        }

        // Check for inline expressions
        if (
            line.includes('expression(') ||
            line.includes('calc(')
        ) {
            findings.push({
                code: 'COMPLEX_VALUE',
                message: 'Uses complex CSS expressions',
                sourceFile,
                lineNumber,
            });
        }

        // Check for !important (generally a sign of poor cascade management)
        if (line.includes('!important') && !line.trim().startsWith('//')) {
            findings.push({
                code: 'IMPORTANT_FLAG',
                message: 'Uses !important which may indicate specificity issues',
                sourceFile,
                lineNumber,
            });
        }

        lineNumber++;
    }
}
