import { FC } from "react";

import TgIcon from '@/assets/_img/icons/tg-white.svg'

import s from './Contact.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { contactDescription, contactTitle, offerButtonsNote, offerTgButton, offerTrustLine } from "@/data/offer";
import LeadForm from "@/app/popup/components/lead-form/LeadForm";

// Финальный блок главной (SALES_PLAN 3.9): слева заголовок, Telegram и строки доверия, справа форма заявки.
// До 900px – в столбик, форма под текстом
const Contact: FC = () => {
    return (
        <section id="contact" data-goal-place="final" className={`${ralewayRegular.className} ${s.contact}`} aria-labelledby="contact-title">
            <div className={s.text}>
                <h2 id="contact-title" className={`${ralewayBold.className} ${s.title}`}>{contactTitle}</h2>
                <p className={s.description}>{contactDescription}</p>

                <a href={offerTgButton.href} target="_blank" rel="noopener" className={`${ralewayBold.className} ${s.tg}`}>
                    <TgIcon className={s.icon} aria-hidden="true" />
                    {offerTgButton.title}
                </a>
                <p className={s.note}>{offerButtonsNote}</p>
                <p className={s.trust}>{offerTrustLine()}</p>
            </div>

            <LeadForm className={s.form} />
        </section>
    )
}

export default Contact
