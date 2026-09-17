import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: [
            "tests/unit/**/*.test.ts",
            "tests/contract/**/*.test.ts",
            "tests/integration/**/*.test.ts",
            "tests/generated-project/**/*.test.ts"
        ],
        reporters: ["default"],
        passWithNoTests: false,
        testTimeout: 30_000,
        hookTimeout: 30_000
    }
});
