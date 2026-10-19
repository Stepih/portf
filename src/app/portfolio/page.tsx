import { FC } from "react";
import { Metadata } from "next";

import s from './page.module.scss'
import { baseOpenGraph } from "@/data/metadata";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { findIndustry, INDUSTRY_PARAM, portfolioTitle } from "@/scripts/portfolioIndustry";

import PortfolioCatalog from "./components/PortfolioCatalog";

interface IProps {
    searchParams: Promise<{ [INDUSTRY_PARAM]?: string | string[] }>
}

const description = 'Сайты, мобильные приложения и интерфейсы сервисов: дизайн и разработка. Кейсы с макетами, задачами и результатами';

// Заголовок и список зависят от ?for=, поэтому страница рендерится на запрос: превью ссылки в мессенджере
// сразу называет отрасль, а клиент видит свою подборку без мелькания всех работ.
// searchParams в одной generateMetadata пререндер не отключают, отсюда явный dynamic
export const dynamic = 'force-dynamic';

export const generateMetadata = async ({ searchParams }: IProps): Promise<Metadata> => {
    const param = (await searchParams)[INDUSTRY_PARAM];
    const industry = findIndustry(param);
    const title = portfolioTitle(industry);
    const text = industry
        ? `Сайты для ${industry.audience}: дизайн и разработка. Кейсы с макетами, задачами и результатами`
        : description;

    return {
        title,
        description: text,
        keywords: 'портфолио веб-разработчика, разработка сайтов, UX/UI дизайн, дизайн интерфейсов, интернет-магазин, корпоративный сайт, лендинг, веб-сервис, адаптивная вёрстка, Next.js, React',
        openGraph: {
            ...baseOpenGraph,
            title,
            description: text,
        },
        // Ссылки с ?for= дублируют общую страницу, в поиск идёт только она
        ...(param !== undefined && { robots: { index: false, follow: true } }),
    };
}

const PortfolioPage: FC = () => {
    return (
        <div className={s.page}>
            <PortfolioCatalog works={portfolioWorks} industries={portfolioIndustries} />
        </div>
    )
}

export default PortfolioPage
