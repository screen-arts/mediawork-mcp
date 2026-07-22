import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        exclude: ["tests/**", "node_modules/**", ".next/**"],
        globals: false,
        watch: false,
    },
});
