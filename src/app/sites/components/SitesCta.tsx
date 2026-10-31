import { FC } from "react";

import TgIcon from '@/assets/_img/icons/tg-white.svg'

import p from './Plate.module.scss'
import s from './SitesCta.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { head, sections } from "@/data/sitesPage";

interface IProps {
    tgHref: string
}

// Финал страницы: заголовок, форма главной (залита) и Telegram, под ними – когда отвечу
const SitesCta: FC<IProps> = ({ tgHref }) => {
    return (
        <section className={s.cta} aria-labelledby="sites-cta-title">
            <h2 id="sites-cta-title" className={`${ralewayBold.className} ${p.title}`}>{sections.cta.title}</h2>
            <div className={`${ralewayBold.className} ${s.buttons}`} data-goal-place="sites_final">
                <ContactLink className={`${p.button} ${p.primary}`}>{head.cta}</ContactLink>
                <a href={tgHref} target="_blank" rel="noopener noreferrer" className={p.button}>
                    <TgIcon className={p.icon} aria-hidden="true" />
                    {head.tg}
                </a>
            </div>
            <p className={s.note}>{sections.cta.text}</p>
        </section>
    )
}

export default SitesCta
