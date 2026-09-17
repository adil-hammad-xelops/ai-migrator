import * as ts from 'typescript';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type {
    SourceFile,
    FrameworkEvidence,
} from './models.js';

/**
 * T024: React adapter
 * Parses React components, routes, hooks, forms, state, models and services.
 * Uses TypeScript compiler API to walk AST and identify React-specific patterns.
 */

export interface ReactFinding {
    type:
    | 'component'
    | 'route'
    | 'hook'
    | 'model'
    | 'service'
    | 'form'
    | 'state'
    | 'effect'
    | 'context';
    name: string;
    sourceFile: string;
    startLine: number;
    endLine: number;
    details: Record<string, unknown>;
    evidence: string[];
}

export interface ReactAnalysis {
    components: Array<{
        name: string;
        sourceFile: string;
        isPage: boolean;
        isLazy: boolean;
        jsxElements: string[];
        props: Record<string, string>;
        hooks: string[];
    }>;
    routes: Array<{
        path: string;
        component: string;
        params: string[];
        guards: string[];
        lazy: boolean;
    }>;
    forms: Array<{
        name: string;
        sourceFile: string;
        fields: string[];
        validation: Record<string, unknown>;
        handlers: string[];
    }>;
    state: Array<{
        type: 'useState' | 'useReducer' | 'useContext' | 'ref';
        name: string;
        sourceFile: string;
        usage: string[];
    }>;
    models: Array<{
        name: string;
        sourceFile: string;
        properties: Record<string, string>;
        isInterface: boolean;
    }>;
    services: Array<{
        name: string;
        sourceFile: string;
        methods: string[];
        apiCalls: Array<{ method: string; url: string }>;
    }>;
    findings: Array<{
        code: string;
        message: string;
        sourceFile: string;
        startLine: number;
    }>;
}

/**
 * Analyze React code in inventory
 */
export async function analyzeReact(
    inventory: { readonly files: readonly SourceFile[] },
    framework: FrameworkEvidence,
    rootDir: string
): Promise<ReactAnalysis> {
    if (framework.framework !== 'react') {
        return {
            components: [],
            routes: [],
            forms: [],
            state: [],
            models: [],
            services: [],
            findings: [
                {
                    code: 'NOT_REACT',
                    message: 'Project is not React framework',
                    sourceFile: '',
                    startLine: 0,
                },
            ],
        };
    }

    const components: ReactAnalysis['components'] = [];
    const routes: ReactAnalysis['routes'] = [];
    const forms: ReactAnalysis['forms'] = [];
    const state: ReactAnalysis['state'] = [];
    const models: ReactAnalysis['models'] = [];
    const services: ReactAnalysis['services'] = [];
    const findings: ReactAnalysis['findings'] = [];

    // Process TypeScript/JavaScript files
    for (const file of inventory.files) {
        if (!file.roles.includes('script')) continue;

        const fullPath = resolve(rootDir, file.path);

        try {
            const source = await readFile(fullPath, 'utf-8');
            const sourceFile = ts.createSourceFile(
                file.path,
                source,
                ts.ScriptTarget.Latest,
                true
            );

            // Walk AST for React patterns
            walkReactAST(sourceFile, file.path, {
                components,
                routes,
                forms,
                state,
                models,
                services,
                findings,
            });
        } catch (error) {
            findings.push({
                code: 'PARSE_ERROR',
                message: `Failed to parse ${file.path}: ${error instanceof Error ? error.message : 'unknown'}`,
                sourceFile: file.path,
                startLine: 0,
            });
        }
    }

    return {
        components,
        routes,
        forms,
        state,
        models,
        services,
        findings,
    };
}

interface ReactContext {
    components: ReactAnalysis['components'];
    routes: ReactAnalysis['routes'];
    forms: ReactAnalysis['forms'];
    state: ReactAnalysis['state'];
    models: ReactAnalysis['models'];
    services: ReactAnalysis['services'];
    findings: ReactAnalysis['findings'];
}

