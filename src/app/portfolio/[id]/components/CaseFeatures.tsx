import { FC } from "react";

import s from './CaseFeatures.module.scss'
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import Rise from "./Rise";

interface IProps {
    features: { title: string, text: string }[]
}

// «Главные фишки»: карточки с номером, заголовком и текстом
const CaseFeatures: FC<IProps> = ({ features }) => {
    return (
        <section className={s.section} aria-labelledby="features-title">
            <Rise>
                <h2 id="features-title" className={`${ralewayBold.className} ${s.title}`}>Главные фишки</h2>
            </Rise>
            <div className={s.grid}>
                {features.map((f, k) => (
                    <Rise key={f.title} as="article" className={s.card}>
                        <span className={`${allerta.className} ${s.num}`}>{String(k + 1).padStart(2, '0')}</span>
                        <h3 className={`${ralewayBold.className} ${s.cardTitle}`}>{f.title}</h3>
                        <p className={s.text}>{f.text}</p>
                    </Rise>
                ))}
            </div>
        </section>
    )
}

export default CaseFeatures
