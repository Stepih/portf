import { FC } from "react";

import p from './Plate.module.scss'
import s from './MoreServices.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { moreId, moreOptions, sections } from "@/data/sitesPage";
import { Option } from "./SiteSection";

// «Ещё делаю»: смежные услуги раздела 6 списка – списком в две колонки, цена жирным, как опции разделов
const MoreServices: FC = () => {
    return (
        <section id={moreId} className={p.plate} aria-labelledby={`${moreId}-title`}>
            <h2 id={`${moreId}-title`} className={`${ralewayBold.className} ${p.title}`}>{sections.more.title}</h2>
            <p className={p.text}>{sections.more.text}</p>

            <hr className={p.rule} />

            <ul className={`${p.list} ${s.list}`}>
                {moreOptions.map((option) => <Option key={option.title} option={option} />)}
            </ul>
        </section>
    )
}

export default MoreServices
