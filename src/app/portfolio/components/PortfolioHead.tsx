import { FC } from "react";
import Link from "next/link";

import TgIcon from '@/assets/_img/icons/tg-white.svg'

import s from './PortfolioHead.module.scss'
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import { IPortfolioIndustry } from "@/interfaces/portfolio";
import { popupPageURL } from "@/constants/urls";
import { formButton, offerTgButton, portfolioDescription } from "@/data/offer";
import { portfolioHeading, withIndustry } from "@/scripts/portfolioIndustry";

interface IProps {
    featuredCount: number,
    allCount: number,
    // Выбранная отрасль; null — все работы
    industry: IPortfolioIndustry | null,
    allTitle: string
}

// Шапка страницы: крошки, заголовок, оффер с кнопками заявки и Telegram, якоря к разделам.
// В подборке ?for= заголовок называет отрасль, а форма получает её в ссылке (SALES_PLAN 5.1, 4.8)
const PortfolioHead: FC<IProps> = ({ featuredCount, allCount, industry, allTitle }) => {
    return (
        <header className={s.head}>
            <div className={s.intro}>
                <nav aria-label="Breadcrumb" className={s.crumbs}>
                    <Link href="/">Главная</Link>
                    <span aria-hidden="true">/</span>
                    <span className={s.current} aria-current="page">Портфолио</span>
                </nav>
                <h1 className={`${industry ? `${ralewayBold.className} ${s.industryTitle}` : `${allerta.className} ${s.title}`}`}>
                    {portfolioHeading(industry)}
                </h1>
                <p className={s.description}>{portfolioDescription}</p>

                <div className={`${ralewayBold.className} ${s.buttons}`}>
                    <Link href={withIndustry(popupPageURL, industry?.id ?? null)} className={`${s.button} ${s.primary}`}>
                        {formButton}
                    </Link>
                    <a href={offerTgButton.href} target="_blank" rel="noopener" className={s.button}>
                        <TgIcon className={s.icon} aria-hidden="true" />
                        {offerTgButton.title}
                    </a>
                </div>
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
