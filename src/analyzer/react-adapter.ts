import * as ts from 'typescript';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type {
    SourceFile,
    FrameworkEvidence,
    SourceSpan,
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
    components: {
        name: string;
        sourceFile: string;
        isPage: boolean;
        isLazy: boolean;
        jsxElements: string[];
        props: Record<string, string>;
        hooks: string[];
        span: SourceSpan;
    }[];
    routes: {
        path: string;
        component: string;
        sourceFile: string;
        params: string[];
        guards: string[];
        lazy: boolean;
        span: SourceSpan;
    }[];
    forms: {
        name: string;
        sourceFile: string;
        fields: string[];
        validation: Record<string, unknown>;
        handlers: string[];
    }[];
    state: {
        type: 'useState' | 'useReducer' | 'useContext' | 'ref';
        name: string;
        sourceFile: string;
        usage: string[];
    }[];
    models: {
        name: string;
        sourceFile: string;
        properties: Record<string, string>;
        isInterface: boolean;
    }[];
    services: {
        name: string;
        sourceFile: string;
        methods: string[];
        apiCalls: { method: string; url: string }[];
    }[];
    uiElements: ReactUiElement[];
    findings: {
        code: string;
        message: string;
        sourceFile: string;
        startLine: number;
    }[];
}

export interface ReactUiElement {
    sourceElement: string;
    sourceFile: string;
    properties: string[];
    events: string[];
    states: string[];
    accessibilityRequirements: string[];
    bindingReferences: string[];
    attributeValues: Readonly<Record<string, string>>;
    span: SourceSpan;
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
            uiElements: [],
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
    const uiElements: ReactAnalysis['uiElements'] = [];
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
            uiElements.push(...extractReactUiElements(sourceFile, file.path));
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
        uiElements,
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
            if (name && isLikelyComponent(name)) {
                ctx.components.push({
                    name,
                    sourceFile: filePath,
                    isPage: isPageComponent(name, filePath),
                    isLazy: isLazyComponent(name, filePath),
                    jsxElements: extractJSXElements(node),
                    props: extractPropsFromComponent(node),
                    hooks: extractHooksUsed(node),
                    span: toSourceSpan(sourceFile, node, filePath),
                });
            }
        }

        // Detect interfaces/types (models)
        if (
            ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node)
        ) {
            const name = node.name.text;
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

            const calledName = node.expression.getText();
            if (isReactHookName(calledName) && hasUncertainHookTiming(node)) {
                const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                ctx.findings.push({
                    code: 'REACT_UNCERTAIN_HOOK_TIMING',
                    message: `Hook ${calledName} is conditional or nested, so execution timing requires review`,
                    sourceFile: filePath,
                    startLine: start.line + 1,
                });
            }
        }

        // Detect forms
        if (isFormElement(node)) {
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

    extractRoutes(sourceFile, filePath, ctx.routes, ctx.findings);
    visit(sourceFile);
}

function toSourceSpan(
    sourceFile: ts.SourceFile,
    node: ts.Node,
    filePath: string
): SourceSpan {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    return {
        path: filePath,
        startLine: start.line + 1,
        startColumn: start.character + 1,
        endLine: end.line + 1,
        endColumn: end.character + 1,
    };
}

function isReactHookName(name: string): boolean {
    const unqualified = name.split('.').at(-1) ?? name;
    return /^use[A-Z0-9]/.test(unqualified);
}

function hasUncertainHookTiming(node: ts.CallExpression): boolean {
    let current = node.parent;
    while (!ts.isSourceFile(current)) {
        if (
            ts.isIfStatement(current) ||
            ts.isConditionalExpression(current) ||
            ts.isSwitchStatement(current) ||
            ts.isForStatement(current) ||
            ts.isForInStatement(current) ||
            ts.isForOfStatement(current) ||
            ts.isWhileStatement(current) ||
            ts.isDoStatement(current) ||
            ts.isTryStatement(current)
        ) {
            return true;
        }
        if (ts.isFunctionLike(current)) {
            if (
                ts.isFunctionDeclaration(current) &&
                current.name !== undefined &&
                isLikelyComponent(current.name.text)
            ) {
                return false;
            }
            if (
                (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) &&
                ts.isVariableDeclaration(current.parent)
            ) {
                return !isLikelyComponent(current.parent.name.getText());
            }
            return true;
        }
        current = current.parent;
    }
    return true;
}

