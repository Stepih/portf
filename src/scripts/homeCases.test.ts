import { describe, expect, it } from "vitest";
import { caseResult, homeCases, industryTags } from "./homeCases";
import { homeCaseIds } from "@/data/homeCases";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { IPortfolioIndustry, IPortfolioWork } from "@/interfaces/portfolio";

const work = (id: string, industries: IPortfolioWork['industries'] = []) =>
    ({ id, kind: 'Лендинг', industries, description: `описание ${id}`, tags: ['Web'] }) as IPortfolioWork;

const industries = [
    { id: 'travel', label: 'Туризм' },
    { id: 'ecommerce', label: 'Интернет-магазины' }
] as IPortfolioIndustry[];

describe("caseResult", () => {
    it("убирает название перед двоеточием и ставит заглавную", () => {
        expect(caseResult('KEYSTONE: сайт, который продаёт')).toBe('Сайт, который продаёт');
    });

    it("без двоеточия возвращает текст как есть", () => {
        expect(caseResult('Сайт без названия')).toBe('Сайт без названия');
    });
});

describe("industryTags", () => {
    it("подписи отраслей в порядке работы", () => {
        expect(industryTags(work('a', ['ecommerce', 'travel']), industries)).toEqual(['Интернет-магазины', 'Туризм']);
    });

    it("без известной отрасли – тип работы", () => {
        expect(industryTags(work('a'), industries)).toEqual(['Лендинг']);
        expect(industryTags(work('a', ['medicine']), industries)).toEqual(['Лендинг']);
    });
});

describe("homeCases", () => {
    const works = [work('a', ['travel']), work('b'), work('c')];
    const cases = { a: { headline: 'A: первый' }, c: { headline: 'C: третий' } };

    it("берёт работы в порядке ids с результатом кейса и отраслями", () => {
        const items = homeCases(['c', 'a'], works, cases, industries);
        expect(items.map(({ id, description, tags }) => [id, description, tags])).toEqual([
            ['c', 'Третий', ['Лендинг']],
            ['a', 'Первый', ['Туризм']]
        ]);
    });

    it("пропускает работы без кейса и неизвестные id", () => {
        expect(homeCases(['b', 'x', 'a'], works, cases, industries).map(({ id }) => id)).toEqual(['a']);
    });

    it("все кейсы главной есть в портфолио", () => {
        expect(homeCases(homeCaseIds, portfolioWorks, portfolioCases, portfolioIndustries)).toHaveLength(homeCaseIds.length);
    });
});
