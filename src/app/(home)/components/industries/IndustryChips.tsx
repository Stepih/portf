import { FC } from "react";
import Link from "next/link";

import s from './IndustryChips.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { industryCounts, withIndustry } from "@/scripts/portfolioIndustry";

// «Выберите свою отрасль» (SALES_PLAN 3.2): вход в фильтр портфолио с главной.
// Чип ведёт на /portfolio?for=<id>, отрасли без работ не показываются
const IndustryChips: FC = () => {
    const chips = industryCounts(portfolioWorks, portfolioIndustries);
    if (chips.length === 0) return null;

    return (
        <section className={`${ralewayRegular.className} ${s.industries}`} aria-labelledby="industries-title">
            <h2 id="industries-title" className={`${ralewayBold.className} ${s.title}`}>Выберите свою отрасль</h2>
            <p className={s.description}>Покажу работы из вашей сферы</p>

            <ul className={s.chips}>
                {chips.map(({ industry, count }) => (
                    <li key={industry.id}>
                        <Link href={withIndustry(portfolioPageURL, industry.id)} className={s.chip}>
                            {industry.label}
                            <span className={s.count}>{count}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    )
}

export default IndustryChips