/**
 * Get declaration name
 */
function getNodeName(node: ts.Node): string | null {
    if (ts.isFunctionDeclaration(node)) return node.name?.text ?? null;
    if (ts.isVariableDeclaration(node)) return node.name.getText() || null;
    if (ts.isInterfaceDeclaration(node)) return node.name.text;
    if (ts.isTypeAliasDeclaration(node)) return node.name.text;
    return null;
}

/**
 * Check if name looks like a React component (PascalCase)
 */
function isLikelyComponent(name: string): boolean {
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
            const tagName = getJsxTagName(n);
            elements.push(tagName);
        }
        ts.forEachChild(n, collectJSX);
    }

    collectJSX(node);
    return elements;
}

function getJsxTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
    return ts.isJsxElement(node)
        ? node.openingElement.tagName.getText()
        : node.tagName.getText();
}

function extractReactUiElements(
    sourceFile: ts.SourceFile,
    filePath: string
): ReactUiElement[] {
    const elements: ReactUiElement[] = [];

    function visit(node: ts.Node): void {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
            const opening = ts.isJsxElement(node) ? node.openingElement : node;
            const properties: string[] = [];
            const events: string[] = [];
            const states: string[] = [];
            const accessibilityRequirements: string[] = [];
            const bindingReferences: string[] = [];
            const attributeValues: Record<string, string> = {};

            for (const attribute of opening.attributes.properties) {
                if (ts.isJsxSpreadAttribute(attribute)) {
                    bindingReferences.push(attribute.expression.getText());
                    continue;
                }
                const name = attribute.name.getText();
                const initializer = attribute.initializer;
                const isEvent = /^on[A-Z]/.test(name);
                if (isEvent) events.push(name);
                else properties.push(name);
                if (
                    name.startsWith('aria-') ||
                    name === 'role' ||
                    name === 'tabIndex' ||
                    name === 'alt' ||
                    name === 'label'
                ) {
                    accessibilityRequirements.push(name);
                }
                if (
                    name === 'disabled' ||
                    name === 'checked' ||
                    name === 'selected' ||
                    name === 'readOnly' ||
                    name === 'required' ||
                    name === 'loading' ||
                    name === 'value'
                ) {
                    states.push(name);
                }
                if (initializer === undefined) {
                    attributeValues[name] = 'true';
                } else if (ts.isStringLiteral(initializer)) {
                    attributeValues[name] = initializer.text;
                } else if (
                    ts.isJsxExpression(initializer) &&
                    initializer.expression !== undefined
                ) {
                    const expression = initializer.expression.getText();
                    bindingReferences.push(expression);
                    if (ts.isStringLiteralLike(initializer.expression)) {
                        attributeValues[name] = initializer.expression.text;
                    }
                }
            }

            elements.push({
                sourceElement: opening.tagName.getText(),
                sourceFile: filePath,
                properties,
                events,
                states,
                accessibilityRequirements,
                bindingReferences,
                attributeValues,
                span: toSourceSpan(sourceFile, node, filePath),
            });
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return elements;
}

/**
 * Extract props/interface from component parameters
 */
function extractPropsFromComponent(node: ts.Node): Record<string, string> {
    const props: Record<string, string> = {};

    if (ts.isFunctionDeclaration(node) && node.parameters.length > 0) {
        const firstParam = node.parameters[0];
        if (firstParam?.type) {
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
            const name = n.expression.getText();
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
    const expression = node.expression.getText();

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
            if (ts.isPropertySignature(member)) {
                properties[member.name.getText()] = member.type?.getText() ?? 'unknown';
            }
        });
    }

    if (ts.isTypeAliasDeclaration(node)) {
        if (ts.isTypeLiteralNode(node.type)) {
            node.type.members.forEach((member) => {
                if (ts.isPropertySignature(member)) {
                    properties[member.name.getText()] = member.type?.getText() ?? 'unknown';
                }
            });
        }
    }

    return properties;
}

/**
 * Extract routes from router configuration
 */
