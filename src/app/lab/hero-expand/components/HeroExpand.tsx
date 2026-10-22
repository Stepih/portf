"use client";

import { FC, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cubicBezier, motion, MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, Variants } from "framer-motion";

import photo from '@/assets/_img/rectangles/title-page/i.png'

import s from './HeroExpand.module.scss'
import HeroSlides from "@/app/(home)/components/hero/HeroSlides";
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { heroInterval, heroSlides, heroTitleSlide } from "@/data/offer";
import { PortfolioIndustry } from "@/interfaces/portfolio";
import { withIndustry } from "@/scripts/portfolioIndustry";

interface HeroExpandProps {
    chips: { id: PortfolioIndustry, label: string, count: number }[]
}

// Доли прокрутки сцены: раскрытие карточки и порог, после которого выезжают отрасли.
// Порог скрытия ниже порога показа, чтобы на границе блоки не дёргались туда-обратно
const EXPAND_FROM = 0.04;
const EXPAND_TO = 0.4;
const SHOW_AT = 0.36;
const HIDE_AT = 0.3;

const ease = cubicBezier(.7, 0, .2, 1);

// Отступ края фона: от отступа карточки при t = 0 до нуля при t = 1
const useInset = (t: MotionValue<number>, edge: MotionValue<number>) =>
    useTransform([t, edge], ([p, e]: number[]) => e * (1 - p));

// Блоки выезжают снизу один за другим: заголовок, подпись, чипы. Прячутся разом, без очереди
const item: Variants = {
    hidden: { opacity: 0, y: 56, transition: { duration: .25 } },
    shown: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: .7, ease: [.2, .8, .2, 1], delay: i * .07 },
    }),
};

// Сцена высотой в несколько экранов, внутри липкий экран. Фон карточки – отдельный слой:
// его края при скролле едут от размеров карточки к краям окна, а скругление уходит в ноль.
// Слайды при этом гаснут и уходят вверх, а когда фон раскрылся – выезжают отрасли
const HeroExpand: FC<HeroExpandProps> = ({ chips }) => {
    const reduceMotion = useReducedMotion();
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const card = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    const { scrollYProgress } = useScroll({ target: scene, offset: ['start start', 'end end'] });
    const t = useTransform(scrollYProgress, [EXPAND_FROM, EXPAND_TO], [0, 1], { ease });

    // Отступы карточки от краёв липкого экрана, меряются при загрузке и ресайзе
    const top = useMotionValue(0);
    const right = useMotionValue(0);
    const bottom = useMotionValue(0);
    const left = useMotionValue(0);

    // Объявлены до замера: useTransform подписывается на края в своём эффекте,
    // и замер, сделанный раньше подписки, фон бы не увидел
    const bgTop = useInset(t, top);
    const bgRight = useInset(t, right);
    const bgBottom = useInset(t, bottom);
    const bgLeft = useInset(t, left);
    const radius = useTransform(t, [0, 1], [13, 0]);

    useLayoutEffect(() => {
        if (!screen.current || !card.current) return;
        const measure = () => {
            if (!screen.current || !card.current) return;
            scene.current?.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
            const box = screen.current.getBoundingClientRect();
            // offsetTop/Left не видят transform, поэтому слайды, уехавшие вверх, не сбивают замер
            const c = card.current;
            top.set(c.offsetTop);
            left.set(c.offsetLeft);
            right.set(box.width - c.offsetLeft - c.offsetWidth);
            bottom.set(box.height - c.offsetTop - c.offsetHeight);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(screen.current);
        observer.observe(card.current);
        return () => observer.disconnect();
    }, [reduceMotion, top, right, bottom, left]);

    const slidesOpacity = useTransform(scrollYProgress, [EXPAND_FROM + .02, EXPAND_FROM + .2], [1, 0]);
    const slidesY = useTransform(scrollYProgress, [EXPAND_FROM, EXPAND_TO], [0, -80]);
    const slidesScale = useTransform(scrollYProgress, [EXPAND_FROM, EXPAND_TO], [1, .92]);
    const photoOpacity = useTransform(scrollYProgress, [EXPAND_FROM, EXPAND_FROM + .14], [1, 0]);
    const photoY = useTransform(scrollYProgress, [EXPAND_FROM, EXPAND_TO], [0, -140]);

    useMotionValueEvent(scrollYProgress, 'change', (p) => {
        if (p >= SHOW_AT) setShown(true);
        else if (p <= HIDE_AT) setShown(false);
    });

    const industries = (
        <motion.div
            className={`${ralewayRegular.className} ${s.industries}`}
            initial={reduceMotion ? 'shown' : 'hidden'}
            animate={reduceMotion || shown ? 'shown' : 'hidden'}
            aria-labelledby="industries-title"
            role="region"
        >
            <motion.h2 id="industries-title" className={`${ralewayBold.className} ${s.title}`} variants={item} custom={0}>
                Выберите свою отрасль
            </motion.h2>
            <motion.p className={s.description} variants={item} custom={1}>Покажу работы из вашей сферы</motion.p>

            <ul className={s.chips}>
                {chips.map((chip, i) => (
                    <motion.li key={chip.id} variants={item} custom={i + 2}>
                        <Link
                            href={withIndustry(portfolioPageURL, chip.id)}
                            className={s.chip}
                            data-goal="industry_click"
                            data-goal-id={chip.id}
                            tabIndex={reduceMotion || shown ? undefined : -1}
                        >
                            {chip.label}
                            <span className={s.count}>{chip.count}</span>
                        </Link>
                    </motion.li>
                ))}
            </ul>
        </motion.div>
    );

    // «Уменьшить движение»: без липкой сцены, первый экран и отрасли просто идут друг за другом
    if (reduceMotion) {
        return (
            <section className={s.static} aria-labelledby="hero-title">
                <Image className={s.photo} src={photo} alt="Степан Картузов" priority />
                <div className={`${ralewayRegular.className} ${s.card} ${s.cardStatic}`}>
                    <HeroSlides slides={heroSlides} titleSlide={heroTitleSlide} interval={heroInterval} />
                </div>
                {industries}
            </section>
        );
    }

    return (
        <section ref={scene} className={s.scene} aria-labelledby="hero-title">
            <div ref={screen} className={s.screen}>
                <motion.div
                    className={s.bg}
                    style={{ top: bgTop, right: bgRight, bottom: bgBottom, left: bgLeft, borderRadius: radius }}
                    aria-hidden="true"
                />

                <div className={s.hero}>
                    <motion.div style={{ opacity: photoOpacity, y: photoY }}>
                        <Image className={s.photo} src={photo} alt="Степан Картузов" priority />
                    </motion.div>

                    <div ref={card} className={`${ralewayRegular.className} ${s.card}`}>
                        <motion.div className={s.slides} style={{ opacity: slidesOpacity, y: slidesY, scale: slidesScale }}>
                            <HeroSlides slides={heroSlides} titleSlide={heroTitleSlide} interval={heroInterval} />
                        </motion.div>
                    </div>
                </div>

                <div className={`${s.layer} ${shown ? s.layerShown : ''}`}>
                    {industries}
                </div>
            </div>
        </section>
    );
}

export default HeroExpand
