import { FC } from "react";
import Link from "next/link";

import TgIcon from '@/assets/_img/icons/tg-white.svg'

import p from './Plate.module.scss'
import s from './SitesHead.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { head } from "@/data/sitesPage";

interface IProps {
    tgHref: string
}

// Первый экран /sites: крошки, заголовок, подпись и два действия – форма главной (залита) и Telegram.
// По центру, как первый экран /ai; под кнопками – подсказка «листайте». Живёт в сцене окна (У5б): под ним – пустое
// окно браузера, по скроллу первый экран уходит вверх, а окно встаёт по центру (WindowScene)
const SitesHead: FC<IProps> = ({ tgHref }) => {
    return (
        <header className={s.head}>
            <nav aria-label="Breadcrumb" className={s.crumbs}>
                <Link href="/">Главная</Link>
                <span aria-hidden="true">/</span>
                <span className={s.current} aria-current="page">{head.crumb}</span>
            </nav>
            <h1 className={`${ralewayBold.className} ${s.title}`}>{head.title}</h1>
            <p className={s.lead}>{head.lead}</p>

            <div className={`${ralewayBold.className} ${s.buttons}`} data-goal-place="sites_head">
                <ContactLink className={`${p.button} ${p.primary}`}>{head.cta}</ContactLink>
                <a href={tgHref} target="_blank" rel="noopener noreferrer" className={p.button}>
                    <TgIcon className={p.icon} aria-hidden="true" />
                    {head.tg}
                </a>
            </div>
            <p className={s.hint}>{head.hint}</p>
        </header>
    )
}

export default SitesHead
