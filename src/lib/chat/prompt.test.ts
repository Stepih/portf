import { describe, expect, it } from "vitest";
import { offerFaq, services } from "@/data/offer";
import { portfolioWorks } from "@/data/portfolio";
import { buildSystemPrompt, plainText } from "./prompt";

describe("buildSystemPrompt", () => {
    const prompt = buildSystemPrompt();

    it("цены и сроки всех услуг берутся из offer.ts", () => {
        for (const s of services) {
            expect(prompt).toContain(plainText(s.title));
            expect(prompt).toContain(plainText(s.price));
            expect(prompt).toContain(plainText(s.term));
            for (const e of s.examples ?? []) expect(prompt).toContain(plainText(e.text));
        }
    });

    it("все вопросы FAQ и все работы портфолио попадают в базу", () => {
        for (const f of offerFaq) expect(prompt).toContain(plainText(f.question));
        for (const w of portfolioWorks) expect(prompt).toContain(w.name);
    });

    it("ссылок и адресов в промпте нет: модели они запрещены", () => {
        expect(prompt).not.toMatch(/https?:\/\/|\/portfolio\/|t\.me/);
        expect(prompt).toMatch(/Legiscan[^\n]*подробный кейс/);
    });

    // Промпт кэшируется у провайдера: любой меняющийся кусок (дата, случайный id) обнулит кэш
    it("промпт одинаковый при каждой сборке", () => {
        expect(buildSystemPrompt()).toBe(prompt);
    });

    it("без невидимых символов вёрстки", () => {
        expect(prompt).not.toMatch(/[⁠ ]/);
    });

    // Цена запроса растёт с длиной промпта: предел из CONVERSION_PLAN К3.2 – около 5–8 тыс. токенов,
    // для русского текста это примерно до 20 тыс. символов
    it("промпт не разрастается", () => {
        expect(prompt.length).toBeLessThan(20000);
    });
});

describe("plainText", () => {
    it("убирает U+2060 и меняет неразрывный пробел на обычный", () => {
        expect(plainText("ИИ-⁠агент 1 000")).toBe("ИИ-агент 1 000");
    });
});
