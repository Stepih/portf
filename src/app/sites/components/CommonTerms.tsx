import { FC } from "react";

import p from './Plate.module.scss'
import s from './CommonTerms.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { commonId, commonTopics, sections } from "@/data/sitesPage";

// «Для всех сайтов»: правила раздела 1 списка темами в три колонки. Сюда ведут строки «Всё, что есть в каждом сайте»
const CommonTerms: FC = () => {
    return (
        <section id={commonId} className={p.plate} aria-labelledby={`${commonId}-title`}>
            <h2 id={`${commonId}-title`} className={`${ralewayBold.className} ${p.title}`}>{sections.common.title}</h2>
            <p className={p.text}>{sections.common.text}</p>

            <hr className={p.rule} />

            <div className={s.grid}>
                {commonTopics.map((topic) => (
                    <div key={topic.title} className={s.topic}>
                        <h3 className={`${ralewayBold.className} ${p.label}`}>{topic.title}</h3>
                        <ul className={p.list}>
                            {topic.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                        {topic.notes?.map((note) => <p key={note} className={p.note}>{note}</p>)}
                    </div>
                ))}
            </div>
        </section>
    )
}

export default CommonTerms
