/**
 * Behavior transforms (T036): Translate React form state/API calls to Angular equivalents.
 * Preserves nullability, validation timing, error handling and property access semantics
 * without executing uploaded code. Transforms are conservative: unproven patterns become
 * manual-review findings to prevent silent behavior changes.
 */

import type { PreservationFinding } from "./models.js";

export interface BehaviorTransformInput {
    readonly sourceFile: string;
    readonly source: string;
    readonly formName: string;
}

export interface FormControlDefinition {
    readonly name: string;
    readonly initialValue: string;
    readonly type: "text" | "email" | "password" | "textarea" | "checkbox" | "radio" | "select" | "unknown";
    readonly validators: readonly string[];
    readonly required: boolean;
}

export interface BehaviorTransformOutput {
    readonly sourceFile: string;
    readonly formName: string;
    readonly formControls: readonly FormControlDefinition[];
    readonly apiCalls: readonly string[];
    readonly validators: readonly string[];
    readonly preservationNotes: readonly string[];
    readonly findings: readonly PreservationFinding[];
}

/**
 * Extract form structure, validation rules and API calls from React source.
 * Does not execute code; uses pattern matching to identify statically analyzable forms.
 */
export function transformBehavior(input: BehaviorTransformInput): BehaviorTransformOutput {
    const findings: PreservationFinding[] = [];
    const formControls: FormControlDefinition[] = [];
    const validators: string[] = [];
    const apiCalls: string[] = [];
    const preservationNotes: string[] = [];

    // Extract form state variables (useState with object/field patterns)
    const stateMatches = [...input.source.matchAll(/const\s+\[([a-zA-Z_$][\w$]*),\s*set([a-zA-Z_$][\w$]*)\]\s*=\s*useState<([^>]*)>\s*\(\s*({[^}]*}|""|''|0|false|null)\s*\)/g)];

    for (const match of stateMatches) {
        const stateName = match[1];
        const setState = match[2];
        const typeAnnotation = match[3];
        const initialValue = match[4];

        // Check if this looks like a form state object
        if ((typeAnnotation?.includes(input.formName) || stateName === "values" || stateName === "formData") && initialValue) {
            // Extract individual form fields from the type or initialization
            const fieldMatches = [...input.source.matchAll(/([a-zA-Z_$][\w$]*)\s*:\s*(?:string|number|boolean)/g)];

            for (const fieldMatch of fieldMatches) {
                const fieldName = fieldMatch[1];
                if (!fieldName) continue;

                formControls.push({
                    name: fieldName,
                    initialValue: extractInitialValue(initialValue, fieldName),
                    type: inferFieldType(input.source, fieldName),
                    validators: extractValidators(input.source, fieldName),
                    required: isFieldRequired(input.source, fieldName),
                });
            }
        }
    }

    // Extract validation functions
    const validateMatch = /function\s+validate\s*\([^)]*\)\s*:\s*Partial<[^>]*>\s*\{([\s\S]*?)\n\s*\}/g.exec(input.source);
    if (validateMatch?.[1]) {
        validators.push(validateMatch[1].trim());
    } else {
        // Pattern not found - mark as uncertain
        if (/validate\s*\(/.test(input.source)) {
            findings.push({
                sourceFiles: [input.sourceFile],
                behavior: "validation function structure",
                outcome: "manual-review",
                blocking: false,
                reason: "Form validation function does not match expected pattern; review manually.",
            });
        }
    }

    // Extract API calls (fetch, axios, HttpClient)
    const fetchMatches = [...input.source.matchAll(/fetch\s*\(\s*["']([^"']+)["']/g)];
    for (const match of fetchMatches) {
        apiCalls.push(`fetch(${match[1]!})`);
    }

    const axiosMatches = [...input.source.matchAll(/axios\.(get|post|put|delete)\s*\(\s*["']([^"']+)["']/g)];
    for (const match of axiosMatches) {
        apiCalls.push(`axios.${match[1]}(${match[2]!})`);
    }

    // Check for unsupported async patterns
    if (/async\s+function\s+/.test(input.source) && !apiCalls.length) {
        findings.push({
            sourceFiles: [input.sourceFile],
            behavior: "async/await without detected API calls",
            outcome: "manual-review",
            blocking: false,
            reason: "Async behavior detected but no statically detectable API calls; verify logic.",
        });
    }

    // Check for unsupported event handling patterns
    if (/\b(?:useEffect|useCallback|useReducer)\s*\(/.test(input.source)) {
        findings.push({
            sourceFiles: [input.sourceFile],
            behavior: "complex event/effect timing",
            outcome: "manual-review",
            blocking: true,
            reason: "useEffect/useCallback/useReducer timing guarantees cannot be precisely replicated in Angular.",
        });
    }

    // Check for credential/secret handling
    if (/(?:password|secret|token|api[_-]?key)\s*[:=]/i.test(input.source)) {
        findings.push({
            sourceFiles: [input.sourceFile],
            behavior: "potential credentials in source",
            outcome: "unsupported",
            blocking: true,
            reason: "Credentials detected in source code; use environment variables or secure configuration.",
        });
    }

    if (formControls.length === 0 && apiCalls.length === 0) {
        preservationNotes.push("No statically detectable forms or API calls found.");
    } else {
        if (formControls.length > 0) {
            preservationNotes.push(`Detected ${formControls.length} form controls.`);
        }
        if (apiCalls.length > 0) {
            preservationNotes.push(`Detected ${apiCalls.length} API calls to transform to HttpClient.`);
        }
    }

    return {
        sourceFile: input.sourceFile,
        formName: input.formName,
        formControls,
        apiCalls,
        validators,
        preservationNotes,
        findings: dedupeFindings(findings),
    };
}

function extractInitialValue(initialStr: string, fieldName: string): string {
    // Try to parse the initial object and extract the field value
    if (initialStr.startsWith("{")) {
        const fieldMatch = new RegExp(`${fieldName}\\s*:\\s*(""|''|0|false|true|null|\\d+|\\w+)`).exec(initialStr);
        if (fieldMatch?.[1]) {
            return fieldMatch[1];
        }
    }
    return '""';
}

function inferFieldType(source: string, fieldName: string): FormControlDefinition["type"] {
    const typeMatch = new RegExp(`(?:value=|state\\.)?${fieldName}['\"]?\\s*(?:=|:)`, "i").exec(source);

    if (/type\s*=\s*["']email["']/.test(source) && source.includes(fieldName)) return "email";
    if (/type\s*=\s*["']password["']/.test(source) && source.includes(fieldName)) return "password";
    if (/type\s*=\s*["']checkbox["']/.test(source) && source.includes(fieldName)) return "checkbox";
    if (/textarea/i.test(source) && source.includes(fieldName)) return "textarea";
    if (/select/i.test(source) && source.includes(fieldName)) return "select";

    return "text";
}

function extractValidators(source: string, fieldName: string): readonly string[] {
    const validators: string[] = [];

    // Look for required validation
    if (new RegExp(`${fieldName}\\.(?:trim\\(\\)\\.)?length\\s*===\\s*0`).test(source)) {
        validators.push("required");
    }

    // Look for min length validation
    const minMatch = new RegExp(`${fieldName}\\.(?:trim\\(\\)\\.)?length\\s*[<]\\s*(\\d+)`).exec(source);
    if (minMatch && minMatch[1]) {
        validators.push(`minLength(${minMatch[1]})`);
    }

    // Look for max length validation
    const maxMatch = new RegExp(`${fieldName}\\.(?:trim\\(\\)\\.)?length\\s*[>]\\s*(\\d+)`).exec(source);
    if (maxMatch && maxMatch[1]) {
        validators.push(`maxLength(${maxMatch[1]})`);
    }

    // Look for pattern validation (email, etc.)
    if (/email/i.test(source) && source.includes(fieldName)) {
        validators.push("email");
    }

    return validators;
}

function isFieldRequired(source: string, fieldName: string): boolean {
    // Check if field is validated as required
    return new RegExp(`${fieldName}\\.(?:trim\\(\\)\\.)?length\\s*===\\s*0`).test(source) ||
        new RegExp(`!${fieldName}(?:\\s|\\.|\\[|$)`).test(source);
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
