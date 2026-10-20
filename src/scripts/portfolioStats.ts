import { IPortfolioIndustry, IPortfolioWork } from "@/interfaces/portfolio";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";

export interface IPortfolioStats {
    // Сколько работ в портфолио
    count: number,
    // Годы самой ранней и самой поздней работы; null, если работ нет
    years: { from: number, to: number } | null,
    // Отрасли, у которых есть работы, в порядке списка отраслей
    industries: IPortfolioIndustry[]
}

// Числа для строки доверия считаются из портфолио: новый кейс обновляет их сам
export const portfolioStats = (
    works: Pick<IPortfolioWork, 'year' | 'industries'>[] = portfolioWorks,
    industries: IPortfolioIndustry[] = portfolioIndustries
): IPortfolioStats => {
    const years = works.map((work) => work.year);
    return {
        count: works.length,
        years: years.length ? { from: Math.min(...years), to: Math.max(...years) } : null,
        industries: industries.filter((i) => works.some((work) => work.industries.includes(i.id)))
    };
}

// «2023–2026» или «2026», если все работы одного года
export const yearsRange = (years: IPortfolioStats['years']): string =>
    !years ? '' : years.from === years.to ? `${years.from}` : `${years.from}–${years.to}`;

// Русское множественное число: plural(5, ['проект', 'проекта', 'проектов']) → «проектов»
export const plural = (n: number, [one, few, many]: [string, string, string]): string => {
    const tens = Math.abs(n) % 100;
    const units = tens % 10;
    if (tens > 10 && tens < 20) return many;
    if (units === 1) return one;
    if (units >= 2 && units <= 4) return few;
    return many;
}
