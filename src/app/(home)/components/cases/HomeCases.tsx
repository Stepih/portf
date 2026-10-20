import { FC } from "react";
import Link from "next/link";

import s from './HomeCases.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { homeCaseIds, homeCasesAllLabel, homeCasesTitle } from "@/data/homeCases";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { homeCases } from "@/scripts/homeCases";
import HomeCasesGrid from "./HomeCasesGrid";

// «Избранные кейсы» (SALES_PLAN 3.3): карточки из сетки портфолио с результатом кейса.
// Серверный: тексты кейсов не попадают в клиентский бандл, в сетку уходят только нужные работы
const HomeCases: FC = () => {
    const items = homeCases(homeCaseIds, portfolioWorks, portfolioCases);
    if (items.length === 0) return null;

    return (
        <section className={s.cases} aria-labelledby="cases-title">
            <h2 id="cases-title" className={`${ralewayBold.className} ${s.title}`}>{homeCasesTitle}</h2>

            <HomeCasesGrid items={items} />

            <Link href={portfolioPageURL} className={`${ralewayBold.className} ${s.all}`}>
                {homeCasesAllLabel}
                <span className={s.arrow} aria-hidden="true">→</span>
            </Link>
        </section>
    )
}

export default HomeCases
