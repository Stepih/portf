import { FC } from "react";
import Image from "next/image";
import Link from "next/link";

import p from './Plate.module.scss'
import s from './SitesCases.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { IPortfolioWork } from "@/interfaces/portfolio";

export interface ISitesCasesGroup {
    id: string,
    title: string,
    cases: (Pick<IPortfolioWork, 'id' | 'name' | 'cover'> & { text?: string })[]
}

interface IProps {
    title: string,
    groups: ISitesCasesGroup[]
}

// Кейсы видов сайтов – временно простым списком под сценой окна (SERVICES_PLAN У5б, этап 1): из сцены они ушли,
// на этапе 2 их заменит колода с крупными скриншотами (как AgentDeck на /ai)
const SitesCases: FC<IProps> = ({ title, groups }) => (
    <section className={s.cases} aria-labelledby="sites-cases-title">
        <h2 id="sites-cases-title" className={`${ralewayBold.className} ${p.title}`}>{title}</h2>
        <div className={s.groups}>
            {groups.map((group) => (
                <div key={group.id}>
                    <h3 className={`${ralewayBold.className} ${s.group}`}>{group.title}</h3>
                    <ul className={s.list}>
                        {group.cases.map((work) => (
                            <li key={work.id}>
                                <Link href={`${portfolioPageURL}/${work.id}`} className={s.case}>
                                    <span className={s.thumb}><Image src={work.cover} alt="" fill sizes="96px" /></span>
                                    <span className={s.info}>
                                        <span className={ralewayBold.className}>{work.name}</span>
                                        {work.text && <span className={s.text}>{work.text}</span>}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    </section>
);

export default SitesCases;
