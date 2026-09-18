import type { PreservationFinding } from "./models.js";

export interface ReactTransformInput {
    readonly sourceFile: string;
    readonly source: string;
    readonly componentName: string;
}

export interface ReactTransformOutput {
    readonly sourceFile: string;
    readonly componentName: string;
    readonly template: string;
    readonly classBody: string;
    readonly imports: readonly string[];
    readonly preservedState: readonly string[];
    readonly handlers: readonly string[];
    readonly findings: readonly PreservationFinding[];
}

/**
 * Translate the deliberately small, statically provable React subset. The transform
 * does not attempt to emulate React's runtime; unsupported semantics are surfaced as
 * blockers so the caller cannot claim a successful migration with an empty handler.
 */
export function transformReactComponent(input: ReactTransformInput): ReactTransformOutput {
    const findings: PreservationFinding[] = [];
    const imports = [...new Set([...input.source.matchAll(/import\s+[^;]+?\s+from\s+["']([^"']+)["'];?/g)].map((match) => match[1]).filter((value): value is string => value !== undefined))].sort();
    const unsupported: readonly [RegExp, string][] = [
        [/\buseEffect\s*\(/, "effect timing and cleanup"],
        [/\buseContext\s*\(/, "context provider scope"],
        [/\buseRef\s*\(/, "mutable ref identity"],
        [/\b(?:useStore|useSelector|useDispatch)\s*\(/, "external store semantics"],
        [/\b(?:forwardRef|createPortal)\s*\(/, "React runtime ownership"],
    ];
    for (const [pattern, behavior] of unsupported) {
        if (pattern.test(input.source)) findings.push(blocker(input.sourceFile, behavior));
    }

    const stateNames: string[] = [];
    const handlers: string[] = [];
    for (const match of input.source.matchAll(/const\s*\[([A-Za-z_$][\w$]*),\s*([A-Za-z_$][\w$]*)\]\s*=\s*useState(?:<[^>]+>)?\(([^)]*)\)/g)) {
        const state = match[1];
        const setter = match[2];
        const initial = match[3];
        if (state !== undefined && setter !== undefined && initial !== undefined) {
            stateNames.push(`readonly ${state} = signal(${initial.trim() || "undefined"});`);
            handlers.push(`readonly ${setter} = (value: typeof ${state} extends Signal<infer T> ? T : never): void => ${state}.set(value);`);
        }
    }
    for (const match of input.source.matchAll(/(?:const|function)\s+(on[A-Z][A-Za-z0-9_$]*)\s*(?:=\s*)?\(?([^)]*)\)?\s*(?:=>|\{)/g)) {
        const name = match[1];
        if (name !== undefined) handlers.push(`readonly ${name} = ${name};`);
    }
    if (/\bset[A-Z][A-Za-z0-9_$]*\s*\(/.exec(input.source) !== null && stateNames.length === 0) {
        findings.push(blocker(input.sourceFile, "state setter with unresolved declaration"));
    }
    const template = extractJsxTemplate(input.source);
    if (template === null) findings.push(blocker(input.sourceFile, "dynamic or unresolved JSX output"));
    return {
        sourceFile: input.sourceFile,
        componentName: input.componentName,
        template: template ?? "",
        classBody: [...stateNames, ...handlers].join("\n"),
        imports,
        preservedState: stateNames,
        handlers,
        findings: dedupeFindings(findings),
    };
}

function extractJsxTemplate(source: string): string | null {
    const returnMatch = /return\s*\(\s*([\s\S]*?)\s*\);?/.exec(source);
    if (returnMatch?.[1] === undefined) return null;
    const jsx = returnMatch[1].trim();
    if (jsx.includes("{...")) return null;
    return jsx.replace(/className=/g, "class=").replace(/onClick=/g, "(click)=");
}

function blocker(sourceFile: string, behavior: string): PreservationFinding {
    return { sourceFiles: [sourceFile], behavior, outcome: "manual-review", blocking: true, reason: `React ${behavior} cannot be proven equivalent by the supported transform subset.` };
}

function dedupeFindings(findings: readonly PreservationFinding[]): readonly PreservationFinding[] {
    const seen = new Set<string>();
    return findings.filter((finding) => {
        const key = `${finding.sourceFiles.join(",")}:${finding.behavior}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
