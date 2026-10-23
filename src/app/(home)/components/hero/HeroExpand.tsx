"use client";

import { CSSProperties, FC, FocusEvent, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cubicBezier, easeIn, easeOut, motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import photo from '@/assets/_img/rectangles/title-page/i.png'

import s from './HeroExpand.module.scss'
import HeroSlides from "./HeroSlides";
import { SceneAfterContext } from "./sceneAfter";
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { popupPageURL, portfolioPageURL } from "@/constants/urls";
import { formButton, heroInterval, heroPrice, heroPriceNote, heroSlides, heroTitleSlide, industriesDescription, industriesOther, industriesTitle } from "@/data/offer";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { PortfolioIndustry } from "@/interfaces/portfolio";
import { withIndustry } from "@/scripts/portfolioIndustry";
import { plural } from "@/scripts/portfolioStats";

interface HeroExpandProps {
    chips: { id: PortfolioIndustry, label: string, count: number }[],
    // Сколько работ в портфолио, число в кружке над заголовком
    worksCount: number,
    // Блок после сцены («Избранные кейсы»): виден сквозь дыру портала и стоит на месте, пока она открывается
    children?: ReactNode
}

// Путь портала в экранах: диск растёт из кружка вместе с надписью «10 работ» (PORTAL_GROW), стоит с ней
// (PORTAL_HOLD), потом в нём открывается дыра и уходит за края экрана (PORTAL_OPEN)
const PORTAL_GROW = .1;
const PORTAL_HOLD = .05;
const PORTAL_OPEN = .3;
const PORTAL_PATH = PORTAL_GROW + PORTAL_HOLD + PORTAL_OPEN;

// Точки сцены в экранах прокрутки: раскрытие, брызги отраслей (с SHOW_AT, путь BURST_PATH),
// чипы стоят CHIPS_HOLD, чтобы по ним успели кликнуть, потом портал.
// Волна заголовка начинается внахлёст с концом полёта фото, а не после него: иначе экран стоит пустым
// с одним кружком (DESIGN_FIXES_2_PLAN, Д9)
const EXPAND_FROM = .024;
const EXPAND_TO = .36;
const SHOW_AT = .24;
const BURST_PATH = .4;
const CHIPS_HOLD = .15;
// Запас после брызг до чипов на месте
const BURST_TAIL = .05;

// Во сколько раз длиннее путь сцены: доводки нет, этапы проходятся скроллом.
// Раскрытие ~0,35 экрана, брызги ~0,4, портал ~0,45 (DESIGN_FIXES_PLAN, Д1: цены не дальше ~2,5 экрана)
const PACE = 1;
// Путь после портала, в экранах: кейсы ещё прилипают, скролл раздаёт их из колоды (SceneAfterContext)
const AFTER = .3;

// Телефон (≤700px, как у распорки .after): кейсы в столбик длиннее экрана, и до цен далеко.
// Чипы стоят меньше, а вся сцена проходится быстрее (DESIGN_FIXES_2_PLAN, Д7). Ширина – та же, что в @media стилей .scene и .nextTrack
const PHONE_QUERY = '(max-width: 700px)';
const PHONE_CHIPS_HOLD = .05;
const PHONE_PACE = .75;

// Точки сцены в долях её прокрутки и длина сцены в экранах
const timing = (chipsHold: number) => {
    const portalFrom = SHOW_AT + BURST_TAIL + BURST_PATH + chipsHold;
    const length = portalFrom + PORTAL_PATH;
    return {
        length,
        expandFrom: EXPAND_FROM / length,
        expandTo: EXPAND_TO / length,
        burstFrom: SHOW_AT / length,
        burstTo: (SHOW_AT + BURST_PATH) / length,
        portalFrom: portalFrom / length,
    };
};
const DESKTOP_TIMING = timing(CHIPS_HOLD);
const PHONE_TIMING = timing(PHONE_CHIPS_HOLD);

// Сглаживание прогресса: щелчки колеса мыши не дёргают анимацию. Без перелёта, догоняет за ~0,3 с
const SMOOTH = { stiffness: 170, damping: 30, restDelta: .0001 };

const ease = cubicBezier(.4, 0, .2, 1);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Отступ края фона: от отступа карточки при t = 0 до нуля при t = 1
const useInset = (t: MotionValue<number>, edge: MotionValue<number>) =>
    useTransform([t, edge], ([p, e]: number[]) => e * (1 - p));

// Сдвиг или масштаб фото: от 0 (или 1) при t = 0 до цели при t = 1
const useToward = (t: MotionValue<number>, target: MotionValue<number>, from = 0) =>
    useTransform([t, target], ([p, v]: number[]) => from + (v - from) * p);

// Положение элемента внутри root без transform: сумма offsetLeft/Top по цепочке offsetParent
const offsetIn = (el: HTMLElement, root: HTMLElement) => {
    let x = 0;
    let y = 0;
    let node: HTMLElement | null = el;
    while (node && node !== root) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
    }
    return { x, y };
};

