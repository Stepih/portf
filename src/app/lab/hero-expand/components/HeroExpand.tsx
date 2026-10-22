"use client";

import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { plural } from "@/scripts/portfolioStats";

// Фото при раскрытии уменьшается и летит в кружок над «Выберите свою отрасль».
// Фото непрозрачное, поэтому край фона сквозь него не просвечивает. На подлёте фото
// перетекает в знак на тёмном круге: works – число работ, tiles – значок «разделы»
export type MarkVariant = 'works' | 'tiles';

interface HeroExpandProps {
    chips: { id: PortfolioIndustry, label: string, count: number }[],
    // Сколько работ в портфолио – для варианта works
    worksCount: number,
    mark: MarkVariant
}

// Доли прокрутки сцены: раскрытие карточки и порог, после которого выезжают отрасли.
// Порог скрытия ниже порога показа, чтобы на границе блоки не дёргались туда-обратно
const EXPAND_FROM = 0.02;
const EXPAND_TO = 0.3;
const SHOW_AT = 0.27;
const HIDE_AT = 0.2;

const ease = cubicBezier(.4, 0, .2, 1);

// Через сколько мс без событий скролл считается остановленным (где нет события scrollend)
const SCROLL_IDLE = 150;

// Отступ края фона: от отступа карточки при t = 0 до нуля при t = 1
const useInset = (t: MotionValue<number>, edge: MotionValue<number>) =>
    useTransform([t, edge], ([p, e]: number[]) => e * (1 - p));