/**
 * Walk React AST and extract patterns
 */
function walkReactAST(
    sourceFile: ts.SourceFile,
    filePath: string,
    ctx: ReactContext
): void {
    const sourceText = sourceFile.text;

    function visit(node: ts.Node): void {
        // Detect component declarations (function components)
        if (
            ts.isFunctionDeclaration(node) ||
            ts.isVariableDeclaration(node) ||
            ts.isArrowFunction(node)
        ) {
            const name = getNodeName(node);
            if (name && isLikelyComponent(name, sourceText, node.getStart())) {
                const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

                ctx.components.push({
                    name,
                    sourceFile: filePath,
                    isPage: isPageComponent(name, filePath),
                    isLazy: isLazyComponent(name, filePath),
                    jsxElements: extractJSXElements(node),
                    props: extractPropsFromComponent(node),
                    hooks: extractHooksUsed(node),
                });
            }
        }

        // Detect interfaces/types (models)
        if (
            ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node)
        ) {
            const name = node.name.text;
            const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

            ctx.models.push({
                name,
                sourceFile: filePath,
                properties: extractProperties(node),
                isInterface: ts.isInterfaceDeclaration(node),
            });
        }

        // Detect useReducer/useState/useContext patterns
        if (ts.isCallExpression(node)) {
            const hookName = extractHookCall(node);
            if (hookName) {
                const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());

                if (hookName === 'useState') {
                    ctx.state.push({
                        type: 'useState',
                        name: `state_at_${start.line}`,
                        sourceFile: filePath,
                        usage: [],
                    });
                } else if (hookName === 'useReducer') {
                    ctx.state.push({
                        type: 'useReducer',
                        name: `reducer_at_${start.line}`,
                        sourceFile: filePath,
                        usage: [],
                    });
                } else if (hookName === 'useContext') {
                    ctx.state.push({
                        type: 'useContext',
                        name: `context_at_${start.line}`,
                        sourceFile: filePath,
                        usage: [],
                    });
                } else if (hookName === 'useRef') {
                    ctx.state.push({
                        type: 'ref',
                        name: `ref_at_${start.line}`,
                        sourceFile: filePath,
                        usage: [],
                    });
                }
            }
        }

        // Detect router configuration
        if (isRouterElement(node, sourceText)) {
            extractRoutes(node, filePath, ctx.routes);
        }

        // Detect forms
        if (isFormElement(node, sourceText)) {
            extractFormInfo(node, filePath, ctx.forms);
        }

        // Detect services (functions with API calls)
        if (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) {
            const name = getNodeName(node);
            if (name && isLikelyService(name, sourceText)) {
                const apiCalls = findAPICallsInNode(node);
                if (apiCalls.length > 0) {
                    ctx.services.push({
                        name,
                        sourceFile: filePath,
                        methods: [name],
                        apiCalls,
                    });
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
}

/**
 * Get declaration name
 */
function getNodeName(node: ts.Node): string | null {
    if (ts.isFunctionDeclaration(node)) return node.name?.text || null;
    if (ts.isVariableDeclaration(node)) return node.name.getText() || null;
    if (ts.isInterfaceDeclaration(node)) return node.name.text;
    if (ts.isTypeAliasDeclaration(node)) return node.name.text;
    return null;
}

/**
 * Check if name looks like a React component (PascalCase)
 */
function isLikelyComponent(name: string, _sourceText: string, _start: number): boolean {
    return /^[A-Z]/.test(name);
}

/**
 * Check if component is a page (common naming)
 */
function isPageComponent(name: string, filePath: string): boolean {
    return (
        name.endsWith('Page') ||
        name.endsWith('Screen') ||
        filePath.includes('/pages/') ||
        filePath.includes('\\pages\\')
    );
}

/**
 * Check if component is lazy-loaded
 */
function isLazyComponent(name: string, filePath: string): boolean {
    return (
        filePath.includes('lazy') ||
        filePath.includes('dynamic') ||
        name.startsWith('Lazy')
    );
}

/**
 * Extract JSX elements from component
 */
function extractJSXElements(node: ts.Node): string[] {
    const elements: string[] = [];

    function collectJSX(n: ts.Node): void {
        if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
            const tagName = n.tagName?.getText?.() || 'unknown';
            elements.push(tagName);
        }
        ts.forEachChild(n, collectJSX);
    }

    collectJSX(node);
    return [...new Set(elements)];
}

/**
 * Extract props/interface from component parameters
 */
function extractPropsFromComponent(node: ts.Node): Record<string, string> {
    const props: Record<string, string> = {};

    if (ts.isFunctionDeclaration(node) && node.parameters.length > 0) {
        const firstParam = node.parameters[0];
        if (firstParam.type) {
            const typeText = firstParam.type.getText();
            if (typeText.startsWith('{')) {
                // Parse simple prop destructuring
                const propMatches = typeText.match(/(\w+)\s*:/g);
                if (propMatches) {
                    propMatches.forEach((match) => {
                        const propName = match.replace(':', '').trim();
                        props[propName] = 'unknown';
                    });
                }
            }
        }
    }

    return props;
}

/**
 * Extract hooks used in component
 */
function extractHooksUsed(node: ts.Node): string[] {
    const hooks: string[] = [];

    function findHooks(n: ts.Node): void {
        if (ts.isCallExpression(n)) {
            const name = n.expression.getText?.();
            if (
                name &&
                (name.startsWith('use') || name.includes('useCallback') || name.includes('useMemo'))
            ) {
                hooks.push(name);
            }
        }
        ts.forEachChild(n, findHooks);
    }

    findHooks(node);
    return [...new Set(hooks)];
}

/**
 * Extract hook call name
 */
function extractHookCall(node: ts.CallExpression): string | null {
    const expression = node.expression.getText?.();
    if (!expression) return null;

    if (
        expression === 'useState' ||
        expression === 'useReducer' ||
        expression === 'useContext' ||
        expression === 'useRef'
    ) {
        return expression;
    }

    return null;
}

/**
 * Extract properties from interface/type
 */
function extractProperties(node: ts.Node): Record<string, string> {
    const properties: Record<string, string> = {};

    if (ts.isInterfaceDeclaration(node)) {
        node.members.forEach((member) => {
            if (ts.isPropertySignature(member) && member.name) {
                properties[member.name.getText()] = member.type?.getText?.() || 'unknown';
            }
        });
    }

    if (ts.isTypeAliasDeclaration(node) && node.type) {
        if (ts.isTypeLiteralNode(node.type)) {
            node.type.members.forEach((member) => {
                if (ts.isPropertySignature(member) && member.name) {
                    properties[member.name.getText()] = member.type?.getText?.() || 'unknown';
                }
            });
        }
    }

    return properties;
}

/**
 * Check if node is router element
 */
function isRouterElement(node: ts.Node, _sourceText: string): boolean {
    if (!ts.isVariableDeclaration(node)) return false;

    const initializer = node.initializer;
    if (!initializer) return false;

    const text = initializer.getText?.() || '';
    return (
        text.includes('BrowserRouter') ||
        text.includes('Routes') ||
        text.includes('createBrowserRouter') ||
        text.includes('createRoutesFromElements')
    );
}

/**
 * Extract routes from router configuration
 */
function extractRoutes(
    node: ts.Node,
    filePath: string,
    routes: ReactAnalysis['routes']
): void {
    function findRoutes(n: ts.Node): void {
        if (ts.isJsxElement(n)) {
            const tagName = n.tagName?.getText?.();
            if (tagName === 'Route' || tagName === 'Outlet') {
                // Extract path and component from JSX attributes
                const attributes = n.openingElement.attributes;
                let path = '';
                let component = '';
                const params: string[] = [];

                attributes.forEach((attr) => {
                    if (ts.isJsxAttribute(attr) && attr.name.text === 'path') {
                        path = attr.initializer?.getText?.() || '';
                        // Extract route params like :id from path
                        const paramMatches = path.match(/:(\w+)/g);
                        if (paramMatches) {
                            paramMatches.forEach((p) => params.push(p.substring(1)));
                        }
                    }
                    if (ts.isJsxAttribute(attr) && attr.name.text === 'element') {
                        component = attr.initializer?.getText?.() || '';
                    }
                });

                if (path) {
                    routes.push({
                        path,
                        component,
                        params,
                        guards: [],
                        lazy: component.includes('React.lazy'),
                    });
                }
            }
        }
        ts.forEachChild(n, findRoutes);
    }

    findRoutes(node);
}

/**
 * Check if node is form element
 */
function isFormElement(node: ts.Node, _sourceText: string): boolean {
    if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) return false;

    const tagName = node.tagName?.getText?.();
    return (
        tagName === 'form' ||
        tagName === 'Form' ||
        node.getText?.().includes('handleSubmit')
    );
}

