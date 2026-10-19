"use client";

import { FC } from "react";

import s from './PortfolioCatalog.module.scss'
import { IPortfolioIndustry, IPortfolioWork } from "@/interfaces/portfolio";
import { ralewayBold } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { usePortfolioIndustry } from "@/hooks/usePortfolioIndustry";
import { withIndustry, worksFor } from "@/scripts/portfolioIndustry";

import PortfolioHead from "./PortfolioHead";
import IndustryFilter from "./IndustryFilter";
import FeaturedCard from "./FeaturedCard";
import WorksGrid from "./WorksGrid";

interface IProps {
    works: IPortfolioWork[],
    industries: IPortfolioIndustry[]
}

// Содержимое /portfolio. Отрасль хранится в адресе (?for=): такую ссылку можно сразу отправить клиенту
const PortfolioCatalog: FC<IProps> = ({ works, industries }) => {
    const industry = usePortfolioIndustry();

    // replaceState Next синхронизирует с useSearchParams; новой записи в истории и запроса к серверу нет
    const pick = (next: IPortfolioIndustry | null) => {
        if (next?.id === industry?.id) return;
        window.history.replaceState(null, '', withIndustry(portfolioPageURL, next?.id ?? null));
    };

    // Номер работы — её место в общем списке, фильтр его не меняет
    const items = worksFor(works, industry?.id ?? null)
        .map((work) => ({ work, num: String(works.indexOf(work) + 1).padStart(2, '0') }));
    const featured = items.filter(({ work }) => work.featured);
    const allTitle = industry ? 'Подходящие работы' : 'Все работы';

    return (
        <>
            <PortfolioHead featuredCount={featured.length} allCount={items.length} industry={industry} allTitle={allTitle} />

            <IndustryFilter works={works} industries={industries} active={industry} onPick={pick} />

            {featured.length > 0 && (
                <section id="featured" className={s.featured} aria-labelledby="featured-title">
                    <h2 id="featured-title" className={`${ralewayBold.className} ${s.sectionTitle}`}>Избранное</h2>
                    <div className={s.featuredGrid}>
                        {featured.map(({ work }, i) => (
                            <FeaturedCard key={work.id} work={work} num={String(i + 1).padStart(2, '0')} />
                        ))}
                    </div>
                </section>
            )}

            <WorksGrid items={items} title={allTitle} />
        </>
    )
}

export default PortfolioCatalog
