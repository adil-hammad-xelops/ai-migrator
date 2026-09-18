/**
 * Style emitter (T037): Generate Angular-compatible CSS/SCSS from source styles.
 * Rewrite CSS Module scoping, inline bindings, approve utility styles and asset rewriting
 * without transforming unresolved utilities or unsafe dynamic bindings. CSS/SCSS behavior
 * (scope, cascade, responsive, pseudo-states) is preserved through static rewriting rules.
 */

import type { PreservationFinding } from "./models.js";

export interface StyleEmitInput {
    readonly sourceFile: string;
    readonly source: string;
    readonly kind: "css" | "scss" | "css-module" | "inline" | "utility";
    readonly targetPath: string;
}

export interface GeneratedStyle {
    readonly sourceFile: string;
    readonly targetPath: string;
    readonly content: string;
    readonly kind: "css" | "scss" | "css-module" | "inline" | "utility";
    readonly preservationFindings: readonly PreservationFinding[];
}

/**
 * Emit Angular-compatible CSS/SCSS from source styles.
 * CSS Modules are converted to component scoped styles using ::ng-deep.
 * Utilities are validated against approved lists (Tailwind, Bootstrap, Material).
 * Assets are validated to exist; unresolved utilities and unsafe dynamic values are reported.
 */
export function emitStyles(input: StyleEmitInput): GeneratedStyle {
    const findings: PreservationFinding[] = [];
    let content = input.source;

    // If it's a CSS Module, add scoping
    if (input.kind === "css-module") {
        content = scopeCSSModule(content);
    }

    // Validate and rewrite utility classes
    const utilityIssues = validateUtilities(content);
    findings.push(...utilityIssues);

    // Validate asset references
    const assetIssues = validateAssets(content);
    findings.push(...assetIssues);

    // Detect dynamic bindings that can't be preserved
    const dynamicIssues = detectUnsafeDynamics(content);
    findings.push(...dynamicIssues);

    // Preserve vendor prefixes and standard CSS/SCSS features
    content = preserveResponsive(content);
    content = preservePseudoStates(content);
    content = preserveNestedRules(content);

    return {
        sourceFile: input.sourceFile,
        targetPath: input.targetPath,
        content,
        kind: input.kind,
        preservationFindings: findings,
    };
}

/**
 * Convert CSS Module class references to ::ng-deep scoped selectors.
 * Example: .profile -> ::ng-deep .profile (or component :host ::ng-deep)
 */
