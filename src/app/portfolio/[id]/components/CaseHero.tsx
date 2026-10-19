"use client";

import { FC, KeyboardEvent, PointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import s from './CaseHero.module.scss'
import { ICaseSlide } from "@/interfaces/portfolio";
import { allerta } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { easeInOutQuad } from "../../components/easing";
import { slideTint } from "./caseTint";
import PortfolioLink from "../../components/PortfolioLink";

interface IProps {
    name: string,
    year: number,
    kind: string,
    role: string,
    headline: string,
    tags: string[],
    accent: string,
    url?: string,
    slides: ICaseSlide[]
}

const TRANSITION_MS = 1100;
const TRANSITION_EASE = 'cubic-bezier(.7,0,.2,1)';
const pad = (v: number) => String(v).padStart(2, '0');

// Длинный скриншот, который листается за время слайда: from/to — доли пути прокрутки
const PanImage: FC<{ src: string, alt: string, from: number, to: number, sizes: string, priority?: boolean }> = ({ src, alt, from, to, sizes, priority }) => (
    <Image
        className={s.pan}
        data-pan=""
        data-from={from}
        data-to={to}
        src={src}
        alt={alt}
        width={0}
        height={0}
        sizes={sizes}
        priority={priority}
        draggable={false}
    />
)

const BrowserBar: FC = () => (
    <div className={s.bar} aria-hidden="true"><span /><span /><span /></div>
)

// first — первый слайд: его картинки грузятся сразу, это LCP страницы
const SlideContent: FC<{ slide: ICaseSlide, first: boolean }> = ({ slide, first }) => {
    switch (slide.type) {
        case 'desktop':
            return (
                <div className={s.desktop}>
                    <BrowserBar />
                    <div className={s.desktopScreen}>
                        <PanImage src={slide.src} alt={slide.caption} from={0} to={1} sizes="(max-width: 899px) 90vw, 84vw" priority={first} />
                    </div>
                </div>
            )
        case 'mobile':
            // Два телефона показывают верхнюю и нижнюю половину одного скриншота
            return (
                <div className={s.phones}>
                    {[[0, 0.5], [0.5, 1]].map(([from, to], k) => (
                        <div key={k} className={`${s.phone} ${k === 0 ? s.phoneRaised : ''}`}>
                            <div className={s.phoneScreen}>
                                <PanImage src={slide.src} alt={slide.caption} from={from} to={to} sizes="(max-width: 899px) 40vw, 360px" priority={first} />
                                <span className={s.notch} aria-hidden="true" />
                            </div>
                        </div>
                    ))}
                </div>
            )
        case 'crop':
            return (
                <Image
                    className={s.crop}
                    data-kb=""
                    src={slide.src}
                    alt={slide.caption}
                    fill
                    sizes="100vw"
                    priority={first}
                    draggable={false}
                    style={{ objectPosition: slide.pos }}
                />
            )
        case 'video':
            return (
                <div className={s.video}>
                    <BrowserBar />
                    <video
                        data-hv=""
                        src={slide.src}
                        poster={slide.poster}
                        muted
                        loop
                        playsInline
                        preload="auto"
                        aria-label={slide.caption}
                    />
                </div>
            )
    }
}

// Первый экран кейса: слайдер макетов на всю ширину окна, поверх — заголовок, метки и вкладки слайдов.
// Слайды меняются сами по таймеру, свайпом, стрелками и клавишами ← →
const CaseHero: FC<IProps> = ({ name, year, kind, role, headline, tags, accent, url, slides }) => {
    const [index, setIndex] = useState(0);
    const reduceMotion = useReducedMotion();

    const heroRef = useRef<HTMLElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const barRefs = useRef<(HTMLSpanElement | null)[]>([]);

    // Состояние таймера и анимации живёт в ref: оно меняется каждый кадр
    const elapsed = useRef(0);
    const dir = useRef(1);
    const drag = useRef<{ x: number, y: number } | null>(null);
    const visible = useRef(true);
    const prevIndex = useRef(0);
    const indexRef = useRef(0);
    indexRef.current = index;

    const count = slides.length;

    const go = useCallback((n: number, d?: number) => {
        if (!count) return;
        const to = ((n % count) + count) % count;
        if (to === indexRef.current) return;
        dir.current = d ?? (to > indexRef.current ? 1 : -1);
        elapsed.current = 0;
        setIndex(to);
    }, [count]);

    // При скролле слайдер чуть уменьшается, а подписи уезжают вверх и гаснут
    const { scrollY } = useScroll();
    const [vh, setVh] = useState(800);
    const stageScale = useTransform(scrollY, (y) => 1 - 0.06 * Math.min(1, Math.max(0, y / vh)));
    const uiY = useTransform(scrollY, (y) => -90 * Math.min(1, Math.max(0, y / vh)));
    const uiOpacity = useTransform(scrollY, (y) => Math.max(0, 1 - 1.5 * Math.min(1, Math.max(0, y / vh))));

    // Слайдер выходит из колонки контента на всю ширину окна и занимает экран под шапкой сайта
    useLayoutEffect(() => {
        const hero = heroRef.current;
        if (!hero) return;
        const fit = () => {
            const parent = hero.parentElement;
            if (!parent) return;
            const mobile = window.matchMedia('(max-width: 899px)').matches;
            hero.style.width = `${document.documentElement.clientWidth}px`;
            hero.style.marginLeft = `${-Math.round(parent.getBoundingClientRect().left)}px`;
            const top = Math.max(0, hero.getBoundingClientRect().top + window.scrollY);
            hero.style.height = `${Math.max(mobile ? 480 : 560, window.innerHeight - top)}px`;
            setVh(window.innerHeight);
        };
        fit();
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, []);

    // Таймер слайда, прокрутка скриншотов и полоска прогресса — каждый кадр
    useEffect(() => {
        let raf = 0;
        let last = performance.now();
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);
            const dt = Math.min(64, now - last);
            last = now;
            const stage = stageRef.current;
            if (!stage || document.hidden || !visible.current) return;

            const i = indexRef.current;
            const slide = slides[i];
            if (!slide) return;
            if (!drag.current && !reduceMotion) elapsed.current += dt;
            const p = Math.min(1, elapsed.current / (slide.dur * 1000));
            const t = easeInOutQuad(Math.min(1, Math.max(0, (p - 0.08) / 0.84)));

            const el = slideRefs.current[i];
            el?.querySelectorAll<HTMLImageElement>('[data-pan]').forEach((img) => {
                const max = Math.max(0, img.offsetHeight - (img.parentElement?.clientHeight ?? 0));
                const a = +(img.dataset.from ?? 0), b = +(img.dataset.to ?? 1);
                img.style.transform = `translate3d(0,${(-max * (a + (b - a) * t)).toFixed(1)}px,0)`;
            });
            el?.querySelectorAll<HTMLImageElement>('[data-kb]').forEach((img) => {
                img.style.transform = `scale(${(1 + 0.07 * p).toFixed(4)})`;
            });
            const bar = barRefs.current[i];
            if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;

            if (p >= 1 && !reduceMotion) go(i + 1, 1);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [slides, reduceMotion, go]);

    // Слайды вне экрана не крутятся и видео не играет
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const io = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; }, { threshold: 0 });
        io.observe(stage);
        return () => io.disconnect();
    }, []);

    // Видео текущего слайда играет без звука, остальные стоят
    useEffect(() => {
        slideRefs.current.forEach((el, j) => {
            const video = el?.querySelector('video');
            if (!video) return;
            if (j === index && !reduceMotion) video.play().catch(() => {});
            else video.pause();
        });
    }, [index, reduceMotion]);

    // Смена слайда: новый въезжает сбоку из уменьшенного, старый отъезжает назад и темнеет
    useLayoutEffect(() => {
        const from = prevIndex.current, to = index;
        prevIndex.current = index;
        const D = reduceMotion ? 0 : TRANSITION_MS, d = dir.current;

        barRefs.current.forEach((bar, j) => {
            if (bar) bar.style.transform = `scaleX(${j < to ? 1 : 0})`;
        });

        slideRefs.current.forEach((el, j) => {
            if (!el) return;
            const inner = el.firstElementChild as HTMLElement;
            if (j === to) {
                el.style.visibility = 'visible';
                el.style.zIndex = '2';
                if (from === to) return;
                el.querySelectorAll<HTMLImageElement>('[data-pan]').forEach((img) => {
                    const max = Math.max(0, img.offsetHeight - (img.parentElement?.clientHeight ?? 0));
                    img.style.transform = `translate3d(0,${(-max * +(img.dataset.from ?? 0)).toFixed(1)}px,0)`;
                });
                el.querySelectorAll<HTMLImageElement>('[data-kb]').forEach((img) => { img.style.transform = ''; });
                inner.style.transition = 'none';
                inner.style.transform = `translate3d(${d * 70}%,0,0) scale(0.92)`;
                inner.style.opacity = '0';
                inner.style.filter = 'none';
                void inner.offsetWidth;
                inner.style.transition = `transform ${D}ms ${TRANSITION_EASE}, opacity ${D * 0.6}ms ease ${D * 0.1}ms`;
                inner.style.transform = 'none';
                inner.style.opacity = '1';
            } else if (j === from) {
                el.style.visibility = 'visible';
                el.style.zIndex = '1';
                inner.style.transition = `transform ${D}ms ${TRANSITION_EASE}, filter ${D}ms ease, opacity ${D * 0.5}ms ease ${D * 0.5}ms`;
                inner.style.transform = `translate3d(${-d * 10}%,0,0) scale(0.84)`;
                inner.style.filter = 'brightness(0.4)';
                inner.style.opacity = '0';
            } else {
                inner.style.transition = 'none';
                el.style.visibility = 'hidden';
                el.style.zIndex = '0';
            }
        });

        if (from === to) return;
        // После перехода прячем ушедший слайд и возвращаем ему исходный вид
        const timer = setTimeout(() => {
            slideRefs.current.forEach((el, j) => {
                if (!el || j === indexRef.current) return;
                const inner = el.firstElementChild as HTMLElement;
                inner.style.transition = 'none';
                inner.style.transform = 'none';
                inner.style.filter = 'none';
                inner.style.opacity = '1';
                el.style.visibility = 'hidden';
                el.style.zIndex = '0';
            });
        }, D + 80);
        return () => clearTimeout(timer);
    }, [index, reduceMotion]);

    // Свайп: отпускание ловим на window, палец может уйти за пределы слайдера
    useEffect(() => {
        const onUp = (e: globalThis.PointerEvent) => {
            const start = drag.current;
            drag.current = null;
            if (!start || e.type === 'pointercancel') return;
            const dx = e.clientX - start.x, dy = e.clientY - start.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(indexRef.current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        };
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        return () => {
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [go]);

    const onPointerDown = (e: PointerEvent) => {
        if (e.button === 0) drag.current = { x: e.clientX, y: e.clientY };
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); go(indexRef.current + 1, 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(indexRef.current - 1, -1); }
    };

    const tint = slideTint(accent);

    return (
        <section
            ref={heroRef}
            className={s.hero}
            aria-roledescription="карусель"
            aria-label="Макеты проекта"
            tabIndex={0}
            onKeyDown={onKeyDown}
        >
            <motion.div
                ref={stageRef}
                className={s.stage}
                onPointerDown={onPointerDown}
                style={{ background: `linear-gradient(${tint},${tint}), #1a1a1a`, scale: reduceMotion ? 1 : stageScale }}
            >
                {slides.map((slide, j) => (
                    <div
                        key={j}
                        ref={(el) => { slideRefs.current[j] = el; }}
                        className={s.slide}
                        style={{ visibility: j === 0 ? 'visible' : 'hidden', zIndex: j === 0 ? 2 : 0 }}
                        aria-hidden={j !== index}
                    >
                        <div className={s.inner}>
                            <SlideContent slide={slide} first={j === 0} />
                        </div>
                    </div>
                ))}

                <div className={s.shade} aria-hidden="true" />

                <motion.div
                    className={s.ui}
                    style={reduceMotion ? undefined : { y: uiY, opacity: uiOpacity }}
                >
                    <div className={s.top}>
                        <PortfolioLink href={portfolioPageURL} className={s.back}>
                            <span className={s.backArrow} aria-hidden="true">←</span>Портфолио
                        </PortfolioLink>
                        <nav aria-label="Breadcrumb" className={s.crumbs}>
                            <Link href="/">Главная</Link>
                            <span aria-hidden="true">/</span>
                            <PortfolioLink href={portfolioPageURL}>Портфолио</PortfolioLink>
                            <span aria-hidden="true">/</span>
                            <span className={s.current} aria-current="page">{name}</span>
                        </nav>
                        {url && (
                            <a href={url} target="_blank" rel="noopener" className={s.siteLink} aria-label="Открыть сайт">
                                <span className={s.desk}>Открыть сайт</span>
                                <span className={s.mob}>Сайт</span>
                                <span aria-hidden="true">↗</span>
                            </a>
                        )}
                    </div>

                    <div className={s.bottom}>
                        <div className={s.meta}>
                            <span>{year}</span><span aria-hidden="true">·</span><span>{kind}</span>
                            <span className={s.desk} aria-hidden="true">·</span><span className={s.desk}>{role}</span>
                        </div>
                        <h1 className={`${allerta.className} ${s.title}`}>
                            <span className={s.desk}>{headline}</span>
                            <span className={s.mob}>{name}</span>
                        </h1>
                        <ul className={s.tags}>
                            {tags.map((tag) => <li key={tag} className={s.tag}>{tag}</li>)}
                        </ul>
                        <span className={s.caption} aria-live="polite">{slides[index]?.caption}</span>

                        <div className={s.tabsRow}>
                            <div className={s.tabs} role="tablist" aria-label="Слайды">
                                {slides.map((slide, j) => (
                                    <button
                                        key={j}
                                        type="button"
                                        role="tab"
                                        aria-selected={j === index}
                                        aria-label={slide.caption}
                                        className={`${s.tab} ${j === index ? s.tabActive : ''}`}
                                        onClick={() => go(j)}
                                    >
                                        <span className={s.track}>
                                            <span ref={(el) => { barRefs.current[j] = el; }} className={s.fill} />
                                        </span>
                                        <span className={s.desk}>{slide.caption}</span>
                                    </button>
                                ))}
                            </div>
                            {count > 1 && (
                                <div className={s.controls}>
                                    <span className={`${allerta.className} ${s.counter}`}>{pad(index + 1)} / {pad(count)}</span>
                                    <button type="button" aria-label="Предыдущий слайд" className={s.arrow} onClick={() => go(index - 1, -1)}>←</button>
                                    <button type="button" aria-label="Следующий слайд" className={`${s.arrow} ${s.arrowNext}`} onClick={() => go(index + 1, 1)}>→</button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    )
}

export default CaseHero
