import { FC } from "react";
import Link from "next/link";

import s from './HomeCases.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { homeCaseIds, homeCasesAllLabel, homeCasesTitle } from "@/data/homeCases";
import { formButton, industriesOther } from "@/data/offer";
import { IIndustryChip } from "@/interfaces/portfolio";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { homeCases } from "@/scripts/homeCases";
import { withIndustry } from "@/scripts/portfolioIndustry";
import ContactLink from "../contact-link/ContactLink";
import HomeCasesGrid from "./HomeCasesGrid";

// «Избранные кейсы» (SALES_PLAN 3.3): карточки из сетки портфолио с результатом кейса.
// Серверный: тексты кейсов не попадают в клиентский бандл, в сетку уходят только нужные работы
interface IProps {
    // Те же отрасли, что в сцене первого экрана: на телефоне они повторяются строкой под «Все работы»
    chips?: IIndustryChip[]
}

const HomeCases: FC<IProps> = ({ chips = [] }) => {
    const items = homeCases(homeCaseIds, portfolioWorks, portfolioCases, portfolioIndustries);
    if (items.length === 0) return null;

    return (
        <section className={s.cases} aria-labelledby="cases-title">
            <h2 id="cases-title" className={`${ralewayBold.className} ${s.title}`}>{homeCasesTitle}</h2>

            <HomeCasesGrid items={items} />

            <Link href={portfolioPageURL} className={`${ralewayBold.className} ${s.all}`}>
                {homeCasesAllLabel}
                <span className={s.arrow} aria-hidden="true">→</span>
            </Link>

            {/* Отрасли строкой (DESIGN_FIXES_4_PLAN Д19): на телефоне в сцене чипы кликабельны лишь на ~40px прокрутки.
                Видна только до 700px и при включённой анимации – иначе display: none (нет ни в Tab, ни у читалки):
                при «уменьшить движение» сцена статична и чипы в ней и так доступны */}
            {chips.length > 0 && (
                <div className={s.industries} data-goal-place="cases">
                    <ul className={s.chips}>
                        {chips.map((chip) => (
                            <li key={chip.id}>
                                <Link
                                    href={withIndustry(portfolioPageURL, chip.id)}
                                    className={s.chip}
                                    data-goal="industry_click"
                                    data-goal-id={chip.id}
                                >
                                    {chip.label}
                                    <span className={s.count}>{chip.count}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <p className={s.other}>
                        {industriesOther}{' '}
                        <ContactLink className={s.otherLink} data-goal="cta_click" data-goal-id="industries_other">
                            {formButton}
                        </ContactLink>
                    </p>
                </div>
            )}
        </section>
    )
}

export default HomeCases
