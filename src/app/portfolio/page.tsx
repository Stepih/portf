import { FC } from "react";
import { Metadata } from "next";

import s from './page.module.scss'
import { baseOpenGraph } from "@/data/metadata";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { findIndustry, INDUSTRY_PARAM } from "@/scripts/portfolioIndustry";

import PortfolioCatalog from "./components/PortfolioCatalog";

interface IProps {
    searchParams: Promise<{ [INDUSTRY_PARAM]?: string | string[] }>
}

const description = 'Сайты, мобильные приложения и интерфейсы сервисов: дизайн и разработка. Кейсы с макетами, задачами и результатами';

// Заголовок зависит от ?for=, поэтому страница рендерится на запрос: превью ссылки в мессенджере сразу называет отрасль
export const generateMetadata = async ({ searchParams }: IProps): Promise<Metadata> => {
    const industry = findIndustry((await searchParams)[INDUSTRY_PARAM]);
    const title = industry ? `Портфолио: ${industry.label}` : 'Портфолио';
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
        // Подборки для клиентов дублируют общую страницу, в поиск идёт только она
        ...(industry && { robots: { index: false, follow: true } }),
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
