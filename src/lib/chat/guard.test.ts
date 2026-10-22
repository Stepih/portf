import { describe, expect, it } from "vitest";
import { answerKey, budgetAlert, CHAT_GUARD, hitIpLimit, moscowDay, reserveBudget, toUnits } from "./guard";
import { createMemoryStore } from "./store";

const NOW = Date.UTC(2026, 9, 22, 12, 0);

describe("moscowDay", () => {
    it("сутки меняются в полночь по Москве, а не по UTC", () => {
        expect(moscowDay(Date.UTC(2026, 9, 22, 20, 59))).toBe("2026-10-22");
        expect(moscowDay(Date.UTC(2026, 9, 22, 21, 0))).toBe("2026-10-23");
    });
});

describe("hitIpLimit", () => {
    it("15 вопросов за 10 минут, 16-й – лимит; в следующем окне снова можно", async () => {
        const store = createMemoryStore(() => NOW);
        for (let i = 0; i < CHAT_GUARD.ipPerWindow; i++) expect(await hitIpLimit(store, "1.1.1.1", NOW)).toBe(false);
        expect(await hitIpLimit(store, "1.1.1.1", NOW)).toBe(true);
        expect(await hitIpLimit(store, "2.2.2.2", NOW)).toBe(false);
        expect(await hitIpLimit(store, "1.1.1.1", NOW + 10 * 60 * 1000)).toBe(false);
    });

    it("30 вопросов в сутки, даже если растянуть их по окнам", async () => {
        const store = createMemoryStore(() => NOW);
        const results = [];
        for (let i = 0; i < CHAT_GUARD.ipPerDay + 1; i++) {
            results.push(await hitIpLimit(store, "1.1.1.1", NOW + i * 10 * 60 * 1000 / 5));
        }
        expect(results.slice(0, CHAT_GUARD.ipPerDay).every((hit) => !hit)).toBe(true);
        expect(results[CHAT_GUARD.ipPerDay]).toBe(true);
    });
});

describe("reserveBudget", () => {
    it("резерв в пределах бюджета проходит, settle меняет его на фактическую цену", async () => {
        const store = createMemoryStore(() => NOW);
        const r = await reserveBudget(store, 700, NOW);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(await r.settle(475)).toBe(475);
    });

    it("резерв сверх бюджета не проходит и не остаётся в счётчике", async () => {
        const store = createMemoryStore(() => NOW);
        const budget = toUnits(CHAT_GUARD.dailyBudgetRub);
        expect((await reserveBudget(store, budget - 100, NOW)).ok).toBe(true);

        const r = await reserveBudget(store, 700, NOW);

        expect(r).toEqual({ ok: false, spentUnits: budget - 100 });
        expect(await store.get(`chat:budget:${moscowDay(NOW)}`)).toBe(String(budget - 100));
    });
});

describe("budgetAlert", () => {
    it("каждый порог – один раз в сутки", async () => {
        const store = createMemoryStore(() => NOW);
        const budget = toUnits(CHAT_GUARD.dailyBudgetRub);
        expect(await budgetAlert(store, budget * 0.5, NOW)).toBeNull();
        expect(await budgetAlert(store, budget * 0.8, NOW)).toBe(0.8);
        expect(await budgetAlert(store, budget * 0.9, NOW)).toBeNull();
        expect(await budgetAlert(store, budget, NOW)).toBe(1);
        expect(await budgetAlert(store, budget, NOW)).toBeNull();
    });
});

describe("answerKey", () => {
    it("регистр, ё, пробелы и знаки в конце не важны; другой промпт – другой ключ", () => {
        const key = answerKey("промпт", "Сколько стоит лендинг?");
        expect(answerKey("промпт", "  сколько   стоит лендинг ")).toBe(key);
        expect(answerKey("промпт", "Сколько стоит лендинг?!")).toBe(key);
        expect(answerKey("промпт", "Где Тёма?")).toBe(answerKey("промпт", "где тема"));
        expect(answerKey("другой промпт", "Сколько стоит лендинг?")).not.toBe(key);
        expect(answerKey("промпт", "Сколько стоит магазин?")).not.toBe(key);
    });
});
