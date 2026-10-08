import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    test: {
        // tests/ — сценарии Playwright, их запускает `npx playwright test`
        exclude: ["**/node_modules/**", "tests/**"],
    },
});
