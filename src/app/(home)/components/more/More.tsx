"use client"

import { FC } from "react";
import Link from "next/link";

import s from './More.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { moreLinks, moreTitle } from "@/data/offer";
import { reachGoal } from "@/scripts/metrika";

// «А ещё я…» (SALES_PLAN 3.10): музыка, медиа и канал с работами – внизу, после формы.
// Заменил ButtonList. Внешние ссылки открываются в новой вкладке
const More: FC = () => {
    return (
        <section className={`${ralewayRegular.className} ${s.more}`} aria-labelledby="more-title">
            <h2 id="more-title" className={`${ralewayBold.className} ${s.title}`}>{moreTitle}</h2>

            <ul className={s.links}>
                {moreLinks.map((link) => (
                    <li key={link.href}>
                        {link.href.startsWith('http') ? (
                            <a href={link.href} target="_blank" rel="noopener" className={s.link} onClick={() => reachGoal(link.goal)}>
                                {link.title}
                            </a>
                        ) : (
                            <Link href={link.href} className={s.link} onClick={() => reachGoal(link.goal)}>
                                {link.title}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    )
}

export default More
