import { FC } from "react";
import Image from "next/image";
import Link from "next/link";

import photo from '@/assets/_img/rectangles/title-page/i.png'
import TgIcon from '@/assets/_img/icons/tg-white.svg'

import s from './Hero.module.scss'
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import { offerButtons, offerButtonsNote, offerDescription, offerTitle, offerTrustLine } from "@/data/offer";

// Первый экран главной (SALES_PLAN 3.1): оффер, строка доверия, форма и Telegram на равных
const Hero: FC = () => {
    const { form, tg } = offerButtons

    return (
        <section className={s.hero} aria-labelledby="hero-title">
            <div className={s.text}>
                <h1 id="hero-title" className={`${allerta.className} ${s.title}`}>{offerTitle}</h1>
                <p className={s.description}>{offerDescription}</p>
                <p className={s.trust}>{offerTrustLine()}</p>

                <div className={s.actions}>
                    <Link href={form.href} className={`${ralewayBold.className} ${s.btn} ${s.primary}`}>
                        {form.title}
                    </Link>
                    <a href={tg.href} target="_blank" rel="noopener" className={`${ralewayBold.className} ${s.btn}`}>
                        <TgIcon className={s.icon} aria-hidden="true" />
                        {tg.title}
                    </a>
                </div>
                <p className={s.note}>{offerButtonsNote}</p>
            </div>

            <Image className={s.photo} src={photo} alt="Степан Картузов" priority />
        </section>
    )
}

export default Hero