/**
 * Extract form information
 */
function extractFormInfo(
    node: ts.Node,
    filePath: string,
    forms: ReactAnalysis['forms']
): void {
    const formText = node.getText?.() || '';

    // Extract form name from variable or component
    const nameMatch = formText.match(/(?:const|let|function)\s+(\w+)/);
    const formName = nameMatch ? nameMatch[1] : 'unknown_form';

    // Extract form fields
    const fields: string[] = [];
    const fieldMatches = formText.match(/name=['"](.*?)['"]|value\s*=\s*{[^}]*\.(\w+)}/g);
    if (fieldMatches) {
        fieldMatches.forEach((match) => {
            const fieldName = match
                .replace(/name=['"]/g, '')
                .replace(/['"]|value\s*=\s*{[^}]*\./g, '')
                .replace(/[{}]/g, '')
                .trim();
            if (fieldName) fields.push(fieldName);
        });
    }

    // Extract validation rules
    const validation: Record<string, unknown> = {};
    if (formText.includes('minLength')) validation['minLength'] = true;
    if (formText.includes('maxLength')) validation['maxLength'] = true;
    if (formText.includes('required')) validation['required'] = true;
    if (formText.includes('pattern')) validation['pattern'] = true;

    forms.push({
        name: formName,
        fields: [...new Set(fields)],
        validation,
        handlers: ['onSubmit'],
    });
}

/**
 * Check if function name looks like a service
 */
function isLikelyService(name: string, sourceText: string): boolean {
    // Service functions usually end with Service, have fetch, call, API in name
    return (
        name.includes('Service') ||
        name.includes('fetch') ||
        name.includes('call') ||
        name.includes('api') ||
        (name.endsWith('Async') && sourceText.includes('fetch'))
    );
}

/**
 * Find API calls in a node
 */
function findAPICallsInNode(
    node: ts.Node
): Array<{ method: string; url: string }> {
    const calls: Array<{ method: string; url: string }> = [];

    function findCalls(n: ts.Node): void {
        if (ts.isCallExpression(n)) {
            const expr = n.expression.getText?.() || '';
            if (expr.includes('fetch') || expr.includes('axios') || expr.includes('http')) {
                // Extract URL from first argument
                if (n.arguments.length > 0) {
                    const urlArg = n.arguments[0]?.getText?.() || '';
                    const methodMatch = n.getText?.().match(/(get|post|put|delete|patch)/i);
                    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

                    calls.push({
                        method,
                        url: urlArg.replace(/['"]/g, ''),
                    });
                }
            }
        }
        ts.forEachChild(n, findCalls);
    }

    findCalls(node);
    return calls;
}
