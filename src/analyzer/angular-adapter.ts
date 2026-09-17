import * as ts from 'typescript';
import { readFile } from 'fs/promises';
import { dirname, relative, resolve, sep } from 'path';
import {
    parseTemplate,
    TmplAstElement,
    TmplAstRecursiveVisitor,
} from '@angular/compiler';
import type {
    SourceFile,
    FrameworkEvidence,
    SourceSpan,
} from './models.js';

/**
 * T025: Angular adapter
 * Parses Angular components, services, routes, standalone declarations, forms, signals and models.
 * Uses TypeScript compiler API and decorator analysis.
 */

export interface AngularFinding {
    type:
    | 'component'
    | 'directive'
    | 'pipe'
    | 'service'
    | 'guard'
    | 'model'
    | 'route'
    | 'form'
    | 'signal'
    | 'injectable';
    name: string;
    sourceFile: string;
    decorator: string;
    standalone: boolean;
    details: Record<string, unknown>;
}

export interface AngularAnalysis {
    components: {
        name: string;
        sourceFile: string;
        decorator: string;
        standalone: boolean;
        selector: string;
        templateUrl?: string;
        template?: string;
        styleUrls: string[];
        inputs: string[];
        outputs: string[];
        providers: string[];
        imports: string[];
        lifecycle: string[];
        templateElements: AngularTemplateElement[];
        templateKind: 'inline' | 'external' | 'none' | 'dynamic';
    }[];
    services: {
        name: string;
        sourceFile: string;
        providedIn: string;
        methods: string[];
        observables: string[];
        signals: string[];
        injections: Record<string, string>;
    }[];
    routes: {
        path: string;
        sourceFile: string;
        component?: string;
        children?: string[];
        loadComponent?: string;
        guard?: string;
    }[];
    forms: {
        name: string;
        sourceFile: string;
        type: 'template-driven' | 'reactive';
        controls: string[];
        validators: string[];
    }[];
    models: {
        name: string;
        sourceFile: string;
        properties: Record<string, string>;
        isInterface: boolean;
    }[];
    signals: {
        name: string;
        sourceFile: string;
        type: 'signal' | 'computed' | 'effect' | 'observable';
        usage: string[];
    }[];
    findings: {
        code: string;
        message: string;
        sourceFile: string;
        startLine: number;
    }[];
}

export interface AngularTemplateElement {
    name: string;
    sourceFile: string;
    attributes: string[];
    attributeValues: Readonly<Record<string, string>>;
    inputs: string[];
    outputs: string[];
    span: SourceSpan;
}

/**
 * Analyze Angular code in inventory
 */