// Портал: off – не начался, on – идёт, open – дыра почти на весь экран, клики проходят к блоку под сценой
type PortalState = 'off' | 'on' | 'open';

// ---------- Брызги из круга, по скроллу ----------
// Таймлайн в секундах, но время берётся из скролла: весь путь брызг (BURST_PATH) – вся их длительность.
// Скролл назад проигрывает их в обратную сторону теми же кадрами

// Капля летит FLIGHT, растекается в пилюлю SPREAD и растворяется в чип FADE; волна от кружка идёт WAVE, с
const FLIGHT = .7;
const SPREAD = .35;
const FADE = .3;
const WAVE = .9;
// Размер капли в полёте и подъём дуги над стартом, px
const DROP = 12;
const LIFT = 48;
// Капли вылетают по очереди
const chipDelay = (i: number) => .2 + i * .05;

// Длительность брызг, с: до конца последней капли и строки «Другая сфера?»
const burstLength = (count: number) => {
    const last = chipDelay(Math.max(0, count - 1));
    return Math.max(last + FLIGHT + SPREAD + FADE, last + FLIGHT + .2 + .5);
};

// Чип относительно кружка: сдвиг от места чипа до центра кружка и размер чипа
interface ChipGeom { i: number, dx: number, dy: number, w: number, h: number }
// Волна по заголовку и подписи: центр кружка относительно их блока, радиус кружка и до какого радиуса волна растёт
interface WaveGeom { x: number, y: number, from: number, to: number }

const noWave: WaveGeom = { x: 0, y: 0, from: 0, to: 0 };

const circle = (r: number, { x, y }: WaveGeom) => `circle(${r}px at ${x}px ${y}px)`;
// Капля – тёмная пилюля поверх чипа, в полёте обрезана до точки
const dot = ({ w, h }: ChipGeom) => `inset(${(h - DROP) / 2}px ${(w - DROP) / 2}px round 24px)`;

const flyEase = cubicBezier(.3, .5, .5, 1);
const spreadEase = cubicBezier(.2, .9, .3, 1);
const waveEase = cubicBezier(.2, .6, .3, 1);
const riseEase = cubicBezier(.2, .8, .2, 1);
// Доля отрезка [from, from + dur] к моменту time
const span = (time: number, from: number, dur: number) => clamp01((time - from) / dur);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
// Значение по ключевым кадрам, между кадрами – по прямой
const keys = (k: number, values: number[], times: number[]) => {
    for (let i = 1; i < times.length; i++) {
        if (k <= times[i]) return lerp(values[i - 1], values[i], (k - times[i - 1]) / (times[i] - times[i - 1]));
    }
    return values[values.length - 1];
};

// Заголовок и подпись проявляются кругом, который расходится от кружка; кружок вздрагивает
const waveFrame = (time: number, g: WaveGeom) => {
    const k = span(time, .05, WAVE);
    const r = lerp(g.from, g.to, waveEase(k));
    return {
        clip: circle(r, g),
        lead: time >= .05 ? 1 : 0,
        pulse: keys(span(time, 0, .6), [1, 1.1, .97, 1], [0, .3, .65, 1]),
    };
};

