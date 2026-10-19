import { FC } from "react";
import Link from "next/link";

import s from './PortfolioHead.module.scss'
import { allerta } from "@/app/fonts/fonts";
import { IPortfolioIndustry } from "@/interfaces/portfolio";

interface IProps {
    featuredCount: number,
    allCount: number,
    // Выбранная отрасль; null — все работы
    industry: IPortfolioIndustry | null,
    allTitle: string
}

// Шапка страницы: крошки, заголовок и якоря к разделам
const PortfolioHead: FC<IProps> = ({ featuredCount, allCount, industry, allTitle }) => {
    return (
        <header className={s.head}>
            <div className={s.intro}>
                <nav aria-label="Breadcrumb" className={s.crumbs}>
                    <Link href="/">Главная</Link>
                    <span aria-hidden="true">/</span>
                    <span className={s.current} aria-current="page">Портфолио</span>
                </nav>
                <h1 className={`${allerta.className} ${s.title}`}>Портфолио</h1>
                <p className={s.description}>
                    {industry ? `Работы для ${industry.audience}` : 'Сайты, мобильные приложения и интерфейсы сервисов, 2023–2026'}
                </p>
            </div>

            <nav aria-label="Разделы" className={s.anchors}>
                {featuredCount > 0 && (
                    <a href="#featured" className={s.anchor}>
                        Избранное<span className={s.count}>{featuredCount}</span>
                    </a>
                )}
                <a href="#all" className={s.anchor}>
                    {allTitle}<span className={s.count}>{allCount}</span><span aria-hidden="true">↓</span>
                </a>
            </nav>
        </header>
    )
}

export default PortfolioHead
