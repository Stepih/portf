import { FC } from "react";

import s from './Reasons.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { offerReasons, reasonsDescription, reasonsTitle } from "@/data/offer";

// «Почему я» (SALES_PLAN 3.6): шесть пунктов списком без фона, чтобы не путались с карточками услуг.
// На компьютере в 3 колонки, над каждым пунктом – тонкая линия
const Reasons: FC = () => {
    return (
        <section className={`${ralewayRegular.className} ${s.reasons}`} aria-labelledby="reasons-title">
            <h2 id="reasons-title" className={`${ralewayBold.className} ${s.title}`}>{reasonsTitle}</h2>
            <p className={s.description}>{reasonsDescription}</p>

            <ul className={s.list}>
                {offerReasons.map((reason) => (
                    <li key={reason.title} className={s.reason}>
                        <h3 className={`${ralewayBold.className} ${s.name}`}>{reason.title}</h3>
                        <p className={s.text}>{reason.text}</p>
                    </li>
                ))}
            </ul>
        </section>
    )
}

export default Reasons
