import { describe, expect, it } from "vitest";
import { offerTrustLine, services } from "./offer";
import { portfolioWorks } from "./portfolio";

describe("offer", () => {
    it("кейсы-примеры услуг есть в портфолио", () => {
        const ids = portfolioWorks.map((w) => w.id);
        for (const service of services) {
            for (const id of service.caseIds) expect(ids).toContain(id);
        }
    });

    it("id услуг не повторяются", () => {
        const ids = services.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("строка доверия собирается из чисел портфолио", () => {
        const line = offerTrustLine({
            count: 3,
            years: { from: 2024, to: 2026 },
            industries: [{ id: 'construction', label: '', audience: '' }, { id: 'travel', label: '', audience: '' }]
        });
        expect(line).toBe('3 проекта · 2024–2026 · стройка, туризм');
        expect(offerTrustLine({ count: 1, years: { from: 2026, to: 2026 }, industries: [] })).toBe('1 проект · 2026');
    });

    it("лишние отрасли сворачиваются в «и др.»", () => {
        const industries = (['construction', 'beauty', 'travel'] as const).map((id) => ({ id, label: '', audience: '' }));
        const stats = { count: 5, years: { from: 2023, to: 2026 }, industries };
        expect(offerTrustLine(stats, 2)).toBe('5 проектов · 2023–2026 · стройка, бьюти и др.');
        expect(offerTrustLine(stats, 3)).toBe('5 проектов · 2023–2026 · стройка, бьюти, туризм');
    });
});
