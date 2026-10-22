import { describe, expect, it } from "vitest";
import { findIndustry, industryCounts, nextAfter, portfolioHeading, portfolioTitle, withIndustry, worksFor } from "./portfolioIndustry";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";

describe("portfolioIndustry", () => {
    it("findIndustry находит отрасль по id и не принимает чужие значения", () => {
        expect(findIndustry('travel')?.label).toBe('Туризм');
        expect(findIndustry('cars')).toBeNull();
        expect(findIndustry(null)).toBeNull();
        expect(findIndustry(['travel', 'ecommerce'])).toBeNull();
    });

    it("findIndustry не открывает пустую подборку", () => {
        const empty = portfolioIndustries.filter((i) => !portfolioWorks.some((w) => w.industries.includes(i.id)));
        for (const industry of empty) expect(findIndustry(industry.id)).toBeNull();
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

    it("portfolioHeading и portfolioTitle называют отрасль в подборке", () => {
        const construction = findIndustry('construction');
        expect(portfolioHeading(null)).toBe('Портфолио');
        expect(portfolioTitle(null)).toBe('Портфолио: сайты для бизнеса – Степан Картузов');
        expect(portfolioHeading(construction)).toBe('Сайты для строительных и ремонтных компаний');
        expect(portfolioTitle(construction)).toBe('Сайты для строительных и ремонтных компаний – портфолио');
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

    it("отрасли работ есть в списке отраслей", () => {
        const ids = portfolioIndustries.map((i) => i.id);
        for (const work of portfolioWorks) {
            for (const industry of work.industries) expect(ids).toContain(industry);
        }
    });
    it("industryCounts считает работы и пропускает отрасли без работ", () => {
        const works = [
            { id: 'a', industries: ['medicine' as const, 'b2b' as const] },
            { id: 'b', industries: ['medicine' as const] }
        ];
        const industries = portfolioIndustries.filter((i) => ['b2b', 'medicine', 'travel'].includes(i.id));
        expect(industryCounts(works, industries).map(({ industry, count }) => [industry.id, count]))
            .toEqual([['medicine', 2], ['b2b', 1]]);
    });
});
