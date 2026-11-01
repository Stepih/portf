"use client";

import { CSSProperties, FC, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, MotionValue, useMotionValueEvent, useTransform } from "framer-motion";

import sc from '@/app/ai/components/scene.module.scss'
import x from './Scenes.module.scss'
import s from './CasesDeck.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { easeOut, lerp, move, offsetIn, rise, span, useStickyScene, useValue } from "@/app/ai/components/scene";
import { portfolioPageURL } from "@/constants/urls";
import { casesDeck } from "@/data/sitesPage";
import { IWindowEls, windowEls, windowFade, windowTook } from "./handoff";
import { useRemeasure } from "./useRemeasure";
import { cardIn, cardOut, deckTimes, IDeckTimes, slideAt, W } from "./times";

export interface IDeckCase {
    id: string,
    name: string,
    cover: string,
    // Виды сайта, в разделах которых кейс стоит («Лендинг», «Сайт компании»)
    kinds: string[],
    text?: string
}

interface IBox { x: number, y: number, w: number, h: number }
const box0: IBox = { x: 0, y: 0, w: 0, h: 0 };
const mix = (a: IBox, b: IBox, k: number): IBox => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });
const k = (v: number, [a, d]: W) => d > 0 ? span(v, a, d) : (v >= a ? 1 : 0);

// Замеры без transform, от левого верха экрана колоды: окно сцены окна (если стык есть) и места карточек
interface IGeo { win: IBox | null, left: IBox, right: IBox, h: number }
const geo0: IGeo = { win: null, left: box0, right: box0, h: 900 };

// Пустая карточка-фон: frost, тень и скругление – как у окна. На стыке лежит точь-в-точь на окне (прозрачная, как оно),
// по пути на своё место под стеклом проступает цвет страницы (solid) – как у карточек AgentDeck: вторая карточка
// выезжает из-под первой и не просвечивает
const Shell: FC<{ box: MotionValue<IBox>, opacity: MotionValue<number>, solid: MotionValue<number>, z: number }> = ({ box, opacity, solid, z }) => {
    const top = useTransform(box, (b) => b.y);
    const left = useTransform(box, (b) => b.x);
    const width = useTransform(box, (b) => b.w);
    const height = useTransform(box, (b) => b.h);
    return (
        <motion.span className={s.shell} style={{ top, left, width, height, opacity, zIndex: z }} aria-hidden="true">
            <motion.span className={s.shellBg} style={{ opacity: solid }} />
            <span className={s.shellFrost} />
        </motion.span>
    );
};

interface IRow {
    time: MotionValue<number>,
    t: IDeckTimes,
    j: number,
    r: number,
    animated: boolean,
    className?: string,
    children: ReactNode
}

// Строка карточки: въезжает снизу с проявлением в начале слайда, в конце уходит вверх, тая (как строки AgentDeck)
const Row: FC<IRow> = ({ time, t, j, r, animated, className, children }) => {
    const state = useTransform(time, (v) => {
        const out = cardOut(t, j, r);
        return { in: k(v, cardIn(t, j, r)), out: out ? k(v, out) : 0 };
    });
    const opacity = useTransform(state, (st) => easeOut(st.in) * (1 - st.out));
    const y = useTransform(state, (st) => 18 * (1 - rise(st.in)) - 18 * move(st.out));
    return <motion.div className={className} style={animated ? { opacity, y } : undefined}>{children}</motion.div>;
};

interface ICard {
    item: IDeckCase,
    time: MotionValue<number>,
    t: IDeckTimes,
    j: number,
    side: number,
    sticky: boolean,
    live: boolean,
    cellRef?: (el: HTMLLIElement | null) => void
}