function extractRoutes(
    node: ts.Node,
    filePath: string,
    routes: ReactAnalysis['routes'],
    findings: ReactAnalysis['findings']
): void {
    function findRoutes(n: ts.Node): void {
        if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
            const tagName = getJsxTagName(n);
            if (tagName === 'Route' || tagName === 'Outlet') {
                // Extract path and component from JSX attributes
                const attributes = ts.isJsxElement(n)
                    ? n.openingElement.attributes
                    : n.attributes;
                let path = '';
                let component = '';
                const params: string[] = [];
                let pathIsDynamic = false;

                for (const attr of attributes.properties) {
                    const attributeName = ts.isJsxAttribute(attr)
                        ? attr.name.getText()
                        : '';
                    if (ts.isJsxAttribute(attr) && attributeName === 'path') {
                        const staticPath = getStaticJsxAttributeValue(attr);
                        if (staticPath === undefined) {
                            pathIsDynamic = true;
                        } else {
                            path = staticPath;
                        }
                        // Extract route params like :id from path
                        const paramMatches = path.match(/:(\w+)/g);
                        if (paramMatches) {
                            paramMatches.forEach((p) => params.push(p.substring(1)));
                        }
                    }
                    if (ts.isJsxAttribute(attr) && attributeName === 'element') {
                        component = getRouteComponent(attr);
                    }
                }

                if (pathIsDynamic) {
                    const sourceFile = n.getSourceFile();
                    const start = sourceFile.getLineAndCharacterOfPosition(
                        n.getStart(sourceFile)
                    );
                    findings.push({
                        code: 'REACT_DYNAMIC_ROUTE',
                        message: 'Dynamic route path cannot be resolved statically',
                        sourceFile: filePath,
                        startLine: start.line + 1,
                    });
                    return;
                }

                if (path) {
                    routes.push({
                        path,
                        component,
                        sourceFile: filePath,
                        params,
                        guards: [],
                        lazy: component.includes('React.lazy'),
                        span: toSourceSpan(n.getSourceFile(), n, filePath),
                    });
                }
            }
        }
        ts.forEachChild(n, findRoutes);
    }

    findRoutes(node);
}

function getStaticJsxAttributeValue(attribute: ts.JsxAttribute): string | undefined {
    const initializer = attribute.initializer;
    if (initializer === undefined) return undefined;
    if (ts.isStringLiteral(initializer)) return initializer.text;
    if (
        ts.isJsxExpression(initializer) &&
        initializer.expression !== undefined &&
        ts.isStringLiteralLike(initializer.expression)
    ) {
        return initializer.expression.text;
    }
    return undefined;
}

function getRouteComponent(attribute: ts.JsxAttribute): string {
    const initializer = attribute.initializer;
    if (!initializer || !ts.isJsxExpression(initializer)) return '';
    const expression = initializer.expression;
    if (expression && ts.isJsxSelfClosingElement(expression)) {
        return expression.tagName.getText();
    }
    if (expression && ts.isJsxElement(expression)) {
        return expression.openingElement.tagName.getText();
    }
    return expression?.getText() ?? '';
}

/**
 * Check if node is form element
 */
function isFormElement(node: ts.Node): boolean {
    if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) return false;

    const tagName = getJsxTagName(node);
    return (
        tagName === 'form' ||
        tagName === 'Form' ||
        node.getText().includes('handleSubmit')
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
    const owner = findEnclosingFunction(node);
    const formText = owner?.getText() ?? node.getText();

    // Extract form name from variable or component
    const formName = owner?.name?.text ?? 'unknown_form';

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
        sourceFile: filePath,
        fields: [...new Set(fields)],
        validation,
        handlers: [
            ...(formText.includes('onSubmit') ? ['onSubmit'] : []),
            ...(formText.includes('onReset') ? ['onReset'] : []),
        ],
    });
}

function findEnclosingFunction(node: ts.Node): ts.FunctionDeclaration | undefined {
    let current = node.parent;
    while (!ts.isSourceFile(current)) {
        if (ts.isFunctionDeclaration(current)) return current;
        current = current.parent;
    }
    return undefined;
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
): { method: string; url: string }[] {
    const calls: { method: string; url: string }[] = [];

    function findCalls(n: ts.Node): void {
        if (ts.isCallExpression(n)) {
            const expr = n.expression.getText();
            if (expr.includes('fetch') || expr.includes('axios') || expr.includes('http')) {
                // Extract URL from first argument
                if (n.arguments.length > 0) {
                    const urlArg = n.arguments[0]?.getText() ?? '';
                    const methodMatch = /(get|post|put|delete|patch)/i.exec(n.getText());
                    const method = methodMatch?.[1]?.toUpperCase() ?? 'GET';

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
