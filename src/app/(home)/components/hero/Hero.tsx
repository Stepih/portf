import { FC } from "react";
import Image from "next/image";

import photo from '@/assets/_img/rectangles/title-page/i.png'

import s from './Hero.module.scss'
import { allerta, ralewayRegular } from "@/app/fonts/fonts";
import { heroSlides, heroTitleSlide, offerTitle } from "@/data/offer";

// Первый экран главной (SALES_PLAN 3.1): маленький блок, как на старой главной.
// Крупная строка на английском – надпись, а h1 – русский оффер: его читают клиенты и поиск.
// Кнопки заявки с первого экрана убраны по решению владельца, они будут в финальном блоке (3.9)
const Hero: FC = () => {
    return (
        <section className={s.hero} aria-labelledby="hero-title">
            <Image className={s.photo} src={photo} alt="Степан Картузов" priority />

            <div className={`${ralewayRegular.className} ${s.card}`}>
                <p className={`${allerta.className} ${s.headline}`} lang="en">{heroSlides[heroTitleSlide].headline}</p>
                <h1 id="hero-title" className={s.title}>{offerTitle}</h1>
            </div>
        </section>
    )
}

export default Hero
