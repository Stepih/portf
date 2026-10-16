import { FC } from "react";

import s from './CaseInfo.module.scss'
import { ICaseInfo } from "@/interfaces/portfolio";
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import Rise from "./Rise";

// «Задача и результат»: подписи капсом, под ними текст, крупный текст или метки
const CaseInfo: FC<{ info: ICaseInfo[] }> = ({ info }) => {
    return (
        <section className={s.info} aria-label="Задача и результат">
            {info.map((item) => (
                <Rise key={item.label} className={s.item}>
                    <span className={`${ralewayBold.className} ${s.label}`}>{item.label}</span>
                    {'chips' in item ? (
                        <ul className={s.chips}>
                            {item.chips.map((chip) => <li key={chip} className={s.chip}>{chip}</li>)}
                        </ul>
                    ) : item.big ? (
                        <p className={`${allerta.className} ${s.big}`}>{item.text}</p>
                    ) : (
                        <p className={s.text}>{item.text}</p>
                    )}
                </Rise>
            ))}
        </section>
    )
}

export default CaseInfo