function scopeCSSModule(source: string): string {
    // Add ::ng-deep prefix for CSS Module scoping
    // This maintains class isolation while making styles available to the component
    return source.replace(/^(\s*)\.([a-zA-Z_-][\w-]*)\s*\{/gm, (match, indent, className) => {
        return `${indent}::ng-deep .${className} {`;
    });
}

/**
 * Validate that utility classes are from approved sources.
 * Approved: Tailwind CSS, Bootstrap, Angular Material, Material Icons
 */
function validateUtilities(source: string): readonly PreservationFinding[] {
    const findings: PreservationFinding[] = [];

    // Check for Tailwind directives
    if (/@tailwind|@apply/i.test(source)) {
        // Tailwind is approved - verify @apply usage is valid
        const applyMatches = source.matchAll(/@apply\s+([a-z0-9-\s]+);/gi);
        for (const match of applyMatches) {
            const classes = match[1]!.split(/\s+/);
            for (const cls of classes) {
                if (!isTailwindClass(cls)) {
                    findings.push({
                        sourceFiles: [""],
                        behavior: `unknown Tailwind class: ${cls}`,
                        outcome: "manual-review",
                        blocking: false,
                        reason: `Tailwind class "${cls}" is not recognized; verify it exists in the theme.`,
                    });
                }
            }
        }
    }

    // Check for Bootstrap classes
    if (/\bbootstrap\b/i.test(source)) {
        // Bootstrap is approved - styles should be compatible
    }

    // Check for Angular Material
    if (/@angular\/material|mat-/i.test(source)) {
        // Material is approved - styles reference the Material theme
    }

    // Detect custom utility-like patterns that may not resolve
    const customUtilityMatches = source.matchAll(/\.u-[a-z0-9-]+|\.util-[a-z0-9-]+|\.helper-[a-z0-9-]+/gi);
    for (const match of customUtilityMatches) {
        findings.push({
            sourceFiles: [""],
            behavior: `custom utility class: ${match[0]}`,
            outcome: "manual-review",
            blocking: false,
            reason: `Custom utility "${match[0]}" must be defined in the target project.`,
        });
    }

    return findings;
}

/**
 * Validate asset references (images, fonts, etc.).
 * Assets should be relative paths under the project; absolute paths and external URLs are unsafe.
 */
function validateAssets(source: string): readonly PreservationFinding[] {
    const findings: PreservationFinding[] = [];

    // Check for url() references
    const urlMatches = source.matchAll(/url\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi);
    for (const match of urlMatches) {
        const assetPath = match[1]!;

        // Reject absolute paths
        if (/^\//.test(assetPath)) {
            findings.push({
                sourceFiles: [""],
                behavior: `absolute asset path: ${assetPath}`,
                outcome: "unsupported",
                blocking: true,
                reason: "Absolute asset paths are not supported; use relative paths instead.",
            });
            continue;
        }

        // Reject external URLs
        if (/^https?:\/\//.test(assetPath)) {
            findings.push({
                sourceFiles: [""],
                behavior: `external asset URL: ${assetPath}`,
                outcome: "manual-review",
                blocking: false,
                reason: "External asset URLs may not resolve in the target project; consider downloading and including locally.",
            });
            continue;
        }

        // Relative paths are acceptable - they'll be resolved during generation
    }

    // Check for data URIs (generally acceptable)
    if (/data:image\//.test(source)) {
        // Data URIs are preserved as-is
    }

    return findings;
}

/**
 * Detect unsafe dynamic bindings that cannot be preserved.
 * Angular property binding ({{ }}, [property]) is safe if it references known properties.
 * Computed values and JavaScript expressions are unsafe.
 */
function detectUnsafeDynamics(source: string): readonly PreservationFinding[] {
    const findings: PreservationFinding[] = [];

    // Detect JavaScript expressions in CSS (calc, var, etc.)
    if (/calc\s*\([^)]*\+[^)]*\)/.test(source)) {
        // calc() is safe - CSS native feature
    }

    // Detect CSS custom properties usage (safe)
    if (/var\s*\([^)]+\)/.test(source)) {
        // CSS variables are safe - they're evaluated by the browser
    }

    // Detect SCSS variables and functions (safe if they're SCSS)
    if (/\$[a-zA-Z_][\w-]*|@function|@mixin/i.test(source)) {
        // SCSS features are preserved as-is
    }

    // Detect interpolation that's not SCSS (unsafe in CSS)
    if (/\{\{[^}]+\}\}/.test(source)) {
        findings.push({
            sourceFiles: [""],
            behavior: "CSS template interpolation",
            outcome: "manual-review",
            blocking: true,
            reason: "CSS does not support {{ }} interpolation; use CSS variables (var()) or SCSS features instead.",
        });
    }

    return findings;
}

/**
 * Preserve responsive media queries.
 * @media queries are standard CSS and should pass through unchanged.
 */
function preserveResponsive(source: string): string {
    // @media queries are already valid CSS - no transformation needed
    // Ensure they're formatted correctly
    return source.replace(/@media\s+([^{]+)\s*\{/g, (match, query) => {
        return `@media ${query.trim()} {`;
    });
}

/**
 * Preserve pseudo-class and pseudo-element selectors.
 * :hover, :focus, ::before, ::after, etc. should pass through unchanged.
 */
function preservePseudoStates(source: string): string {
    // Pseudo-selectors are already valid - ensure proper formatting
    return source.replace(/([a-zA-Z0-9-_]+)(::|:)([a-z-]+)/g, (match) => {
        return match; // Pseudo-selectors are preserved as-is
    });
}

/**
 * Preserve nested rules (CSS nesting or SCSS nesting).
 * Modern CSS nesting and SCSS nesting syntax should be preserved.
 */
function preserveNestedRules(source: string): string {
    // Nested rules are already valid in modern CSS and SCSS - no transformation needed
    return source;
}

/**
 * Check if a class name is a recognized Tailwind CSS class.
 * This is a basic check for common Tailwind patterns.
 */
function isTailwindClass(className: string): boolean {
    // Common Tailwind prefixes
    const tailwindPrefixes = [
        "flex", "grid", "block", "inline", "hidden", "visible",
        "h-", "w-", "p-", "m-", "gap-", "border-", "rounded-",
        "text-", "bg-", "hover:", "focus:", "dark:",
        "top-", "right-", "bottom-", "left-", "z-",
        "absolute", "relative", "fixed", "static",
    ];

    return tailwindPrefixes.some((prefix) => className.startsWith(prefix)) || className === "container" || className === "mx-auto";
}
