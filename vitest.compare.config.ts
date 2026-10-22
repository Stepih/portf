import path from "path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Сравнение моделей демо-чата (src/lib/chat/compare/run.compare.ts). Тратит деньги BotHub: только с разрешения владельца.
// Обычный `npm test` этот файл не видит: в нём другое расширение
export default defineConfig({
    resolve: {
        alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    test: {
        include: ["src/lib/chat/compare/run.compare.ts"],
        // Ключ BotHub из .env.local
        env: loadEnv("", process.cwd(), "BOTHUB_"),
    },
});
