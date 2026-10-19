import { describe, expect, it } from "vitest";
import { findIndustry, nextAfter, withIndustry, worksFor } from "./portfolioIndustry";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";

describe("portfolioIndustry", () => {
    it("findIndustry находит отрасль по id и не принимает чужие значения", () => {
        expect(findIndustry('medicine')?.label).toBe('Медицина');
        expect(findIndustry('cars')).toBeNull();
        expect(findIndustry(null)).toBeNull();
        expect(findIndustry(['medicine', 'b2b'])).toBeNull();
    });

    it("worksFor без отрасли возвращает всё, с отраслью — только подходящее", () => {
        const works = [
            { id: 'a', industries: ['medicine' as const] },
            { id: 'b', industries: ['b2b' as const, 'medicine' as const] },
            { id: 'c', industries: ['travel' as const] }
        ];
        expect(worksFor(works, null)).toBe(works);
        expect(worksFor(works, 'medicine').map((w) => w.id)).toEqual(['a', 'b']);
        expect(worksFor(works, 'beauty')).toEqual([]);
    });

    it("withIndustry добавляет параметр только при выбранной отрасли", () => {
        expect(withIndustry('/portfolio', null)).toBe('/portfolio');
        expect(withIndustry('/portfolio/icc', 'b2b')).toBe('/portfolio/icc?for=b2b');
    });

    it("nextAfter идёт по кругу и не возвращает сам элемент", () => {
        const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
        expect(nextAfter(list, 'a')?.id).toBe('b');
        expect(nextAfter(list, 'c')?.id).toBe('a');
        expect(nextAfter(list, 'x')).toBeNull();
        expect(nextAfter([{ id: 'a' }], 'a')).toBeNull();
    });

    it("у каждой работы есть отрасль, и все отрасли из списка", () => {
        const ids = portfolioIndustries.map((i) => i.id);
        for (const work of portfolioWorks) {
            expect(work.industries.length).toBeGreaterThan(0);
            for (const industry of work.industries) expect(ids).toContain(industry);
        }
    });
});
