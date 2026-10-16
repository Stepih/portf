import { FC } from "react";
import { Metadata } from "next";

import s from './page.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { baseOpenGraph } from "@/data/metadata";
import { portfolioKinds, portfolioWorks } from "@/data/portfolio";

import PortfolioHead from "./components/PortfolioHead";
import FeaturedCard from "./components/FeaturedCard";
import WorksGrid from "./components/WorksGrid";

const description = 'Сайты, мобильные приложения и интерфейсы сервисов: дизайн и разработка. Кейсы с макетами, задачами и результатами';

export const metadata: Metadata = {
    title: "Портфолио",
    description,
    keywords: 'портфолио веб-разработчика, разработка сайтов, UX/UI дизайн, дизайн интерфейсов, интернет-магазин, корпоративный сайт, лендинг, веб-сервис, адаптивная вёрстка, Next.js, React',
    openGraph: {
        ...baseOpenGraph,
        title: 'Портфолио',
        description,
    },
};

const PortfolioPage: FC = () => {
    const featured = portfolioWorks.filter((work) => work.featured);

    return (
        <div className={s.page}>
            <PortfolioHead featuredCount={featured.length} allCount={portfolioWorks.length} />

            <section id="featured" className={s.featured} aria-labelledby="featured-title">
                <h2 id="featured-title" className={`${ralewayBold.className} ${s.sectionTitle}`}>Избранное</h2>
                <div className={s.featuredGrid}>
                    {featured.map((work, i) => (
                        <FeaturedCard key={work.id} work={work} num={String(i + 1).padStart(2, '0')} />
                    ))}
                </div>
            </section>

            <WorksGrid works={portfolioWorks} kinds={portfolioKinds} />
        </div>
    )
}

export default PortfolioPage
