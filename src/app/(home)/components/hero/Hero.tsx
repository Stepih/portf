import { FC } from "react";
import Image from "next/image";
import Link from "next/link";

import photo from '@/assets/_img/rectangles/title-page/i.png'
import TgIcon from '@/assets/_img/icons/tg-white.svg'

import s from './Hero.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { offerButtons, offerButtonsNote, offerDescription, offerTitle, offerTrustLine } from "@/data/offer";

// Первый экран главной (SALES_PLAN 3.1): фото над карточкой, как было на старой главной;
// в карточке оффер, строка доверия, форма и Telegram на равных
const Hero: FC = () => {
    const { form, tg } = offerButtons

    return (
        <section className={s.hero} aria-labelledby="hero-title">
            <Image className={s.photo} src={photo} alt="Степан Картузов" priority />

            <div className={s.card}>
                {/* Allerta Stencil без кириллицы: трафарет рисует stencil-cut в стилях */}
                <h1 id="hero-title" className={`${ralewayRegular.className} ${s.title}`}>{offerTitle}</h1>
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
        </section>
    )
}

export default Hero