// Карточка кейса: крупный скриншот, вид сайта, название-ссылка на страницу кейса (растянута на карточку), подпись
const Card: FC<ICard> = ({ item, time, t, j, side, sticky, live, cellRef }) => {
    const row = { time, t, j, animated: sticky };
    return (
        <li
            ref={cellRef}
            className={`${s.card} ${sticky ? s.stacked : s.plate} ${live ? s.live : ''}`}
            style={sticky ? { gridColumn: side + 1 } as CSSProperties : undefined}
            inert={sticky && !live ? true : undefined}
        >
            <Row {...row} r={0} className={s.shot}>
                <Image src={item.cover} alt="" fill sizes="(max-width: 700px) 100vw, 540px" className={s.image} />
            </Row>
            <Row {...row} r={1} className={s.kind}>{item.kinds.join(' · ')}</Row>
            <Row {...row} r={2} className={s.nameRow}>
                <h3 className={`${ralewayBold.className} ${s.name}`}>
                    <Link href={`${portfolioPageURL}/${item.id}`} className={s.link}>{item.name}</Link>
                </h3>
                <span className={`${ralewayBold.className} ${s.more}`} aria-hidden="true">{casesDeck.link}<i className={s.chevron} /></span>
            </Row>
            {item.text && <Row {...row} r={3}><p className={s.text}>{item.text}</p></Row>}
        </li>
    );
};

// Полоска слайда: заполняется по ходу своего слайда; клик – к слайду
const Dot: FC<{ time: MotionValue<number>, t: IDeckTimes, j: number, active: boolean, onPick: (j: number) => void }> = ({ time, t, j, active, onPick }) => {
    const fill = useTransform(time, (v) => span(v, t.first + j * t.slide, t.slide));
    return (
        <button
            type="button"
            className={s.dot}
            aria-label={casesDeck.slide(j + 1, t.slides)}
            aria-current={active ? 'true' : undefined}
            onClick={() => onPick(j)}
        >
            <span className={s.track}><motion.span className={s.fill} style={{ scaleX: fill }} /></span>
        </button>
    );
};

