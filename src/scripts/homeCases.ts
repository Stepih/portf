import { IPortfolioCase, IPortfolioIndustry, IPortfolioWork } from "@/interfaces/portfolio";

// Результат кейса для карточки: headline без префикса «Название: », с заглавной буквы
export const caseResult = (headline: string): string => {
    const colon = headline.indexOf(': ');
    const text = colon === -1 ? headline : headline.slice(colon + 2);
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Метки карточки на главной: отрасли клиента вместо «Web / Motion / SaaS» (CONVERSION_PLAN К4.1).
// Работа без отрасли – тип работы
export const industryTags = (work: IPortfolioWork, industries: IPortfolioIndustry[]): string[] => {
    const labels = work.industries.flatMap((id) => industries.find((industry) => industry.id === id)?.label ?? []);
    return labels.length > 0 ? labels : [work.kind];
}

// Работы для главной в порядке ids; описание заменено результатом кейса, теги – отраслями.
// Работы без страницы кейса и неизвестные id пропускаются
export const homeCases = (
    ids: string[],
    works: IPortfolioWork[],
    cases: Record<string, Pick<IPortfolioCase, 'headline'>>,
    industries: IPortfolioIndustry[]
): IPortfolioWork[] =>
    ids.flatMap((id) => {
        const work = works.find((item) => item.id === id);
        const data = cases[id];
        if (!work || !data) return [];
        return [{ ...work, description: caseResult(data.headline), tags: industryTags(work, industries) }];
    });
