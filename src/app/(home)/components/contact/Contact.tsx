import { FC, Fragment } from "react";

import TgIcon from '@/assets/_img/icons/tg-white.svg'

import s from './Contact.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { contactDescription, contactTitle, offerButtonsNote, offerTgButton, offerTrustLine, services } from "@/data/offer";
import { contactSectionId, contactTitleId } from "@/constants/urls";
import { leadServices } from "@/scripts/services";
import LeadForm from "@/app/popup/components/lead-form/LeadForm";

// Финальный блок главной (SALES_PLAN 3.9): слева заголовок, Telegram и строки доверия, справа форма заявки.
// До 900px – в столбик, форма под текстом. Сюда ведут призывы главной (ContactLink, DESIGN_FIXES_3_PLAN Д13):
// фокус после прыжка – на заголовок, поэтому tabIndex={-1}
const Contact: FC = () => {
    return (
        <section id={contactSectionId} data-goal-place="final" className={`${ralewayRegular.className} ${s.contact}`} aria-labelledby={contactTitleId}>
            <div className={s.text}>
                <h2 id={contactTitleId} tabIndex={-1} className={`${ralewayBold.className} ${s.title}`}>{contactTitle}</h2>
                <p className={s.description}>{contactDescription}</p>

                <a href={offerTgButton.href} target="_blank" rel="noopener" className={`${ralewayBold.className} ${s.tg}`}>
                    <TgIcon className={s.icon} aria-hidden="true" />
                    {offerTgButton.title}
                </a>
                {/* Части строки не рвутся внутри: перенос – только после «·», точка остаётся в конце строки (DESIGN_FIXES_6_PLAN Д34) */}
                <p className={s.note}>
                    {offerButtonsNote.split(' · ').map((part, i) => (
                        <Fragment key={part}>
                            {i > 0 && ' · '}
                            <span className={s.part}>{part}</span>
                        </Fragment>
                    ))}
                </p>
                <p className={s.trust}>{offerTrustLine()}</p>
            </div>

            <LeadForm className={s.form} services={leadServices(services)} />
        </section>
    )
}

export default Contact
