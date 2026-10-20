import { IPortfolioCase, IPortfolioWork } from "@/interfaces/portfolio";

export interface IHomeCase {
    work: IPortfolioWork,
    // Место работы в общем списке портфолио, как в сетке /portfolio
    num: string
}

// Результат кейса для карточки: headline без префикса «Название: », с заглавной буквы
export const caseResult = (headline: string): string => {
    const colon = headline.indexOf(': ');
    const text = colon === -1 ? headline : headline.slice(colon + 2);
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Работы для главной в порядке ids; описание заменено результатом кейса.
// Работы без страницы кейса и неизвестные id пропускаются
export const homeCases = (
    ids: string[],
    works: IPortfolioWork[],
    cases: Record<string, Pick<IPortfolioCase, 'headline'>>
): IHomeCase[] =>
    ids.flatMap((id) => {
        const index = works.findIndex((work) => work.id === id);
        const data = cases[id];
        if (index === -1 || !data) return [];
        return [{
            work: { ...works[index], description: caseResult(data.headline) },
            num: String(index + 1).padStart(2, '0')
        }];
    });
