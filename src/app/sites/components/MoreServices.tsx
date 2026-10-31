import { FC } from "react";

import p from './Plate.module.scss'
import s from './MoreServices.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { moreId, moreOptions, sections } from "@/data/sitesPage";
import PriceRow from "./PriceRow";

// «Ещё делаю»: смежные услуги раздела 6 списка – прайсом в две колонки без плашки (У5а: после плашек сетки
// «Для всех сайтов» – открытый лист), строки – как опции в сценах сборки
const MoreServices: FC = () => {
    return (
        <section id={moreId} className={s.more} aria-labelledby={`${moreId}-title`}>
            <div className={s.head}>
                <h2 id={`${moreId}-title`} className={`${ralewayBold.className} ${p.title}`}>{sections.more.title}</h2>
                <p className={p.text}>{sections.more.text}</p>
            </div>

            <ul className={s.list}>
                {moreOptions.map((option) => <PriceRow key={option.title} option={option} />)}
            </ul>
        </section>
    )
}

export default MoreServices