// «Так уже сделано» (SERVICES_PLAN У5б, этап 2) – колода кейсов, как AgentDeck на /ai: две карточки рядом (на телефоне
// одна), слайд на ~0,75 экрана – строки уходят вверх, снизу входят следующие, полоски слайдов внизу. Стык с окном
// (scenes/handoff.ts): липкий экран колоды ложится поверх последнего экрана сцены окна; в окне гаснет собранный магазин
// и строка с ценой, рамку окна сменяет пустая карточка колоды, едет на место левой, из-под неё выезжает правая.
// Без сцены окна – карточки проявляются на местах. При reduced-motion – сетка карточек
const CasesDeck: FC<{ cases: IDeckCase[] }> = ({ cases }) => {
    const reduceMotion = usePrefersReducedMotion();
    const phone = useMediaQuery('(max-width: 700px)');
    const per = phone ? 1 : 2;
    const slides = Math.ceil(cases.length / per);
    const els = useValue(windowEls);
    const joined = !!els && !reduceMotion;

    const scene = useRef<HTMLElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const cells = useRef<(HTMLLIElement | null)[]>([]);
    const [g, setG] = useState<IGeo>(geo0);

    const measureGeo = useCallback((w: IWindowEls | null) => {
        const scr = screen.current;
        if (!scr) return;
        const boxOf = (el: HTMLElement | null | undefined, root: HTMLElement): IBox => {
            if (!el) return box0;
            const at = offsetIn(el, root);
            return { x: at.x, y: at.y, w: el.offsetWidth, h: el.offsetHeight };
        };
        const left = boxOf(cells.current[0], scr);
        const right = per > 1 ? boxOf(cells.current[1], scr) : left;
        setG({ win: w ? boxOf(w.win, w.screen) : null, left, right, h: scr.offsetHeight || window.innerHeight });
    }, [per]);
    const onMeasure = useCallback(() => measureGeo(windowEls.get()), [measureGeo]);
    const { progress, scrollToProgress, measure } = useStickyScene({ scene, path, screen }, onMeasure);
    useRemeasure(scene, measure);
    useEffect(() => { measureGeo(els) }, [els, measureGeo]);

    const joinedNow = joined && !!g.win;
    const dist = (a: IBox, b: IBox) => Math.max(Math.hypot(b.x - a.x, b.y - a.y), Math.abs(b.w - a.w), Math.abs(b.h - a.h));
    const t = deckTimes(slides, phone, joinedNow, g.win ? dist(g.win, g.left) : 0, g.win && per > 1 ? dist(g.win, g.right) : 0, g.h);
    const time = useTransform(progress, (p) => p * t.path);

    // Стык: окно гаснет, рамку забирает колода. Без стыка значения – по нулям
    const [fadeFrom, fadeDur] = t.fade;
    const sync = useCallback((v: number) => {
        windowFade.set(joinedNow ? k(v, [fadeFrom, fadeDur]) : 0);
        windowTook.set(joinedNow && v >= t.took ? 1 : 0);
    }, [joinedNow, fadeFrom, fadeDur, t.took]);
    useMotionValueEvent(time, 'change', sync);
    useEffect(() => {
        sync(time.get());
        return () => {
            windowFade.set(0);
            windowTook.set(0);
        };
    }, [sync, time]);

    const [active, setActive] = useState(0);
    useMotionValueEvent(time, 'change', (v) => setActive(v >= t.first - .08 ? slideAt(t, v) : -1));

    // Окно делится на две карточки: обе – с места окна на свои места (каждая своим путём, скорость – в пределе),
    // правая – из-под левой
    const leftBox = useTransform(time, (v): IBox => g.win && joinedNow ? mix(g.win, g.left, move(k(v, t.split))) : g.left);
    const rightBox = useTransform(time, (v): IBox => g.win && joinedNow ? mix(g.win, g.right, move(k(v, t.emerge))) : g.right);
    const leftOn = useTransform(time, (v) => joinedNow ? (v >= t.took ? 1 : 0) : easeOut(k(v, t.show)));
    // Под стеклом левой карточки быстро проступает цвет страницы (пока она почти не сдвинулась), и только тогда под
    // ней появляется правая: два прозрачных стекла друг на друге дали бы тёмное пятно
    const solid = useTransform(time, (v) => joinedNow ? span(v, t.took, .04) : 1);
    const rightOn = useTransform(time, (v) => joinedNow ? (v >= t.took + .05 ? 1 : 0) : easeOut(k(v, t.show)));
    const headOn = useTransform(time, (v) => easeOut(span(v, t.head, .14)));
    const headY = useTransform(time, (v) => 18 * (1 - rise(span(v, t.head, .14))));
    const barsOn = useTransform(time, (v) => span(v, t.first, .1));

    const onPick = useCallback((j: number) => scrollToProgress((t.first + j * t.slide + .3) / t.path), [scrollToProgress, t.first, t.slide, t.path]);

    const title = (
        <>
            <h2 id="cases-title" className={`${ralewayBold.className} ${x.title}`}>{casesDeck.title}</h2>
            <p className={x.description}>{casesDeck.text}</p>
        </>
    );

    // ---------- Без движения: сетка карточек ----------
    if (reduceMotion) {
        return (
            <section className={x.flat} aria-labelledby="cases-title">
                {title}
                <ul className={s.grid}>
                    {cases.map((item, i) => (
                        <Card key={item.id} item={item} time={time} t={t} j={0} side={i % 2} sticky={false} live />
                    ))}
                </ul>
            </section>
        );
    }

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${s.scene} ${joinedNow ? s.joined : ''}`}
            style={{ '--scene-h': `calc(var(--screen-h) * ${t.path + 1})` } as CSSProperties}
            aria-labelledby="cases-title"
        >
            <div ref={path} className={sc.path} aria-hidden="true" />
            <div ref={screen} className={sc.screen}>
                <Shell box={leftBox} opacity={leftOn} solid={solid} z={2} />
                {per > 1 && <Shell box={rightBox} opacity={rightOn} solid={solid} z={1} />}
                <div className={s.wrap}>
                    <motion.div className={s.head} style={{ opacity: headOn, y: headY }}>{title}</motion.div>
                    <ul className={s.pair}>
                        {cases.map((item, i) => (
                            <Card
                                key={item.id}
                                item={item}
                                time={time}
                                t={t}
                                j={Math.floor(i / per)}
                                side={i % per}
                                sticky
                                live={Math.floor(i / per) === active}
                                cellRef={i < per ? (el) => { cells.current[i] = el } : undefined}
                            />
                        ))}
                    </ul>
                    <motion.div className={`${s.dots} ${active >= 0 ? s.live : ''}`} style={{ opacity: barsOn }}>
                        {Array.from({ length: slides }, (_, j) => (
                            <Dot key={j} time={time} t={t} j={j} active={j === active} onPick={onPick} />
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default CasesDeck;
