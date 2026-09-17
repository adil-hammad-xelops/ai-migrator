// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "coverage/**",
            "profiles/**/generated/**",
            "jobs/**",
            "eslint.config.mjs",
            "profiles/**/*.d.ts"
        ]
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        files: ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unsafe-argument": "error",
            "@typescript-eslint/no-unsafe-assignment": "error",
            "@typescript-eslint/no-unsafe-call": "error",
            "@typescript-eslint/no-unsafe-member-access": "error",
            "@typescript-eslint/no-unsafe-return": "error",
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
            "no-restricted-syntax": [
                "error",
                {
                    selector: "TSAsExpression > TSAsExpression",
                    message: "Double type assertions are forbidden; decode unknown data instead."
                }
            ],
            "no-warning-comments": [
                "error",
                { terms: ["eslint-disable"], location: "anywhere" }
            ]
        }
    }
);