// Чип в момент time: полёт из кружка по дуге, как из фонтана, капля растекается в пилюлю и растворяется, чип проступает
const chipFrame = (time: number, g: ChipGeom) => {
    const d = chipDelay(g.i);
    const f = span(time, d, FLIGHT);
    const spread = spreadEase(span(time, d + FLIGHT - .05, SPREAD));
    return {
        x: g.dx * (1 - flyEase(f)),
        y: f < .4 ? g.dy - LIFT * easeOut(f / .4) : (g.dy - LIFT) * (1 - easeIn((f - .4) / .6)),
        clip: `inset(${(g.h - DROP) / 2 * (1 - spread)}px ${(g.w - DROP) / 2 * (1 - spread)}px round 24px)`,
        drop: time < d ? 0 : 1 - span(time, d + FLIGHT + SPREAD, FADE),
        face: easeOut(span(time, d + FLIGHT + .1, .35)),
    };
};

interface ScrubChipProps {
    // Время брызг, с
    time: MotionValue<number>,
    geom: ChipGeom,
    itemRef: (el: HTMLLIElement | null) => void,
    children: ReactNode
}

// Чип брызг: кадр считается из времени, без своих анимаций
const ScrubChip: FC<ScrubChipProps> = ({ time, geom, itemRef, children }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const clip = useMotionValue(dot(geom));
    const drop = useMotionValue(0);
    const face = useMotionValue(0);

    const paint = useCallback((v: number) => {
        const f = chipFrame(v, geom);
        x.set(f.x);
        y.set(f.y);
        clip.set(f.clip);
        drop.set(f.drop);
        face.set(f.face);
    }, [geom, x, y, clip, drop, face]);
    useMotionValueEvent(time, 'change', paint);
    useEffect(() => paint(time.get()), [paint, time]);

    return (
        <motion.li ref={itemRef} className={s.chipItem} style={{ x, y }}>
            <motion.span className={s.drop} style={{ clipPath: clip, opacity: drop }} aria-hidden="true" />
            <motion.div style={{ opacity: face }}>{children}</motion.div>
        </motion.li>
    );
};

// ---------- Круг-портал ----------

// Доли пути портала: к DISK_TO диск дорос, на OPEN_AT в нём открывается дыра; между ними он стоит с надписью
const DISK_TO = PORTAL_GROW / PORTAL_PATH;
const OPEN_AT = (PORTAL_GROW + PORTAL_HOLD) / PORTAL_PATH;
// Диск до открытия дыры: радиус, px, но не больше доли ширины экрана
const DISK = 150;
const DISK_SHARE = .3;
// Знак «10 работ», выросший с диском, гаснет за эту долю пути портала после открытия дыры
const MARK_FADE = .1;
// Кольцо между дырой и краем диска гаснет в этом отрезке пути дыры (доли от открытия до конца),
// пока оно ещё толстое: не сжимается в волосяную дугу (DESIGN_FIXES_2_PLAN, Д9)
const RING_FADE_FROM = .3;
const RING_FADE_TO = .7;