// Сдвиг или масштаб фото: от 0 (или 1) при t = 0 до цели при t = 1
const useToward = (t: MotionValue<number>, target: MotionValue<number>, from = 0) =>
    useTransform([t, target], ([p, v]: number[]) => from + (v - from) * p);

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
// Слайды при этом гаснут, а когда фон раскрылся – выезжают отрасли
const HeroExpand: FC<HeroExpandProps> = ({ chips, worksCount, mark }) => {
    const reduceMotion = useReducedMotion();
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const card = useRef<HTMLDivElement>(null);
    const photoBox = useRef<HTMLDivElement>(null);
    const slot = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    const { scrollYProgress } = useScroll({ target: scene, offset: ['start start', 'end end'] });
    const t = useTransform(scrollYProgress, [EXPAND_FROM, EXPAND_TO], [0, 1], { ease, clamp: true });

    // Отступы карточки от краёв липкого экрана, меряются при загрузке и ресайзе
    const top = useMotionValue(0);
    const right = useMotionValue(0);
    const bottom = useMotionValue(0);
    const left = useMotionValue(0);
    // Куда едет фото: сдвиг до кружка над заголовком и масштаб под его размер
    const photoDx = useMotionValue(0);
    const photoDy = useMotionValue(0);
    const photoScale = useMotionValue(1);

    // Объявлены до замера: useTransform подписывается на края в своём эффекте,
    // и замер, сделанный раньше подписки, фон бы не увидел
    const bgTop = useInset(t, top);
    const bgRight = useInset(t, right);
    const bgBottom = useInset(t, bottom);
    const bgLeft = useInset(t, left);
    const radius = useTransform(t, [0, 1], [13, 0]);
    const towardX = useToward(t, photoDx);
    const towardY = useToward(t, photoDy);
    const towardScale = useToward(t, photoScale, 1);

    useLayoutEffect(() => {
        if (!screen.current || !card.current || !photoBox.current) return;
        const measure = () => {
            if (!screen.current || !card.current || !photoBox.current) return;
            scene.current?.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
            const box = screen.current.getBoundingClientRect();
            // offsetTop/Left не видят transform, поэтому уехавшие слайды и фото не сбивают замер
            const c = card.current;
            top.set(c.offsetTop);
            left.set(c.offsetLeft);
            right.set(box.width - c.offsetLeft - c.offsetWidth);
            bottom.set(box.height - c.offsetTop - c.offsetHeight);

            const p = photoBox.current.getBoundingClientRect();
            if (slot.current) {
                const target = slot.current.getBoundingClientRect();
                photoDx.set(target.left + target.width / 2 - (p.left + p.width / 2));
                photoDy.set(target.top + target.height / 2 - (p.top + p.height / 2));
                photoScale.set(target.width / p.width);
            }
        };
        measure();
        const observer = new ResizeObserver(measure);
        [screen.current, card.current, photoBox.current, slot.current].forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, [reduceMotion, top, right, bottom, left, photoDx, photoDy, photoScale]);

    // Доводка: остановились посреди раскрытия – страница докручивается до ближайшего
    // целого шага по направлению скролла. Вниз – до раскрытого экрана с отраслями, вверх – к началу.
    // Промежуточного кадра на экране не остаётся
    useEffect(() => {
        if (reduceMotion) return;
        let lastY = window.scrollY;
        // Доводка едет туда же, куда скроллили, поэтому своё направление она не сбивает
        let direction = 1;
        let timer = 0;

        const settle = () => {
            if (!scene.current) return;
            const sceneTop = scene.current.getBoundingClientRect().top + window.scrollY;
            const distance = scene.current.offsetHeight - window.innerHeight;
            const p = (window.scrollY - sceneTop) / distance;
            if (p <= EXPAND_FROM || p >= EXPAND_TO) return;
            // Сцена в первом экране – назад до самого верха, чтобы вернулась и шапка
            const start = sceneTop <= window.innerHeight ? 0 : sceneTop;
            const target = direction > 0 ? Math.ceil(sceneTop + distance * EXPAND_TO) : start;
            window.scrollTo({ top: target, behavior: 'smooth' });
        };

        const onScroll = () => {
            const y = window.scrollY;
            if (y !== lastY) direction = y > lastY ? 1 : -1;
            lastY = y;
            window.clearTimeout(timer);
            timer = window.setTimeout(settle, SCROLL_IDLE);
        };
        // scrollend приходит после инерции и когда палец отпущен; таймер – запасной путь
        const onScrollEnd = () => {
            window.clearTimeout(timer);
            settle();
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('scrollend', onScrollEnd);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('scrollend', onScrollEnd);
        };
    }, [reduceMotion]);

    // На подлёте к кружку фото перетекает в знак: фото гаснет, знак проявляется и дорастает до размера
    const photoOpacity = useTransform(t, [.7, 1], [1, 0]);
    const markOpacity = useTransform(t, [.7, 1], [0, 1]);
    const markScale = useTransform(t, [.7, 1], [.6, 1]);

    const slidesOpacity = useTransform(scrollYProgress, [EXPAND_FROM, EXPAND_FROM + .12], [1, 0]);
    const slidesY = useTransform(scrollYProgress, [EXPAND_FROM, EXPAND_TO], [0, -60]);

    useMotionValueEvent(scrollYProgress, 'change', (p) => {
        if (p >= SHOW_AT) setShown(true);
        else if (p <= HIDE_AT) setShown(false);
    });

    const markContent = {
        works: (
            <span className={s.works}>
                <b className={ralewayBold.className}>{worksCount}</b>
                {plural(worksCount, ['работа', 'работы', 'работ'])}
            </span>
        ),
        tiles: (
            <svg className={s.tiles} viewBox="0 0 24 24">
                <rect x="3" y="3" width="8" height="8" rx="2" />
                <rect x="13" y="3" width="8" height="8" rx="2" />
                <rect x="3" y="13" width="8" height="8" rx="2" />
                <rect x="13" y="13" width="8" height="8" rx="2" />
            </svg>
        ),
    }[mark];

    const industries = (
        <motion.div
            className={`${ralewayRegular.className} ${s.industries}`}
            initial={reduceMotion ? 'shown' : 'hidden'}
            animate={reduceMotion || shown ? 'shown' : 'hidden'}
            aria-labelledby="industries-title"
            role="region"
        >
            {/* Кружок над заголовком: сюда прилетает фото первого экрана и превращается в знак */}
            {!reduceMotion && (
                <div ref={slot} className={s.slot} aria-hidden="true">
                    <motion.div className={s.mark} style={{ opacity: markOpacity, scale: markScale }}>
                        {markContent}
                    </motion.div>
                </div>
            )}

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
                    <div ref={photoBox} className={s.photoBox}>
                        <motion.div style={{ x: towardX, y: towardY, scale: towardScale, opacity: photoOpacity }}>
                            <Image className={s.photo} src={photo} alt="Степан Картузов" priority />
                        </motion.div>
                    </div>

                    <div ref={card} className={`${ralewayRegular.className} ${s.card}`}>
                        <motion.div style={{ opacity: slidesOpacity, y: slidesY }}>
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
