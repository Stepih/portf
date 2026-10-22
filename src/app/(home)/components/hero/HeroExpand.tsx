"use client";

import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { animate, AnimationPlaybackControls, cubicBezier, motion, MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, Variants } from "framer-motion";

import photo from '@/assets/_img/rectangles/title-page/i.png'

import s from './HeroExpand.module.scss'
import HeroSlides from "./HeroSlides";
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { popupPageURL, portfolioPageURL } from "@/constants/urls";
import { formButton, heroInterval, heroSlides, heroTitleSlide, industriesDescription, industriesOther, industriesTitle } from "@/data/offer";
import { PortfolioIndustry } from "@/interfaces/portfolio";
import { withIndustry } from "@/scripts/portfolioIndustry";
import { plural } from "@/scripts/portfolioStats";

interface HeroExpandProps {
    chips: { id: PortfolioIndustry, label: string, count: number }[],
    // Сколько работ в портфолио, число в кружке над заголовком
    worksCount: number
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
// Длительность доводки, с: короткий остаток – быстрее, полное раскрытие – дольше
const SETTLE_MIN = .35;
const SETTLE_MAX = .8;
// Пауза между событиями колеса, после которой начинается новый жест, мс
const WHEEL_GAP = 120;
// Сдвиг пальца, после которого понятно направление жеста, px
const TOUCH_SLOP = 6;

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

// Первый экран главной (SALES_PLAN 3.1) и блок отраслей (3.2) одной сценой.
// Сцена высотой в несколько экранов, внутри липкий экран. Фон карточки – отдельный слой:
// его края при скролле едут от размеров карточки к краям окна, а скругление уходит в ноль.
// Слайды при этом гаснут. Фото уменьшается, летит в кружок над заголовком и там перетекает
// в число работ; фото непрозрачное, поэтому край фона сквозь него не просвечивает.
// Когда фон раскрылся – снизу по очереди выезжают заголовок, подпись и чипы отраслей.
// Чип ведёт на /portfolio?for=<id>, отрасли без работ не показываются
const HeroExpand: FC<HeroExpandProps> = ({ chips, worksCount }) => {
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

    // Доводка: раскрытие не останавливается на промежуточном кадре. Две точки – начало
    // (вверху страницы) и раскрытый экран с отраслями; между ними страницу везёт сам компонент.
    // Колесо и тачпад: первое же движение внутри раскрытия запускает доводку по направлению,
    // хвост инерции глотается, чтобы не проскочить точку. Тач: раскрытие идёт за пальцем,
    // при отпускании доезжает туда, куда вели. Клавиатура и ползунок – по scrollend
    useEffect(() => {
        if (reduceMotion) return;
        let anim: AnimationPlaybackControls | null = null;
        let lastWheel = 0;
        // После доводки события того же жеста колеса (инерция) ещё приходят – их пропускаем
        let swallowTail = false;
        let lastY = window.scrollY;
        let direction = 1;
        let timer = 0;
        // Тач: null – жест не наш, иначе последняя точка пальца и направление
        let touch: { y: number, dir: number } | null = null;
        let touchStart: { x: number, y: number } | null = null;

        // Точки доводки в координатах страницы
        const points = () => {
            if (!scene.current) return null;
            const sceneTop = scene.current.getBoundingClientRect().top + window.scrollY;
            const distance = scene.current.offsetHeight - window.innerHeight;
            // Сцена в первом экране – назад до самого верха, чтобы вернулась и шапка
            const start = sceneTop <= window.innerHeight ? 0 : sceneTop;
            return { start, end: Math.ceil(sceneTop + distance * EXPAND_TO) };
        };

        const jumpTo = (y: number) => window.scrollTo({ top: y, behavior: 'instant' });

        const glide = (to: number) => {
            anim?.stop();
            const from = window.scrollY;
            if (Math.abs(to - from) < 1) return;
            // Чем меньше осталось, тем короче доводка
            const share = Math.min(1, Math.abs(to - from) / (window.innerHeight * .4));
            anim = animate(from, to, {
                duration: SETTLE_MIN + (SETTLE_MAX - SETTLE_MIN) * share,
                ease: [.25, .1, .25, 1],
                onUpdate: jumpTo,
                onComplete: () => {
                    anim = null;
                    swallowTail = true;
                },
            });
        };

        const onWheel = (e: WheelEvent) => {
            const now = performance.now();
            const gap = now - lastWheel;
            lastWheel = now;
            if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.deltaY === 0) return;
            if (anim || (swallowTail && gap < WHEEL_GAP)) {
                e.preventDefault();
                return;
            }
            swallowTail = false;
            const pts = points();
            if (!pts) return;
            const y = window.scrollY;
            const down = e.deltaY > 0;
            if (down ? (y >= pts.start - 1 && y < pts.end - 1) : (y > pts.start + 1 && y <= pts.end + 1)) {
                e.preventDefault();
                glide(down ? pts.end : pts.start);
            }
        };

        const onTouchStart = (e: TouchEvent) => {
            anim?.stop();
            anim = null;
            touch = null;
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };

        const onTouchMove = (e: TouchEvent) => {
            const point = e.touches[0];
            if (touch) {
                e.preventDefault();
                const pts = points();
                if (!pts) return;
                const dy = touch.y - point.clientY;
                if (dy !== 0) touch.dir = dy > 0 ? 1 : -1;
                touch.y = point.clientY;
                jumpTo(Math.min(pts.end, Math.max(pts.start, window.scrollY + dy)));
                return;
            }
            // Жест решается на первом заметном сдвиге: вертикальный и внутри раскрытия – наш
            if (!touchStart || e.touches.length > 1) return;
            const dx = point.clientX - touchStart.x;
            const dy = touchStart.y - point.clientY;
            if (Math.abs(dy) < TOUCH_SLOP || Math.abs(dx) > Math.abs(dy)) return;
            touchStart = null;
            const pts = points();
            if (!pts) return;
            const y = window.scrollY;
            const down = dy > 0;
            // На краях наружу – обычный скролл (вниз по странице, вверх – pull-to-refresh)
            if (down ? (y >= pts.start - 1 && y < pts.end - 1) : (y > pts.start + 1 && y <= pts.end + 1)) {
                e.preventDefault();
                touch = { y: point.clientY, dir: down ? 1 : -1 };
            }
        };

        const onTouchEnd = () => {
            touchStart = null;
            if (!touch) return;
            const pts = points();
            if (pts) glide(touch.dir > 0 ? pts.end : pts.start);
            touch = null;
            swallowTail = false;
        };

        // Запасной путь: страницу привели в середину раскрытия клавиатурой, ползунком
        // или инерцией нативного скролла снизу – доезжаем по направлению
        const settle = () => {
            if (anim || touch) return;
            const pts = points();
            if (!pts) return;
            const y = window.scrollY;
            if (y <= pts.start + 1 || y >= pts.end - 1) return;
            glide(direction > 0 ? pts.end : pts.start);
        };

        const onScroll = () => {
            const y = window.scrollY;
            if (y !== lastY) direction = y > lastY ? 1 : -1;
            lastY = y;
            window.clearTimeout(timer);
            if (!anim && !touch) timer = window.setTimeout(settle, SCROLL_IDLE);
        };
        const onScrollEnd = () => {
            window.clearTimeout(timer);
            settle();
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('scrollend', onScrollEnd);
        return () => {
            anim?.stop();
            window.clearTimeout(timer);
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
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


    const industries = (
        <motion.div
            className={`${ralewayRegular.className} ${s.industries}`}
            initial={reduceMotion ? 'shown' : 'hidden'}
            animate={reduceMotion || shown ? 'shown' : 'hidden'}
            aria-labelledby="industries-title"
            role="region"
        >
            {/* Кружок над заголовком: сюда прилетает фото первого экрана и превращается в число работ */}
            {!reduceMotion && (
                <div ref={slot} className={s.slot} aria-hidden="true">
                    <motion.div className={s.mark} style={{ opacity: markOpacity, scale: markScale }}>
                        <span className={s.works}>
                            <b className={ralewayBold.className}>{worksCount}</b>
                            {plural(worksCount, ['работа', 'работы', 'работ'])}
                        </span>
                    </motion.div>
                </div>
            )}

            <motion.h2 id="industries-title" className={`${ralewayBold.className} ${s.title}`} variants={item} custom={0}>
                {industriesTitle}
            </motion.h2>
            <motion.p className={s.description} variants={item} custom={1}>{industriesDescription}</motion.p>

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

            {/* Чипы – только примеры: клиент из другой сферы идёт сразу в форму */}
            <motion.p className={s.other} variants={item} custom={chips.length + 2}>
                {industriesOther}{' '}
                <Link
                    href={popupPageURL}
                    className={s.otherLink}
                    data-goal="cta_click"
                    data-goal-id="industries_other"
                    tabIndex={reduceMotion || shown ? undefined : -1}
                >
                    {formButton}
                </Link>
            </motion.p>
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