// Первый экран главной (SALES_PLAN 3.1), блок отраслей (3.2) и вход в «Избранные кейсы» одной сценой
// (ANIMATION_PLAN, 1Г + 2Г). Всё ведёт скролл, вперёд и назад, без доводки.
// Сцена высотой в несколько экранов, внутри липкий экран. Фон карточки раскрывается до краёв окна,
// фото летит в кружок над заголовком и перетекает в число работ. Из кружка расходится волна с заголовком,
// чипы вылетают каплями и растекаются по местам. Дальше кружок растёт в диск, в нём открывается дыра,
// сквозь неё видны кейсы; дыра уходит за края экрана, а кейсы ещё прилипают, пока скролл раздаёт их из колоды.
// Чип ведёт на /portfolio?for=<id>, отрасли без работ не показываются
const HeroExpand: FC<HeroExpandProps> = ({ chips, worksCount, children }) => {
    const reduceMotion = usePrefersReducedMotion();
    const tm = useMediaQuery(PHONE_QUERY) ? PHONE_TIMING : DESKTOP_TIMING;

    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const card = useRef<HTMLDivElement>(null);
    const photoBox = useRef<HTMLDivElement>(null);
    const slot = useRef<HTMLDivElement>(null);
    const root = useRef<HTMLDivElement>(null);
    const lead = useRef<HTMLDivElement>(null);
    const chipEls = useRef<(HTMLLIElement | null)[]>([]);
    const [portalState, setPortalState] = useState<PortalState>('off');
    // Путь после портала: распорка в треке кейсов (на телефоне её нет – высота 0) и доля пути
    const afterEl = useRef<HTMLDivElement>(null);
    const afterProgress = useMotionValue(0);
    const [afterOn, setAfterOn] = useState(false);
    const smoothAfter = useSpring(afterProgress, SMOOTH);
    // Блок кейсов и его отступ липкости: по центру экрана, если короче него (на телефоне длиннее – 0)
    const nextEl = useRef<HTMLDivElement>(null);
    const [nextTop, setNextTop] = useState(0);
    const [waveGeom, setWaveGeom] = useState<WaveGeom>(noWave);
    const [chipGeoms, setChipGeoms] = useState<ChipGeom[]>([]);

    const { scrollYProgress: rawProgress } = useScroll({ target: scene, offset: ['start start', 'end end'] });
    // Анимация идёт за сглаженным прогрессом; сам скролл страницы не трогаем
    const scrollYProgress = useSpring(rawProgress, SMOOTH);
    const t = useTransform(scrollYProgress, [tm.expandFrom, tm.expandTo], [0, 1], { ease, clamp: true });

    // Отступы карточки от краёв липкого экрана, меряются при загрузке и ресайзе
    const top = useMotionValue(0);
    const right = useMotionValue(0);
    const bottom = useMotionValue(0);
    const left = useMotionValue(0);
    // Куда едет фото: сдвиг до кружка над заголовком и масштаб под его размер
    const photoDx = useMotionValue(0);
    const photoDy = useMotionValue(0);
    const photoScale = useMotionValue(1);
    // Портал: центр и радиус кружка в координатах экрана, диск до дыры, радиус до дальнего угла
    const cx = useMotionValue(0);
    const cy = useMotionValue(0);
    const r0 = useMotionValue(0);
    const diskMax = useMotionValue(DISK);
    const rMax = useMotionValue(0);

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
            if (!screen.current || !card.current || !photoBox.current || !scene.current) return;
            scene.current.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
            const box = screen.current.getBoundingClientRect();
            // offsetTop/Left не видят transform, поэтому уехавшие слайды и фото не сбивают замер
            const c = card.current;
            top.set(c.offsetTop);
            left.set(c.offsetLeft);
            right.set(box.width - c.offsetLeft - c.offsetWidth);
            bottom.set(box.height - c.offsetTop - c.offsetHeight);

            if (!slot.current) return;
            const p = photoBox.current.getBoundingClientRect();
            const target = slot.current.getBoundingClientRect();
            photoDx.set(target.left + target.width / 2 - (p.left + p.width / 2));
            photoDy.set(target.top + target.height / 2 - (p.top + p.height / 2));
            photoScale.set(target.width / p.width);

            // Портал: кружок в координатах липкого экрана
            const x = target.left + target.width / 2 - box.left;
            const y = target.top + target.height / 2 - box.top;
            cx.set(x);
            cy.set(y);
            r0.set(target.width / 2);
            diskMax.set(Math.min(DISK, box.width * DISK_SHARE));
            rMax.set(Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) + 2);

            // Брызги: где заголовок и чипы относительно кружка
            if (!root.current || !lead.current) return;
            const r = root.current;
            const o = offsetIn(slot.current, r);
            const sx = o.x + slot.current.offsetWidth / 2;
            const sy = o.y + slot.current.offsetHeight / 2;
            const l = offsetIn(lead.current, r);
            const lx = sx - l.x;
            const ly = sy - l.y;
            setWaveGeom({
                x: lx,
                y: ly,
                from: slot.current.offsetWidth / 2,
                to: Math.hypot(Math.max(lx, lead.current.offsetWidth - lx), lead.current.offsetHeight - ly) + 8,
            });
            setChipGeoms(chipEls.current.map((el, i) => {
                if (!el) return { i, dx: 0, dy: 0, w: 0, h: 0 };
                const ch = offsetIn(el, r);
                return {
                    i,
                    dx: sx - (ch.x + el.offsetWidth / 2),
                    dy: sy - (ch.y + el.offsetHeight / 2),
                    w: el.offsetWidth,
                    h: el.offsetHeight,
                };
            }));
        };
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        [screen.current, card.current, photoBox.current, slot.current, root.current, lead.current]
            .forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, [reduceMotion, top, right, bottom, left, photoDx, photoDy, photoScale, cx, cy, r0, diskMax, rMax]);

    // Доля пути портала
    const q = useTransform(scrollYProgress, (p) => clamp01((p - tm.portalFrom) / (1 - tm.portalFrom)));

    // На подлёте к кружку фото перетекает в знак: фото гаснет, знак проявляется и дорастает до размера.
    // В портале знак с надписью растёт вместе с диском и гаснет, когда в диске открывается дыра
    const photoOpacity = useTransform(t, [.7, 1], [1, 0]);
    const markIn = useTransform(t, [.7, 1], [0, 1]);
    const markOut = useTransform(q, (v) => 1 - clamp01((v - OPEN_AT) / MARK_FADE));
    const markOpacity = useTransform([markIn, markOut], ([a, b]: number[]) => a * b);
    const markScaleIn = useTransform(t, [.7, 1], [.6, 1]);

    const slidesOpacity = useTransform(scrollYProgress, [tm.expandFrom, tm.expandFrom + .1], [1, 0]);
    const slidesY = useTransform(scrollYProgress, [tm.expandFrom, tm.expandTo], [0, -60]);

    // Отрасли втягиваются к кружку и гаснут, пока он растёт
    const contentOpacity = useTransform(q, [0, DISK_TO], [1, 0]);
    const contentScale = useTransform(q, [0, DISK_TO * 1.1], [1, .9]);
    const contentY = useTransform(q, [0, DISK_TO * 1.1], [0, -24]);

    // Диск растёт из кружка до DISK, стоит с надписью до OPEN_AT, потом в нём открывается дыра. Дыра догоняет край диска,
    // и оба уходят за дальний угол экрана: кольцо между ними тоньшает до нуля
    const disk = useTransform([q, r0, diskMax, rMax], ([v, r, dm, rm]: number[]) => {
        if (v < OPEN_AT) return r + (dm - r) * ease(clamp01(v / DISK_TO));
        const u = (v - OPEN_AT) / (1 - OPEN_AT);
        return dm + (rm - dm) * u * u;
    });
    // Знак «10 работ» растёт вместе с диском до его размера перед дырой: круг, число и подпись – одним целым
    const markScale = useTransform([markScaleIn, q, r0, disk, diskMax], ([a, v, r, d, dm]: number[]) =>
        a * (v > 0 && r > 0 ? Math.min(d, dm) / r : 1));
    const hole = useTransform([q, diskMax, disk], ([v, dm, d]: number[]) => {
        if (v <= OPEN_AT) return 0;
        const u = (v - OPEN_AT) / (1 - OPEN_AT);
        return d - dm * (1 - u) * (1 - u);
    });
    const diskBg = useTransform([q, cx, cy, disk], ([v, x, y, d]: number[]) => v <= 0
        ? 'none'
        : `radial-gradient(circle at ${x}px ${y}px, var(--color-text-100) ${d}px, transparent ${d + 1}px)`);
    const ringOpacity = useTransform(q, (v) =>
        1 - clamp01(((v - OPEN_AT) / (1 - OPEN_AT) - RING_FADE_FROM) / (RING_FADE_TO - RING_FADE_FROM)));
    const holeMask = useTransform([hole, cx, cy], ([h, x, y]: number[]) => h <= 0
        ? 'none'
        : `radial-gradient(circle at ${x}px ${y}px, transparent ${h}px, #000 ${h + 1}px)`);
    // Сплошная подложка под фоном раскрытой карточки: кейсы не просвечивают до портала
    const baseOpacity = useTransform(t, [.8, 1], [0, 1]);

    useMotionValueEvent(q, 'change', (v) => {
        // Клики проходят к кейсам, когда дыра почти на весь экран
        setPortalState(v <= 0 ? 'off' : v < .9 ? 'on' : 'open');
    });

    // Путь после портала: сколько проехали за концом сцены, в долях распорки
    const { scrollY } = useScroll();
    const updateAfter = useCallback(() => {
        if (!scene.current || !afterEl.current) return;
        const extra = afterEl.current.offsetHeight;
        const passed = -scene.current.getBoundingClientRect().top - (scene.current.offsetHeight - window.innerHeight);
        afterProgress.set(extra > 0 ? clamp01(passed / extra) : 0);
    }, [afterProgress]);
    useMotionValueEvent(scrollY, 'change', updateAfter);
    // Есть ли путь (на телефоне распорки нет) – при загрузке и ресайзе
    useEffect(() => {
        const measure = () => {
            setAfterOn((afterEl.current?.offsetHeight ?? 0) > 0);
            updateAfter();
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [updateAfter]);
    // Высота блока меняется со шрифтами и шириной: следим за ним и за окном
    useEffect(() => {
        const el = nextEl.current;
        if (!el) return;
        const measure = () => setNextTop(Math.max(0, Math.round((window.innerHeight - el.offsetHeight) / 2)));
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        window.addEventListener('resize', measure);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [reduceMotion]);

    // Брызги: время их таймлайна, с, и кадр волны, кружка и строки «Другая сфера?»
    const burstTotal = burstLength(chips.length);
    const burstTime = useTransform(scrollYProgress, (p) => clamp01((p - tm.burstFrom) / (tm.burstTo - tm.burstFrom)) * burstTotal);
    const [burstShown, setBurstShown] = useState(false);
    const leadClip = useMotionValue('none');
    const leadOpacity = useMotionValue(0);
    const pulseScale = useMotionValue(1);
    const otherOpacity = useMotionValue(0);
    const otherY = useMotionValue(16);
    const paintBurst = useCallback((v: number) => {
        const w = waveFrame(v, waveGeom);
        leadClip.set(w.clip);
        leadOpacity.set(w.lead);
        pulseScale.set(w.pulse);
        const e = riseEase(span(v, chipDelay(chips.length - 1) + FLIGHT + .2, .5));
        otherOpacity.set(e);
        otherY.set(16 * (1 - e));
    }, [waveGeom, chips.length, leadClip, leadOpacity, pulseScale, otherOpacity, otherY]);
    useMotionValueEvent(burstTime, 'change', (v) => {
        paintBurst(v);
        setBurstShown(v >= burstTotal * .95);
    });
    useEffect(() => paintBurst(burstTime.get()), [paintBurst, burstTime]);

    // Чипы кликаются мышью, только пока видны. С клавиатуры они доступны всегда (ниже)
    const live = reduceMotion || (burstShown && portalState === 'off');

    // Клавиатура (DESIGN_FIXES_PLAN, Д3): фокус ведёт сцену. Tab к элементу, который сейчас не виден,
    // прокручивает страницу туда, где сцена его показывает; анимация догоняет за сглаженным прогрессом.
    // Только для фокуса с клавиатуры: клик мышью страницу не двигает
    const sceneSpan = () => {
        const el = scene.current;
        if (!el) return null;
        return { top: el.getBoundingClientRect().top + window.scrollY, len: el.offsetHeight - window.innerHeight };
    };
    const byKeyboard = (e: FocusEvent<HTMLElement>) => e.target.matches(':focus-visible');
    // Прогресс сцены вне [from, to] – прокрутить к at
    const holdScene = (from: number, to: number, at: number) => {
        const span = sceneSpan();
        if (!span) return;
        const p = (window.scrollY - span.top) / span.len;
        if (p < from || p > to) window.scrollTo({ top: span.top + at * span.len, behavior: 'instant' });
    };
    // Первый экран: черты слайдов и кнопка – пока карточка не начала раскрываться
    const focusHero = (e: FocusEvent<HTMLElement>) => {
        if (byKeyboard(e)) holdScene(-Infinity, tm.expandFrom, 0);
    };
    // Отрасли: брызги разлетелись, портал ещё не начался
    const focusIndustries = (e: FocusEvent<HTMLElement>) => {
        if (byKeyboard(e)) holdScene(tm.burstTo, tm.portalFrom, (tm.burstTo + tm.portalFrom) / 2);
    };
    // Кейсы: сцена кончилась и колода роздана, блок стоит на своём месте в потоке, дальше – к самой карточке
    const focusCases = (e: FocusEvent<HTMLElement>) => {
        const span = sceneSpan();
        if (!span || !byKeyboard(e)) return;
        const end = span.top + span.len + (afterEl.current?.offsetHeight ?? 0);
        if (window.scrollY < end) window.scrollTo({ top: end, behavior: 'instant' });
        (e.target.closest('article') ?? e.target).scrollIntoView({ block: 'nearest', behavior: 'instant' });
    };
    const geomOf = (i: number): ChipGeom => chipGeoms[i] ?? { i, dx: 0, dy: 0, w: 0, h: 0 };

    const chipLink = (chip: HeroExpandProps['chips'][number]) => (
        <Link
            href={withIndustry(portfolioPageURL, chip.id)}
            className={s.chip}
            data-goal="industry_click"
            data-goal-id={chip.id}
        >
            {chip.label}
            <span className={s.count}>{chip.count}</span>
        </Link>
    );

    // Призыв первого экрана (DESIGN_FIXES_PLAN Д2): одна залитая кнопка на форму и строка с ценой.
    // Вне слайдов, чтобы не сменялся вместе с ними
    const cta = (
        <div className={s.cta} data-goal-place="hero">
            <Link href={popupPageURL} className={`${ralewayBold.className} ${s.ctaButton}`}>
                {formButton}
            </Link>
            <p className={s.ctaNote}>
                <b className={ralewayBold.className}>{heroPrice}</b>
                <span className={s.ctaDot}> · </span>
                <span>{heroPriceNote}</span>
            </p>
        </div>
    );

    const industries = (
        <div
            ref={root}
            className={`${ralewayRegular.className} ${s.industries}`}
            aria-labelledby="industries-title"
            role="region"
            onFocus={focusIndustries}
        >
            {/* Кружок над заголовком: сюда прилетает фото первого экрана и превращается в число работ */}
            {!reduceMotion && (
                <div ref={slot} className={s.slot} aria-hidden="true">
                    <motion.div className={s.mark} style={{ opacity: markOpacity, scale: markScale }}>
                        <motion.span className={s.works} style={{ scale: pulseScale }}>
                            <b className={ralewayBold.className}>{worksCount}</b>
                            <span>{plural(worksCount, ['работа', 'работы', 'работ'])}</span>
                        </motion.span>
                    </motion.div>
                </div>
            )}

            <motion.div
                className={s.content}
                style={reduceMotion ? undefined : { opacity: contentOpacity, scale: contentScale, y: contentY }}
            >
                <motion.div
                    ref={lead}
                    className={s.lead}
                    style={reduceMotion ? undefined : { clipPath: leadClip, opacity: leadOpacity }}
                >
                    <h2 id="industries-title" className={`${ralewayBold.className} ${s.title}`}>{industriesTitle}</h2>
                    <p className={s.description}>{industriesDescription}</p>
                </motion.div>

                <ul className={s.chips}>
                    {chips.map((chip, i) => reduceMotion ? (
                        <li key={chip.id} className={s.chipItem}>{chipLink(chip)}</li>
                    ) : (
                        <ScrubChip key={chip.id} time={burstTime} geom={geomOf(i)} itemRef={(el) => { chipEls.current[i] = el }}>
                            {chipLink(chip)}
                        </ScrubChip>
                    ))}
                </ul>

                {/* Чипы – только примеры: клиент из другой сферы идёт сразу в форму */}
                <motion.p className={s.other} style={reduceMotion ? undefined : { opacity: otherOpacity, y: otherY }}>
                    {industriesOther}{' '}
                    <Link
                        href={popupPageURL}
                        className={s.otherLink}
                        data-goal="cta_click"
                        data-goal-id="industries_other"
                    >
                        {formButton}
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    );

    // «Уменьшить движение»: без липкой сцены, первый экран, отрасли и кейсы просто идут друг за другом
    if (reduceMotion) {
        return (
            <>
                <section className={s.static} aria-labelledby="hero-title">
                    <Image className={s.photo} src={photo} alt="Степан Картузов" priority />
                    <div className={`${ralewayRegular.className} ${s.card} ${s.cardStatic}`}>
                        <HeroSlides slides={heroSlides} titleSlide={heroTitleSlide} interval={heroInterval} />
                        {cta}
                    </div>
                    {industries}
                </section>
                {children}
            </>
        );
    }

    return (
        <>
            <section
                ref={scene}
                className={s.scene}
                style={{
                    '--scene-h': `${100 + DESKTOP_TIMING.length * PACE * 100}vh`,
                    '--scene-h-phone': `${100 + PHONE_TIMING.length * PHONE_PACE * 100}vh`,
                } as CSSProperties}
                aria-labelledby="hero-title"
            >
                <motion.div
                    ref={screen}
                    className={`${s.screen} ${portalState === 'open' ? s.passThrough : ''}`}
                    style={{ maskImage: holeMask, WebkitMaskImage: holeMask }}
                >
                    <motion.div className={s.base} style={{ opacity: baseOpacity }} aria-hidden="true" />
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

                        <div ref={card} className={`${ralewayRegular.className} ${s.card}`} onFocus={focusHero}>
                            <motion.div style={{ opacity: slidesOpacity, y: slidesY }}>
                                <HeroSlides slides={heroSlides} titleSlide={heroTitleSlide} interval={heroInterval} />
                                {cta}
                            </motion.div>
                        </div>
                    </div>

                    <div className={`${s.layer} ${live ? s.layerShown : ''}`}>
                        {/* Диск портала: под кружком «10 работ», над отраслями */}
                        <motion.div className={s.disk} style={{ background: diskBg, opacity: ringOpacity }} aria-hidden="true" />
                        {industries}
                    </div>
                </motion.div>
            </section>

            {/* Кейсы прилипают к экрану на время портала и отпускаются вместе со сценой: --exit – путь портала.
                Липкость нативная, поэтому за скроллом блок не дёргается; сам он не масштабируется и не сдвигается.
                До начала портала он прозрачен: иначе просвечивает под первым экраном */}
            <div
                className={`${s.nextTrack} ${portalState === 'off' ? s.nextHidden : ''}`}
                style={{
                    '--exit-desktop': `${PORTAL_PATH * PACE * 100}vh`,
                    '--exit-phone': `${PORTAL_PATH * PHONE_PACE * 100}vh`,
                    '--next-top': `${nextTop}px`,
                } as CSSProperties}
                onFocus={focusCases}
            >
                <div ref={nextEl} className={s.next}>
                    <SceneAfterContext.Provider value={afterOn ? smoothAfter : null}>
                        {children}
                    </SceneAfterContext.Provider>
                </div>
                <div ref={afterEl} className={s.after} style={{ height: `${AFTER * 100}vh` }} aria-hidden="true" />
            </div>
        </>
    );
}

export default HeroExpand
