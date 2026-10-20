import { describe, expect, it } from "vitest";
import { caseResult, homeCases } from "./homeCases";
import { homeCaseIds } from "@/data/homeCases";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { IPortfolioWork } from "@/interfaces/portfolio";

const work = (id: string) => ({ id, description: `описание ${id}` }) as IPortfolioWork;

describe("caseResult", () => {
    it("убирает название перед двоеточием и ставит заглавную", () => {
        expect(caseResult('KEYSTONE: сайт, который продаёт')).toBe('Сайт, который продаёт');
    });

    it("без двоеточия возвращает текст как есть", () => {
        expect(caseResult('Сайт без названия')).toBe('Сайт без названия');
    });
});

describe("homeCases", () => {
    const works = [work('a'), work('b'), work('c')];
    const cases = { a: { headline: 'A: первый' }, c: { headline: 'C: третий' } };

    it("берёт работы в порядке ids с номером из общего списка", () => {
        const items = homeCases(['c', 'a'], works, cases);
        expect(items.map(({ work, num }) => [work.id, num, work.description])).toEqual([
            ['c', '03', 'Третий'],
            ['a', '01', 'Первый']
        ]);
    });

    it("пропускает работы без кейса и неизвестные id", () => {
        expect(homeCases(['b', 'x', 'a'], works, cases).map(({ work }) => work.id)).toEqual(['a']);
    });

    it("все кейсы главной есть в портфолио", () => {
        expect(homeCases(homeCaseIds, portfolioWorks, portfolioCases)).toHaveLength(homeCaseIds.length);
    });
});