export async function analyzeAngular(
    inventory: { readonly files: readonly SourceFile[] },
    framework: FrameworkEvidence,
    rootDir: string
): Promise<AngularAnalysis> {
    if (framework.framework !== 'angular') {
        return {
            components: [],
            services: [],
            routes: [],
            forms: [],
            models: [],
            signals: [],
            findings: [
                {
                    code: 'NOT_ANGULAR',
                    message: 'Project is not Angular framework',
                    sourceFile: '',
                    startLine: 0,
                },
            ],
        };
    }

    const components: AngularAnalysis['components'] = [];
    const services: AngularAnalysis['services'] = [];
    const routes: AngularAnalysis['routes'] = [];
    const forms: AngularAnalysis['forms'] = [];
    const models: AngularAnalysis['models'] = [];
    const signals: AngularAnalysis['signals'] = [];
    const findings: AngularAnalysis['findings'] = [];

    // Process TypeScript files
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

            walkAngularAST(sourceFile, file.path, {
                components,
                services,
                routes,
                forms,
                models,
                signals,
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

    await analyzeComponentTemplates(components, inventory.files, rootDir, findings);

    return {
        components,
        services,
        routes,
        forms,
        models,
        signals,
        findings,
    };
}

interface AngularContext {
    components: AngularAnalysis['components'];
    services: AngularAnalysis['services'];
    routes: AngularAnalysis['routes'];
    forms: AngularAnalysis['forms'];
    models: AngularAnalysis['models'];
    signals: AngularAnalysis['signals'];
    findings: AngularAnalysis['findings'];
}

/**
 * Walk Angular AST and extract patterns
 */
function walkAngularAST(
    sourceFile: ts.SourceFile,
    filePath: string,
    ctx: AngularContext
): void {
    function visit(node: ts.Node): void {
        // Detect @Component, @Directive, @Pipe decorators
        if (ts.isClassDeclaration(node)) {
            const decorators = ts.getDecorators(node);

            if (decorators && decorators.length > 0) {
                for (const decorator of decorators) {
                    const decoratorText = decorator.getText();

                    if (decoratorText.includes('Component')) {
                        analyzeComponent(
                            node,
                            filePath,
                            decorators,
                            ctx.components,
                            ctx.forms,
                            ctx.findings
                        );
                    } else if (decoratorText.includes('Directive')) {
                        analyzeDirective(node, filePath, decorators, ctx.components);
                    } else if (decoratorText.includes('Pipe')) {
                        analyzePipe(node, filePath, decorators, ctx.components);
                    } else if (decoratorText.includes('Injectable')) {
                        analyzeService(node, filePath, decorators, ctx.services);
                    }
                }
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

        // Detect route configuration
        if (
            ts.isVariableDeclaration(node) &&
            node.name.getText().includes('routes')
        ) {
            extractAngularRoutes(node, filePath, ctx.routes);
        }

        // Detect signals/observables usage
        if (ts.isCallExpression(node)) {
            const callText = node.expression.getText();
            if (
                callText.includes('signal') ||
                callText.includes('computed') ||
                callText.includes('effect') ||
                callText.includes('Observable')
            ) {
                detectSignalUsage(node, filePath, ctx.signals);
            }

            // Detect reactive forms
            if (
                callText.includes('FormBuilder') ||
                callText.includes('FormGroup') ||
                callText.includes('FormControl')
            ) {
                detectFormUsage(node, filePath, ctx.forms);
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
}

/**
 * Analyze @Component decorator
 */
function analyzeComponent(
    node: ts.ClassDeclaration,
    filePath: string,
    decorators: readonly ts.Decorator[],
    components: AngularAnalysis['components'],
    forms: AngularAnalysis['forms'],
    findings: AngularAnalysis['findings']
): void {
    const name = node.name?.text ?? 'unknown';
    const componentDecorator = decorators.find((d) =>
        d.getText().includes('Component')
    );

    if (!componentDecorator) return;

    const decoratorText = componentDecorator.getText();
    const templateMetadata = extractTemplateMetadata(componentDecorator);
    const selector = extractMetadata(decoratorText, 'selector');
    const templateUrl = templateMetadata.kind === 'external' ? templateMetadata.value : '';
    const template = templateMetadata.kind === 'inline' ? templateMetadata.value : '';
    const styleUrls = extractMetadataArray(decoratorText, 'styleUrls');
    const standalone = decoratorText.includes('standalone: true');

    const inputs = extractInputsOutputs(node, 'Input');
    const outputs = extractInputsOutputs(node, 'Output');
    const lifecycle = extractLifecycleHooks(node);
    const providers = extractProviders(decoratorText);
    const imports = extractImports(decoratorText);

    components.push({
        name,
        sourceFile: filePath,
        decorator: '@Component',
        standalone,
        selector,
        templateUrl,
        template,
        styleUrls,
        inputs,
        outputs,
        providers,
        imports,
        lifecycle,
        templateElements: [],
        templateKind: templateMetadata.kind,
    });

    if (templateMetadata.kind === 'dynamic') {
        findings.push({
            code: 'ANGULAR_DYNAMIC_TEMPLATE',
            message: 'Runtime-generated Angular template cannot be analyzed statically',
            sourceFile: filePath,
            startLine: templateMetadata.startLine,
        });
    }

    analyzeReactiveFormProperties(node, filePath, forms);
}

function analyzeReactiveFormProperties(
    node: ts.ClassDeclaration,
    filePath: string,
    forms: AngularAnalysis['forms']
): void {
    for (const member of node.members) {
        if (!ts.isPropertyDeclaration(member) || member.initializer === undefined) continue;
        const initializer = member.initializer;
        if (!ts.isCallExpression(initializer) || !initializer.expression.getText().endsWith('.group')) {
            continue;
        }
        const config = initializer.arguments[0];
        if (!config || !ts.isObjectLiteralExpression(config)) continue;

        const controls = config.properties
            .filter(ts.isPropertyAssignment)
            .map((property) => property.name.getText().replace(/["']/g, ''));
        const initializerText = initializer.getText();
        const validators = [
            ...(initializerText.includes('Validators.required') ? ['required'] : []),
            ...(initializerText.includes('Validators.minLength') ? ['minLength'] : []),
            ...(initializerText.includes('Validators.maxLength') ? ['maxLength'] : []),
            ...(initializerText.includes('Validators.pattern') ? ['pattern'] : []),
            ...(initializerText.includes('Validators.email') ? ['email'] : []),
        ];

        forms.push({
            name: node.name?.text ?? member.name.getText(),
            sourceFile: filePath,
            type: 'reactive',
            controls,
            validators,
        });
    }
}

type TemplateMetadata =
    | { kind: 'inline' | 'external'; value: string; startLine: number }
    | { kind: 'dynamic'; startLine: number }
    | { kind: 'none'; startLine: number };

function extractTemplateMetadata(decorator: ts.Decorator): TemplateMetadata {
    if (!ts.isCallExpression(decorator.expression)) {
        return { kind: 'none', startLine: 1 };
    }
    const metadata = decorator.expression.arguments[0];
    if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
        return { kind: 'none', startLine: 1 };
    }

    for (const property of metadata.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = property.name.getText().replace(/["']/g, '');
        if (name !== 'template' && name !== 'templateUrl') continue;
        const sourceFile = property.getSourceFile();
        const start = sourceFile.getLineAndCharacterOfPosition(property.initializer.getStart());
        if (
            ts.isStringLiteral(property.initializer) ||
            ts.isNoSubstitutionTemplateLiteral(property.initializer)
        ) {
            return {
                kind: name === 'template' ? 'inline' : 'external',
                value: property.initializer.text,
                startLine: start.line + 1,
            };
        }
        return { kind: 'dynamic', startLine: start.line + 1 };
    }

    return { kind: 'none', startLine: 1 };
}

async function analyzeComponentTemplates(
    components: AngularAnalysis['components'],
    inventoryFiles: readonly SourceFile[],
    rootDir: string,
    findings: AngularAnalysis['findings']
): Promise<void> {
    const readablePaths = new Set(
        inventoryFiles
            .filter((file) => file.disposition === 'analyzed')
            .map((file) => file.path)
    );

    for (const component of components) {
        if (component.templateKind === 'none' || component.templateKind === 'dynamic') {
            continue;
        }

        let template = component.template ?? '';
        let templatePath = component.sourceFile;
        if (component.templateKind === 'external') {
            const absolutePath = resolve(
                rootDir,
                dirname(component.sourceFile),
                component.templateUrl ?? ''
            );
            templatePath = relative(rootDir, absolutePath).split(sep).join('/');
            if (!readablePaths.has(templatePath)) {
                findings.push({
                    code: 'ANGULAR_TEMPLATE_UNAVAILABLE',
                    message: `External template is not an analyzed inventory file: ${templatePath}`,
                    sourceFile: component.sourceFile,
                    startLine: 1,
                });
                continue;
            }
            try {
                template = await readFile(absolutePath, 'utf8');
            } catch (error) {
                findings.push({
                    code: 'ANGULAR_TEMPLATE_READ_ERROR',
                    message: `Failed to read ${templatePath}: ${error instanceof Error ? error.message : 'unknown'}`,
                    sourceFile: templatePath,
                    startLine: 1,
                });
                continue;
            }
        }

        const parsed = parseTemplate(template, templatePath, {
            preserveWhitespaces: true,
            collectCommentNodes: true,
        });
        if (parsed.errors !== null) {
            for (const error of parsed.errors) {
                findings.push({
                    code: 'ANGULAR_TEMPLATE_PARSE_ERROR',
                    message: error.msg,
                    sourceFile: templatePath,
                    startLine: error.span.start.line + 1,
                });
            }
        }
        const collector = new AngularTemplateCollector(templatePath);
        for (const node of parsed.nodes) node.visit(collector);
        component.templateElements.push(...collector.elements);
    }
}

class AngularTemplateCollector extends TmplAstRecursiveVisitor {
    readonly elements: AngularTemplateElement[] = [];

    constructor(private readonly sourceFile: string) {
        super();
    }

    override visitElement(element: TmplAstElement): void {
        this.elements.push({
            name: element.name,
            sourceFile: this.sourceFile,
            attributes: element.attributes.map(({ name }) => name),
            attributeValues: Object.fromEntries(
                element.attributes.map(({ name, value }) => [name, value])
            ),
            inputs: element.inputs.map(({ name }) => name),
            outputs: element.outputs.map(({ name }) => name),
            span: {
                path: this.sourceFile,
                startLine: element.sourceSpan.start.line + 1,
                startColumn: element.sourceSpan.start.col + 1,
                endLine: element.sourceSpan.end.line + 1,
                endColumn: element.sourceSpan.end.col + 1,
            },
        });
        super.visitElement(element);
    }
}

/**
 * Analyze @Directive decorator
 */
function analyzeDirective(
    node: ts.ClassDeclaration,
    filePath: string,
    decorators: readonly ts.Decorator[],
    components: AngularAnalysis['components']
): void {
    const name = node.name?.text ?? 'unknown';
    const directiveDecorator = decorators.find((d) =>
        d.getText().includes('Directive')
    );

    if (!directiveDecorator) return;

    const decoratorText = directiveDecorator.getText();
    const selector = extractMetadata(decoratorText, 'selector');
    const inputs = extractInputsOutputs(node, 'Input');
    const outputs = extractInputsOutputs(node, 'Output');

    components.push({
        name,
        sourceFile: filePath,
        decorator: '@Directive',
        standalone: decoratorText.includes('standalone: true'),
        selector,
        styleUrls: [],
        inputs,
        outputs,
        providers: [],
        imports: [],
        lifecycle: extractLifecycleHooks(node),
        templateElements: [],
        templateKind: 'none',
    });
}

/**
 * Analyze @Pipe decorator
 */
function analyzePipe(
    node: ts.ClassDeclaration,
    filePath: string,
    decorators: readonly ts.Decorator[],
    components: AngularAnalysis['components']
): void {
    const name = node.name?.text ?? 'unknown';
    const pipeDecorator = decorators.find((d) => d.getText().includes('Pipe'));

    if (!pipeDecorator) return;

    const decoratorText = pipeDecorator.getText();
    const pipeName = extractMetadata(decoratorText, 'name');

    components.push({
        name,
        sourceFile: filePath,
        decorator: '@Pipe',
        standalone: decoratorText.includes('standalone: true'),
        selector: pipeName,
        styleUrls: [],
        inputs: extractInputsOutputs(node, 'Input'),
        outputs: [],
        providers: [],
        imports: [],
        lifecycle: extractLifecycleHooks(node),
        templateElements: [],
        templateKind: 'none',
    });
}

/**
 * Analyze @Injectable service
 */
function analyzeService(
    node: ts.ClassDeclaration,
    filePath: string,
    decorators: readonly ts.Decorator[],
    services: AngularAnalysis['services']
): void {
    const name = node.name?.text ?? 'unknown';
    const serviceDecorator = decorators.find((d) =>
        d.getText().includes('Injectable')
    );

    if (!serviceDecorator) return;

    const decoratorText = serviceDecorator.getText();
    const providedIn = extractMetadata(decoratorText, 'providedIn');
    const methods = extractMethods(node);
    const observables = extractObservables(node);
    const signals = extractSignalsInService(node);
    const injections = extractConstructorInjections(node);

    services.push({
        name,
        sourceFile: filePath,
        providedIn: providedIn || 'root',
        methods,
        observables,
        signals,
        injections,
    });
}

/**
 * Extract metadata from decorator string
 */
function extractMetadata(decoratorText: string, key: string): string {
    const regex = new RegExp(`${key}\\s*:\\s*['"](.*?)['"]`);
    const match = decoratorText.match(regex);
    return match?.[1] ?? '';
}

/**
 * Extract array metadata from decorator
 */
function extractMetadataArray(decoratorText: string, key: string): string[] {
    const regex = new RegExp(`${key}\\s*:\\s*\\[(.*?)\\]`);
    const match = decoratorText.match(regex);
    const contents = match?.[1];
    if (contents === undefined) return [];

    return contents
        .split(',')
        .map((item) => item.trim().replace(/['"]/g, ''))
        .filter((item) => item);
}

/**
 * Extract @Input/@Output decorated properties
 */
function extractInputsOutputs(
    node: ts.ClassDeclaration,
    decoratorName: string
): string[] {
    const items: string[] = [];

    node.members.forEach((member) => {
        if (!ts.isPropertyDeclaration(member)) return;

        const decorators = ts.getDecorators(member);
        if (!decorators) return;

        for (const decorator of decorators) {
            if (decorator.getText().includes(decoratorName)) {
                items.push(member.name.getText());
            }
        }
    });

    return items;
}

/**
 * Extract lifecycle hooks implemented
 */
function extractLifecycleHooks(node: ts.ClassDeclaration): string[] {
    const hooks: string[] = [];
    node.members.forEach((member) => {
        if (ts.isMethodDeclaration(member)) {
            const methodName = member.name.getText();
            if (methodName === 'ngOnInit') hooks.push('OnInit');
            if (methodName === 'ngOnDestroy') hooks.push('OnDestroy');
            if (methodName === 'ngOnChanges') hooks.push('OnChanges');
            if (methodName === 'ngDoCheck') hooks.push('DoCheck');
            if (methodName === 'ngAfterContentInit') hooks.push('AfterContentInit');
            if (methodName === 'ngAfterViewInit') hooks.push('AfterViewInit');
        }
    });

    return hooks;
}

/**
 * Extract providers from component
 */
function extractProviders(decoratorText: string): string[] {
    const providers: string[] = [];
    const match = /providers\s*:\s*\[(.*?)\]/s.exec(decoratorText);
    const contents = match?.[1];
    if (contents !== undefined) {
        // Basic extraction; could be enhanced
        const providerItems = contents.split(',');
        providerItems.forEach((item) => {
            const cleaned = item.trim();
            if (cleaned) providers.push(cleaned);
        });
    }
    return providers;
}

/**
 * Extract imports from component
 */
function extractImports(decoratorText: string): string[] {
    const imports: string[] = [];
    const match = /imports\s*:\s*\[(.*?)\]/s.exec(decoratorText);
    const contents = match?.[1];
    if (contents !== undefined) {
        const importItems = contents.split(',');
        importItems.forEach((item) => {
            const cleaned = item.trim();
            if (cleaned && !cleaned.includes('[')) imports.push(cleaned);
        });
    }
    return imports;
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
 * Extract route configuration from Routes array
 */
function extractAngularRoutes(
    node: ts.VariableDeclaration,
    filePath: string,
    routes: AngularAnalysis['routes']
): void {
    const initializer = node.initializer;
    if (!initializer) return;

    if (ts.isArrayLiteralExpression(initializer)) {
        initializer.elements.forEach((element) => {
            if (ts.isObjectLiteralExpression(element)) {
                const pathProperty = element.properties.find(
                    (property): property is ts.PropertyAssignment =>
                        ts.isPropertyAssignment(property) &&
                        property.name.getText() === 'path'
                );
                if (pathProperty === undefined) return;
                const route: AngularAnalysis['routes'][0] = {
                    path: pathProperty.initializer.getText().replace(/['"]/g, ''),
                    sourceFile: filePath,
                };

                element.properties.forEach((prop) => {
                    if (ts.isPropertyAssignment(prop)) {
                        const propName = prop.name.getText();
                        const propValue = prop.initializer.getText();

                        if (propName === 'component') route.component = propValue;
                        if (propName === 'loadComponent') route.loadComponent = propValue;
                        if (propName === 'canActivate') route.guard = propValue;
                    }
                });

                routes.push(route);
            }
        });
    }
}

/**
 * Extract method names from service class
 */
function extractMethods(node: ts.ClassDeclaration): string[] {
    const methods: string[] = [];

    node.members.forEach((member) => {
        if (ts.isMethodDeclaration(member)) {
            const methodName = member.name.getText();
            if (methodName && !methodName.startsWith('ng')) {
                methods.push(methodName);
            }
        }
    });

    return methods;
}

/**
 * Extract Observable/Subject properties
 */
function extractObservables(node: ts.ClassDeclaration): string[] {
    const observables: string[] = [];

    node.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member)) {
            const typeText = member.type?.getText() ?? '';
            if (
                typeText.includes('Observable') ||
                typeText.includes('Subject') ||
                typeText.includes('ReplaySubject')
            ) {
                observables.push(member.name.getText());
            }
        }
    });

    return observables;
}

/**
 * Extract signal() usage in service
 */
function extractSignalsInService(node: ts.ClassDeclaration): string[] {
    const signals: string[] = [];

    node.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member)) {
            const initializer = member.initializer?.getText() ?? '';
            if (initializer.includes('signal(') || initializer.includes('computed(')) {
                signals.push(member.name.getText());
            }
        }
    });

    return signals;
}

/**
 * Extract constructor injections
 */
function extractConstructorInjections(
    node: ts.ClassDeclaration
): Record<string, string> {
    const injections: Record<string, string> = {};

    node.members.forEach((member) => {
        if (ts.isConstructorDeclaration(member)) {
            member.parameters.forEach((param) => {
                const paramName = param.name.getText();
                const paramType = param.type?.getText();
                if (paramName && paramType) {
                    injections[paramName] = paramType;
                }
            });
        }
    });

    return injections;
}

/**
 * Detect signal() and computed() usage
 */
function detectSignalUsage(
    node: ts.CallExpression,
    filePath: string,
    signals: AngularAnalysis['signals']
): void {
    const callText = node.expression.getText();

    if (callText.includes('signal')) {
        signals.push({
            name: `signal_at_${node.getStart()}`,
            sourceFile: filePath,
            type: 'signal',
            usage: [],
        });
    } else if (callText.includes('computed')) {
        signals.push({
            name: `computed_at_${node.getStart()}`,
            sourceFile: filePath,
            type: 'computed',
            usage: [],
        });
    } else if (callText.includes('effect')) {
        signals.push({
            name: `effect_at_${node.getStart()}`,
            sourceFile: filePath,
            type: 'effect',
            usage: [],
        });
    } else if (callText.includes('Observable')) {
        signals.push({
            name: `observable_at_${node.getStart()}`,
            sourceFile: filePath,
            type: 'observable',
            usage: [],
        });
    }
}

/**
 * Detect reactive forms usage
 */
function detectFormUsage(
    node: ts.CallExpression,
    filePath: string,
    forms: AngularAnalysis['forms']
): void {
    const callText = node.expression.getText();

    if (callText.includes('FormBuilder')) {
        forms.push({
            name: `form_at_${node.getStart()}`,
            sourceFile: filePath,
            type: 'reactive',
            controls: extractFormControls(node),
            validators: extractValidators(node),
        });
    }
}

/**
 * Extract form control names
 */
function extractFormControls(node: ts.CallExpression): string[] {
    const controls: string[] = [];
    const text = node.getText();

    // Simple extraction of control names from group/control calls
    const matches = text.match(/(\w+):\s*new\s+FormControl/g);
    if (matches) {
        matches.forEach((match) => {
            const controlName = match.split(':')[0];
            if (controlName !== undefined) {
                controls.push(controlName);
            }
        });
    }

    return controls;
}

/**
 * Extract validators used
 */
function extractValidators(node: ts.CallExpression): string[] {
    const validators: string[] = [];
    const text = node.getText();

    if (text.includes('Validators.required')) validators.push('required');
    if (text.includes('Validators.minLength')) validators.push('minLength');
    if (text.includes('Validators.maxLength')) validators.push('maxLength');
    if (text.includes('Validators.pattern')) validators.push('pattern');
    if (text.includes('Validators.email')) validators.push('email');

    return validators;
}
