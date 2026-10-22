import { IPortfolioIndustry, PortfolioIndustry } from "@/interfaces/portfolio";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";

// Параметр ссылки с отраслью: /portfolio?for=medicine
export const INDUSTRY_PARAM = 'for';

// Отрасль из параметра ссылки. Неизвестное значение и отрасль без работ — то же, что без фильтра:
// клиент видит все работы, а не пустую подборку
export const findIndustry = (value: string | string[] | null | undefined): IPortfolioIndustry | null => {
    const industry = portfolioIndustries.find((i) => i.id === value);
    return industry && portfolioWorks.some((work) => work.industries.includes(industry.id)) ? industry : null;
}

// h1 портфолио: общий или подборки — «Сайты для строительных и ремонтных компаний»
export const portfolioHeading = (industry: IPortfolioIndustry | null): string =>
    industry ? `Сайты для ${industry.audience}` : 'Портфолио';

// title страницы портфолио: у подборки после h1 ещё «портфолио», иначе во вкладке непонятно, что за страница
export const portfolioTitle = (industry: IPortfolioIndustry | null): string =>
    industry ? `${portfolioHeading(industry)} – портфолио` : 'Портфолио: сайты для бизнеса – Степан Картузов';

// Работы, подходящие отрасли; без отрасли — все
export const worksFor = <T extends { industries: PortfolioIndustry[] }>(works: T[], industry: PortfolioIndustry | null): T[] =>
    industry ? works.filter((work) => work.industries.includes(industry)) : works;

// Адрес с отраслью в параметре
export const withIndustry = (href: string, industry: PortfolioIndustry | null): string =>
    industry ? `${href}?${INDUSTRY_PARAM}=${industry}` : href;

// Следующий элемент после id по кругу; null, если id нет в списке или идти больше некуда
export const nextAfter = <T extends { id: string }>(list: T[], id: string): T | null => {
    const index = list.findIndex((item) => item.id === id);
    if (index < 0 || list.length < 2) return null;
    return list[(index + 1) % list.length];
}

// Отрасли с числом подходящих работ, в порядке списка; отрасли без работ не попадают
export const industryCounts = <T extends { industries: PortfolioIndustry[] }>(works: T[], industries: IPortfolioIndustry[]) =>
    industries
        .map((industry) => ({ industry, count: worksFor(works, industry.id).length }))
        .filter(({ count }) => count > 0);
