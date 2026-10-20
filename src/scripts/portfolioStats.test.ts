import { describe, expect, it } from "vitest";
import { plural, portfolioStats, yearsRange } from "./portfolioStats";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { PortfolioIndustry } from "@/interfaces/portfolio";

const work = (year: number, industries: PortfolioIndustry[] = []) => ({ year, industries });

describe("portfolioStats", () => {
    it("считает работы, годы и отрасли с работами", () => {
        const stats = portfolioStats([work(2024, ['travel']), work(2023), work(2026, ['b2b', 'travel'])]);
        expect(stats.count).toBe(3);
        expect(stats.years).toEqual({ from: 2023, to: 2026 });
        // Порядок — как в списке отраслей, не как в работах
        expect(stats.industries.map((i) => i.id)).toEqual(['b2b', 'travel']);
    });

    it("без работ — ноль, без годов и отраслей", () => {
        expect(portfolioStats([])).toEqual({ count: 0, years: null, industries: [] });
    });

    it("по умолчанию берёт портфолио сайта", () => {
        const stats = portfolioStats();
        expect(stats.count).toBe(portfolioWorks.length);
        for (const industry of stats.industries) expect(portfolioIndustries).toContain(industry);
        for (const w of portfolioWorks) {
            expect(w.year).toBeGreaterThanOrEqual(stats.years!.from);
            expect(w.year).toBeLessThanOrEqual(stats.years!.to);
        }
    });

    it("yearsRange склеивает годы и не повторяет один год", () => {
        expect(yearsRange({ from: 2023, to: 2026 })).toBe('2023–2026');
        expect(yearsRange({ from: 2026, to: 2026 })).toBe('2026');
        expect(yearsRange(null)).toBe('');
    });

    it("plural выбирает форму по числу", () => {
        const forms: [string, string, string] = ['проект', 'проекта', 'проектов'];
        expect([1, 2, 5, 10, 11, 12, 14, 21, 22, 25, 101, 111].map((n) => plural(n, forms))).toEqual([
            'проект', 'проекта', 'проектов', 'проектов', 'проектов', 'проектов', 'проектов',
            'проект', 'проекта', 'проектов', 'проект', 'проектов'
        ]);
    });
});
