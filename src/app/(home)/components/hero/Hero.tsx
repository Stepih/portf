import { FC } from "react";
import Image from "next/image";

import photo from '@/assets/_img/rectangles/title-page/i.png'

import s from './Hero.module.scss'
import HeroSlides from "./HeroSlides";
import { ralewayRegular } from "@/app/fonts/fonts";
import { heroInterval, heroSlides, heroTitleSlide } from "@/data/offer";

// Первый экран главной (SALES_PLAN 3.1): маленький блок, как на старой главной.
// В карточке сменяются три слайда (3.1.1): крупная надпись на английском и русская подпись,
// подпись слайда с оффером – h1, её читают клиенты и поиск.
// Кнопки заявки с первого экрана убраны по решению владельца, они будут в финальном блоке (3.9)
const Hero: FC = () => {
    return (
        <section className={s.hero} aria-labelledby="hero-title">
            <Image className={s.photo} src={photo} alt="Степан Картузов" priority />

            <div className={`${ralewayRegular.className} ${s.card}`}>
                <HeroSlides slides={heroSlides} titleSlide={heroTitleSlide} interval={heroInterval} />
            </div>
        </section>
    )
}

export default Hero
