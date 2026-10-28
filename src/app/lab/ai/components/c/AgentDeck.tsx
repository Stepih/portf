"use client";

import { CSSProperties, FC, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import o from '../a/OrbScene.module.scss'
import t from '../sections/Sections.module.scss'
import s from './AgentDeck.module.scss'
import OrbStar from "@/app/(home)/components/chat/OrbStar";
import { ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ease, easeOut, lerp, offsetIn, SMOOTH, span, useStickyScene } from "../scene";
import { HowFlow } from "../sections/HowWeWork";
import { deckAgents, deckSlideLabel, deckWhere, flow, sections } from "../../placeholders";
import { deckTook, howJoin, howTook } from "./handoff";

// Агентов на слайде – две карточки (рядом, на телефоне – одна над другой); слайды считаются от длины массива
const PER = 2;
const SLIDES = Math.ceil(deckAgents.length / PER);
// Строк в карточке: номер, название, что делает, где работает, цена
const ROWS = 5;

// Путь сцены в экранах. На десктопе сцена заходит под ChatWorkScene на OVER: её начало – начало стыка (handoff там),
// у второй ступени тает текст, а под ней лежит такая же пустая карточка этой сцены. Текст растаял (swap) – пустую
// карточку ступени сменяет левая карточка сцены и едет влево, из-за неё вправо выезжает правая такого же размера.
// На телефоне стыка нет: карточка проявляется посередине и раскрывается на верхнюю и нижнюю. Карточки разъехались –
// в зазоре проявляется шар агента, вырезы под него раскрываются вместе с ним. Дальше – слайд на экран: полоска
// заполняется, в конце слайда строки уходят вверх, снизу входят следующие, шар вздрагивает. Пауз нет: каждое
// движение начинается до конца предыдущего
const T = {
    // Текст ступени растаял: дальше карточку рисует эта сцена. Конец handoff ChatWorkScene (6.8) − её 6.55
    swap: .25,
    // Телефон: карточка проявляется посередине
    rise: [0, .3],
    // Левая (верхняя) карточка – с места ступени на своё место, правая (нижняя) выезжает из-за неё чуть позже
    split: [.25, .75],
    emerge: [.3, .8],
    // Тон карточки – из цвета ступени в матовое стекло карточки агента
    frost: [.4, .75],
    head: [.3, .7],
    bars: [.45, .75],
    // Шар и вырезы под него
    orb: [.6, .95],
    // Начало первого слайда (с него заполняется первая полоска) и длина слайда
    first: .62,
    slide: 1,
    // Строка въезжает row экрана, следующая – через step; правая карточка – на col позже левой
    row: .28,
    step: .06,
    col: .06,
    // Уход: начинается за outLead до конца слайда, строка – outRow, следующая – через outStep; вход следующего – через inLag
    outLead: .12,
    outRow: .22,
    outStep: .045,
    inLag: .08,
};
const slideAt = (j: number) => T.first + j * T.slide;

// Когда въезжает и уходит первая строка слайда j
const inFrom = (j: number) => j === 0 ? T.first : slideAt(j) + T.inLag;
const outFrom = (j: number) => slideAt(j + 1) - T.outLead;
// Слайд целиком въехал – сюда ведёт клик по полоске
const shownAt = (j: number) => inFrom(j) + T.col + (ROWS - 1) * T.step + T.row;

// Конец сцены – от начала втягивания (полэкрана после того, как въехал последний слайд), в экранах. Карточки
// втягиваются в шар, он вспыхивает; без паузы из него вылетают точки, встают пунктиром на место линии шагов
// HowWeWork и сливаются в неё, пять точек вырастают в кружки шагов, проступает заголовок «Как работаем». Шар
// уменьшается до малого шарика, становится им и проезжает линию, зажигая шаги. Экран отпускает скролл – верх
// дальше рисует сам HowWeWork (handoff.ts)
const SUCK = shownAt(SLIDES - 1) + .45;
const END = {
    // Карточка втягивается suckLen экрана, правая (нижняя) – на lag позже
    suckLen: .45,
    lag: .05,
    // Гаснут текст карточек, заголовок и полоски
    fade: [SUCK, SUCK + .22],
    // Вспышка шара в момент поглощения
    flare: [SUCK + .35, SUCK + .7],
    // Точки: первая вылетает в sparks, крайние – на spread позже, полёт – flight
    sparks: SUCK + .45,
    spread: .2,
    flight: .32,
    howHead: [SUCK + .55, SUCK + 1],
    // Точки тянутся в штрихи, штрихи сливаются в линию, основа линии проступает, точки гаснут
    dash: [SUCK + .95, SUCK + 1.1],
    merge: [SUCK + 1.1, SUCK + 1.25],
    base: [SUCK + 1.15, SUCK + 1.3],
    sparkOut: [SUCK + 1.2, SUCK + 1.35],
    // Кружки шагов вырастают из своих точек
    steps: [SUCK + 1.05, SUCK + 1.45],
    // Шар уменьшается до шарика и едет к шагу 1, звезда гаснет; в конце его сменяет шарик линии
    star: [SUCK + 1.35, SUCK + 1.55],
    become: [SUCK + 1.35, SUCK + 1.8],
    // Шарик проезжает линию
    ride: [SUCK + 1.85, SUCK + 2.75],
};
const PATH = SUCK + 2.8;
// На сколько экранов сцена заходит под конец пути ChatWorkScene: PATH − handoff[0] там
const OVER = .3;

// Доли пути
const f = (v: number) => v / PATH;
const k = (v: number, [a, b]: number[]) => span(v, f(a), f(b) - f(a));
const bump = (v: number, range: number[]) => Math.sin(Math.PI * k(v, range));

// Строка r карточки i: въезд и уход 0–1. У последнего слайда ухода нет – его карточки втягиваются в шар
const rowIn = (v: number, i: number, r: number) => {
    const from = inFrom(Math.floor(i / PER)) + (i % PER) * T.col + r * T.step;
    return easeOut(k(v, [from, from + T.row]));
};
const rowOut = (v: number, i: number, r: number) => {
    const j = Math.floor(i / PER);
    if (j >= SLIDES - 1) return 0;
    const from = outFrom(j) + (i % PER) * T.col * .5 + r * T.outStep;
    return ease(k(v, [from, from + T.outRow]));
};
// Активный слайд: меняется на границе слайдов, вместе со сменой строк
const slideOf = (v: number) => Math.min(SLIDES - 1, Math.max(0, Math.floor((v * PATH - T.first) / T.slide)));

// Шар: диаметр, зазор между ним и краем выреза, размытие света (как у шара первого экрана: 28px на 200px).
// Зазор между карточками – в AgentDeck.module.scss (.pair): шар заходит в каждую карточку на радиус + ring − зазор / 2
const ORB = { desk: { d: 88, ring: 10, blur: 12 }, phone: { d: 60, ring: 8, blur: 8 } };
// Малый шар линии шагов (.rider в Sections.module.scss): 22px, размытие света 3px
const RIDER = { d: 22, blur: 3 };
// Точек на шаг линии: пять из них – места шагов
const SPARKS_PER_STEP = { desk: 6, phone: 3 };
// Точка, px
const SPARK = 5;

interface IBox { x: number, y: number, w: number, h: number }
interface IPoint { x: number, y: number }
// card – откуда выходят карточки (вторая ступень ChatWorkScene; на телефоне – середина между местами), left / right –
// места карточек агентов, orb – центр шара, track – линия шагов копии HowWeWork, how – сама копия (левый верх, ширина)
interface IGeo { card: IBox, left: IBox, right: IBox, orb: IPoint, track: IBox, vertical: boolean, how: IPoint & { w: number } }
const noBox: IBox = { x: 0, y: 0, w: 0, h: 0 };
const noGeo: IGeo = { card: noBox, left: noBox, right: noBox, orb: { x: 0, y: 0 }, track: noBox, vertical: false, how: { x: 0, y: 0, w: 0 } };
const mix = (a: IBox, b: IBox, m: number): IBox => ({ x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m), w: lerp(a.w, b.w, m), h: lerp(a.h, b.h, m) });

// Левая карточка: с места ступени на своё место, по пути принимает его размер
const leftAt = (v: number, g: IGeo) => mix(g.card, g.left, ease(k(v, T.split)));
// Правая – того же размера, что левая, выезжает из-под неё: сдвиг от левой растёт до расстояния между местами
const rightAt = (v: number, g: IGeo): IBox => {
    const b = leftAt(v, g);
    const u = ease(k(v, T.emerge));
    return { ...b, x: b.x + (g.right.x - g.left.x) * u, y: b.y + (g.right.y - g.left.y) * u };
};

// Начало линии шагов – там шарик линии в начале проезда
const trackStart = (g: IGeo): IPoint => g.vertical
    ? { x: g.track.x + g.track.w / 2, y: g.track.y }
    : { x: g.track.x, y: g.track.y + g.track.h / 2 };

interface ISuck {
    scaleX: MotionValue<number>,
    scaleY: MotionValue<number>,
    // Доля втягивания 0–1
    u: MotionValue<number>,
    // Точка шара в координатах карточки: к ней карточка сжимается
    origin: string
}

// Втягивание карточки side в шар, как в воронку: поперёк – быстро сужается в полоску, вдоль – сжимается с ускорением,
// к шару (transform-origin – центр шара). Вдоль – по горизонтали, на телефоне – по вертикали
const useSuck = (e: MotionValue<number>, side: number, g: IGeo, vertical: boolean): ISuck => {
    const from = SUCK + side * END.lag;
    const u = useTransform(e, (v) => k(v, [from, from + END.suckLen]));
    const along = useTransform(u, (x) => 1 - x ** 1.6);
    const across = useTransform(u, (x) => lerp(1, .12, easeOut(span(x, 0, .75))));
    const cell = side ? g.right : g.left;
    return {
        scaleX: vertical ? across : along,
        scaleY: vertical ? along : across,
        u,
        origin: `${g.orb.x - cell.x}px ${g.orb.y - cell.y}px`,
    };
};

interface IShell {
    box: MotionValue<IBox>,
    frost: MotionValue<number>,
    opacity: MotionValue<number>,
    mask: MotionValue<string>,
    suck: ISuck,
    z: number
}

// Фон карточки – как у ступени (цвет страницы, скругление, тень); на месте тон становится матовым стеклом.
// Вырез под шар – маской на лице карточки, тень – drop-shadow на обёртке: повторяет форму выреза.
// Содержимое лежит отдельно, в сетке мест (.pair): фон едет, строки стоят
const Shell: FC<IShell> = ({ box, frost, opacity, mask, suck, z }) => {
    const top = useTransform(box, (b) => b.y);
    const left = useTransform(box, (b) => b.x);
    const width = useTransform(box, (b) => b.w);
    const height = useTransform(box, (b) => b.h);
    // Тень – как vars.$shadow, гаснет в начале втягивания
    const filter = useTransform(suck.u, (u) => `drop-shadow(0 4px 48px rgba(0, 0, 0, ${(.25 * (1 - span(u, 0, .5))).toFixed(3)}))`);

    return (
        <motion.div
            className={s.shell}
            style={{ top, left, width, height, opacity, filter, zIndex: z, scaleX: suck.scaleX, scaleY: suck.scaleY, transformOrigin: suck.origin }}
            aria-hidden="true"
        >
            <motion.span className={s.shellFace} style={{ maskImage: mask, WebkitMaskImage: mask }}>
                <motion.span className={s.shellFrost} style={{ opacity: frost }} />
            </motion.span>
        </motion.div>
    );
};

interface ILine {
    // Прогресс сцены (липкая) или своя доля скролла карточки (список)
    e: MotionValue<number>,
    own: MotionValue<number>,
    sticky: boolean,
    animated: boolean,
    i: number,
    r: number,
    className?: string,
    children: ReactNode
}

// Строка карточки: въезжает снизу с проявлением, уходит вверх, тая. Без сцены – только въезд по своему скроллу
const Line: FC<ILine> = ({ e, own, sticky, animated, i, r, className, children }) => {
    const state = useTransform([e, own], ([v, u]: number[]) => sticky
        ? { in: rowIn(v, i, r), out: rowOut(v, i, r) }
        : { in: easeOut(span(u, r * .12, .52)), out: 0 });
    const opacity = useTransform(state, (st) => st.in * (1 - st.out));
    const y = useTransform(state, (st) => 18 * (1 - st.in) - 18 * st.out);

    return <motion.div className={className} style={animated ? { opacity, y } : undefined}>{children}</motion.div>;
};

interface IAgent {
    e: MotionValue<number>,
    sticky: boolean,
    animated: boolean,
    i: number,
    // В сцене: место в сетке (на телефоне – строка) и втягивание его стороны
    vertical?: boolean,
    suck?: ISuck,
    fade?: MotionValue<number>,
    cellRef?: (el: HTMLLIElement | null) => void
}

// Агент. В сцене фон рисует его Shell, а карточки слайдов лежат в одной ячейке сетки друг на друге; без сцены – обычная карточка
const Agent: FC<IAgent> = ({ e, sticky, animated, i, vertical, suck, fade, cellRef }) => {
    const agent = deckAgents[i];
    const ref = useRef<HTMLLIElement | null>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.7'] });
    const own = useSpring(scrollYProgress, SMOOTH);
    const line = { e, own, sticky, animated, i };
    const side = i % PER;
    // Текст втягивается вместе с фоном и гаснет
    const style = sticky && suck ? {
        gridColumn: vertical ? 1 : side + 1,
        gridRow: vertical ? side + 1 : 1,
        scaleX: suck.scaleX,
        scaleY: suck.scaleY,
        transformOrigin: suck.origin,
        opacity: fade,
    } : undefined;

    return (
        <motion.li
            ref={(el) => { ref.current = el; cellRef?.(el) }}
            className={`${s.agent} ${sticky ? `${s.bare} ${side ? s.sideB : s.sideA}` : ''}`}
            style={style}
        >
            <Line {...line} r={0} className={`${ralewayBold.className} ${s.num}`}>{String(i + 1).padStart(2, '0')}</Line>
            <Line {...line} r={1}><h3 className={`${ralewayBold.className} ${s.name}`}>{agent.title}</h3></Line>
            <Line {...line} r={2}><p className={s.text}>{agent.text}</p></Line>
            <Line {...line} r={3}><p className={s.where}>{deckWhere} {agent.where}</p></Line>
            <Line {...line} r={4} className={s.priceRow}>
                <p className={s.price}><b className={ralewayBold.className}>{agent.price}</b> · {agent.term} · {agent.condition}</p>
            </Line>
        </motion.li>
    );
};

interface IDot {
    e: MotionValue<number>,
    j: number,
    active: boolean,
    live: boolean,
    onPick: (j: number) => void
}

// Полоска слайда: тонкая видимая линия в кнопке высотой 32px, заполняется по ходу своего слайда
const Dot: FC<IDot> = ({ e, j, active, live, onPick }) => {
    const fill = useTransform(e, (v) => k(v, [slideAt(j), slideAt(j + 1)]));

    return (
        <button
            type="button"
            className={s.dot}
            aria-label={deckSlideLabel(j + 1, SLIDES)}
            aria-current={active ? 'true' : undefined}
            tabIndex={live ? undefined : -1}
            onClick={() => onPick(j)}
        >
            <span className={s.track}><motion.span className={s.fill} style={{ scaleX: fill }} /></span>
        </button>
    );
};

interface ISpark {
    e: MotionValue<number>,
    i: number,
    n: number,
    g: IGeo
}

// Светящаяся точка: вылетает из шара на своё место линии шагов (центральные – первыми), тянется в штрих,
// штрихи сливаются в сплошную линию и гаснут над её проступившей основой
const Spark: FC<ISpark> = ({ e, i, n, g }) => {
    const c = (n - 1) / 2;
    const from = END.sparks + Math.abs(i - c) / c * END.spread;
    const len = g.vertical ? g.track.h : g.track.w;
    const gap = len / (n - 1);
    const to: IPoint = g.vertical
        ? { x: g.track.x + g.track.w / 2, y: g.track.y + gap * i }
        : { x: g.track.x + gap * i, y: g.track.y + g.track.h / 2 };
    const st = useTransform(e, (v) => {
        const u = easeOut(k(v, [from, from + END.flight]));
        const a = ease(k(v, END.dash));
        const b = ease(k(v, END.merge));
        // Длина: точка → штрих в полшага → весь шаг (соседние сходятся); толщина – до толщины линии (2px)
        const along = Math.max(.2, (SPARK + (gap * .5 - SPARK) * a + (gap * .5 + 1) * b) / SPARK);
        const across = (SPARK - 3 * a) / SPARK;
        return {
            x: (to.x - g.orb.x) * u,
            y: (to.y - g.orb.y) * u,
            along,
            across,
            opacity: k(v, [from, from + .05]) * (1 - k(v, END.sparkOut)),
        };
    });
    const x = useTransform(st, (p) => p.x);
    const y = useTransform(st, (p) => p.y);
    const scaleX = useTransform(st, (p) => g.vertical ? p.across : p.along);
    const scaleY = useTransform(st, (p) => g.vertical ? p.along : p.across);
    const opacity = useTransform(st, (p) => p.opacity);

    return <motion.span className={s.spark} style={{ left: g.orb.x, top: g.orb.y, x, y, scaleX, scaleY, opacity }} />;
};

// Вариант C: какие агенты делаю. Продолжает последний кадр ChatWorkScene: пустая карточка второй ступени едет влево,
// из-за неё выезжает вторая, между ними – шар агента в вырезах, в карточках слайдами по два – агенты второй ступени,
// под ними полоски слайдов. В конце карточки втягиваются в шар, из него собирается линия шагов HowWeWork (стык).
// На телефоне – та же сцена без стыка, карточки одна над другой. На низком экране – список карточек, каждая
// проявляется по своему скроллу. «Уменьшить движение» – статичный список
const AgentDeck: FC = () => {
    const reduceMotion = usePrefersReducedMotion();
    const desk = useMediaQuery('(min-width: 701px) and (min-height: 600px)');
    const tall = useMediaQuery('(max-width: 700px) and (min-height: 560px)');
    const sticky = (desk || tall) && !reduceMotion;
    // Стык с ChatWorkScene – только там, где он есть у неё (её handoff – тот же запрос)
    const stitched = sticky && desk;
    const phone = sticky && !desk;
    const size = phone ? ORB.phone : ORB.desk;
    const sparks = (flow.length - 1) * (phone ? SPARKS_PER_STEP.phone : SPARKS_PER_STEP.desk) + 1;

    const scene = useRef<HTMLElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const ghost = useRef<HTMLDivElement>(null);
    const ghostTrack = useRef<HTMLSpanElement>(null);
    const cells = useRef<(HTMLLIElement | null)[]>([]);
    const unpinY = useRef(Infinity);
    const [g, setG] = useState<IGeo>(noGeo);
    const [active, setActive] = useState(0);
    const [barsLive, setBarsLive] = useState(false);
    const [rest, setRest] = useState(false);
    const { scrollY } = useScroll();
    const sceneY = useMotionValue(Infinity);

    const onMeasure = useCallback(() => {
        const root = screen.current;
        const sec = scene.current;
        if (!root || !sec) return;
        const at = offsetIn(sec, document.body);
        sceneY.set(at.y);
        // Здесь липкий экран отпускает скролл
        unpinY.current = at.y + sec.offsetHeight - root.offsetHeight;
        const box = (el: HTMLElement | null | undefined): IBox => {
            if (!el) return noBox;
            const p = offsetIn(el, root);
            return { x: p.x, y: p.y, w: el.offsetWidth, h: el.offsetHeight };
        };
        const left = box(cells.current[0]);
        const right = box(cells.current[1]);
        const orb = { x: (left.x + left.w / 2 + right.x + right.w / 2) / 2, y: (left.y + left.h / 2 + right.y + right.h / 2) / 2 };

        // Откуда выходят карточки: на десктопе – карточка второй ступени ChatWorkScene (её экран в стыке совпадает
        // с экраном этой сцены), на телефоне – середина между местами
        let card = { ...left, y: (left.y + right.y) / 2 };
        const el = stitched ? document.querySelector<HTMLElement>('[data-deck-from]') : null;
        const elScreen = el?.closest<HTMLElement>(`.${sc.screen}`);
        if (el && elScreen) {
            const p = offsetIn(el, elScreen);
            card = { x: p.x, y: p.y, w: el.offsetWidth, h: el.offsetHeight };
        } else if (stitched) {
            card = left;
        }

        // Копия верха HowWeWork – там же и той же ширины, что сам раздел; её линия – на высоте шара
        const how = document.querySelector<HTMLElement>('[data-how-join]');
        const w = how?.offsetWidth ?? Math.min(1060, root.offsetWidth - 40);
        const x = how ? offsetIn(how, document.body).x - at.x : (root.offsetWidth - w) / 2;
        let track = noBox;
        let y = 0;
        let vertical = false;
        const gt = ghostTrack.current;
        const gw = ghost.current;
        if (gt && gw) {
            const p = offsetIn(gt, gw);
            y = orb.y - (p.y + gt.offsetHeight / 2);
            vertical = gt.offsetHeight > gt.offsetWidth;
            track = { x: x + p.x, y: y + p.y, w: gt.offsetWidth, h: gt.offsetHeight };
        }

        setG({ card, left, right, orb, track, vertical, how: { x, y, w } });
        howJoin.set(sticky ? { orbY: orb.y, h: root.offsetHeight } : null);
    }, [sceneY, sticky, stitched]);

    const { progress, measure, scrollToProgress } = useStickyScene({ scene, path, screen }, onMeasure);

    // Копия HowWeWork меняет высоту, когда получила ширину раздела, – замер заново
    useLayoutEffect(() => {
        const el = ghost.current;
        if (!el) return;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [measure, sticky]);

    // Экран сцены стоит – карточки видно. До этого он въезжает снизу под ChatWorkScene
    const shown = useTransform([scrollY, sceneY], ([y, top]: number[]): number => y >= top - 1 ? 1 : 0);

    // Текст ступени растаял – ChatWorkScene прячет свою пустую карточку, под ней такая же левая этой сцены
    const syncTook = useCallback(() => {
        deckTook.set(stitched && shown.get() && progress.get() >= f(T.swap) ? 1 : 0);
    }, [stitched, shown, progress]);
    // Экран отпустил скролл – верх рисует HowWeWork
    const syncHow = useCallback(() => {
        howTook.set(sticky && scrollY.get() >= unpinY.current - 1 ? 1 : 0);
    }, [sticky, scrollY]);
    useMotionValueEvent(progress, 'change', (v) => {
        syncTook();
        setActive(slideOf(v));
        setBarsLive(v >= f(T.bars[0]) && v < f(SUCK));
        setRest(v >= f(T.orb[1]) && v < f(SUCK));
    });
    useMotionValueEvent(shown, 'change', syncTook);
    useMotionValueEvent(scrollY, 'change', syncHow);
    useEffect(() => {
        syncTook();
        syncHow();
    }, [syncTook, syncHow]);
    useEffect(() => () => {
        deckTook.set(0);
        howJoin.set(null);
        howTook.set(0);
    }, []);

    // Смена слайда – короткий импульс шара
    const kick = useMotionValue(0);
    const lastSlide = useRef(0);
    useEffect(() => {
        if (active === lastSlide.current) return;
        lastSlide.current = active;
        const controls = animate(kick, [0, 1, 0], { duration: .5, ease: 'easeOut' });
        return () => controls.stop();
    }, [active, kick]);

    const leftBox = useTransform(progress, (v) => leftAt(v, g));
    const rightBox = useTransform(progress, (v) => rightAt(v, g));
    const frost = useTransform(progress, (v) => ease(k(v, T.frost)));
    const leftSuck = useSuck(progress, 0, g, phone);
    const rightSuck = useSuck(progress, 1, g, phone);
    // Десктоп – экран встал под ChatWorkScene; телефон – карточка проявляется посередине. Втянулась – гаснет
    const shellIn = useTransform([progress, shown], ([v, sh]: number[]) => phone ? ease(k(v, T.rise)) : sh);
    const leftShown = useTransform([shellIn, leftSuck.u], ([sh, u]: number[]) => sh * (1 - span(u, .7, .3)));
    // Правая до выезда лежит ровно под левой – прячется, чтобы тень не темнела вдвое
    const rightShown = useTransform([progress, shellIn, rightSuck.u], ([v, sh, u]: number[]) => v > f(T.emerge[0]) ? sh * (1 - span(u, .7, .3)) : 0);
    // Вырез: круг вокруг центра шара (ring от его края), радиус растёт вместе с появлением шара
    const notch = (b: IBox, v: number) => {
        const r = (size.d / 2 + size.ring) * ease(k(v, T.orb));
        return r < .5 ? 'none' : `radial-gradient(circle at ${g.orb.x - b.x}px ${g.orb.y - b.y}px, transparent ${r.toFixed(2)}px, #000 ${(r + 1).toFixed(2)}px)`;
    };
    const leftMask = useTransform(progress, (v) => notch(leftAt(v, g), v));
    const rightMask = useTransform(progress, (v) => notch(rightAt(v, g), v));
    const textFade = useTransform(progress, (v) => 1 - ease(k(v, END.fade)));

    const head = useTransform(progress, (v) => easeOut(k(v, T.head)) * (1 - ease(k(v, END.fade))));
    const headY = useTransform(progress, (v) => 14 * (1 - easeOut(k(v, T.head))));
    const bars = useTransform(progress, (v) => easeOut(k(v, T.bars)) * (1 - ease(k(v, END.fade))));
    const barsY = useTransform(progress, (v) => 10 * (1 - easeOut(k(v, T.bars))));

    // Шар: проявляется в зазоре, вздрагивает при смене слайда, вспыхивает, поглотив карточки, потом уменьшается
    // до шарика линии и едет к шагу 1; там его сменяет шарик копии HowWeWork
    const orbState = useTransform([progress, kick], ([v, kk]: number[]) => {
        const into = ease(k(v, END.become));
        const end = trackStart(g);
        const d = lerp(size.d, RIDER.d, into);
        const flare = bump(v, END.flare);
        return {
            x: lerp(g.orb.x, end.x, into) - d / 2,
            y: lerp(g.orb.y, end.y, into) - d / 2,
            d,
            scale: lerp(.6, 1, easeOut(k(v, T.orb))) * (1 + .1 * kk) * (1 + .18 * flare),
            opacity: v >= f(END.become[1]) ? 0 : ease(k(v, T.orb)),
            light: lerp(Math.min(1, .7 + .25 * kk + .3 * flare), .8, into),
            blur: lerp(size.blur, RIDER.blur, into),
        };
    });
    const orbX = useTransform(orbState, (st) => st.x);
    const orbY = useTransform(orbState, (st) => st.y);
    const orbD = useTransform(orbState, (st) => st.d);
    const orbScale = useTransform(orbState, (st) => st.scale);
    const orbOpacity = useTransform(orbState, (st) => st.opacity);
    const lightOpacity = useTransform(orbState, (st) => st.light);
    const lightBlur = useTransform(orbState, (st) => `blur(${st.blur.toFixed(2)}px)`);
    const starOpacity = useTransform(progress, (v) => 1 - ease(k(v, END.star)));

    // Копия верха HowWeWork
    const howHead = useTransform(progress, (v) => easeOut(k(v, END.howHead)));
    const howHeadY = useTransform(howHead, (h) => 14 * (1 - h));
    const stepsIntro = useTransform(progress, (v) => k(v, END.steps));
    const base = useTransform(progress, (v) => ease(k(v, END.base)));
    const rider = useTransform(progress, (v): number => v >= f(END.become[1]) ? 1 : 0);
    // До прихода шара шаг 1 не горит (прогресс чуть ниже нуля), с его приходом – как у HowWeWork в начале
    const ride = useTransform(progress, (v) => v < f(END.ride[0])
        ? lerp(-.07, 0, k(v, [END.become[1] - .1, END.become[1]]))
        : k(v, END.ride));
    const ghostOpacity = useTransform(howTook, (took) => 1 - took);

    // Клик по полоске – плавно к кадру, где слайд целиком въехал
    const onPick = useCallback((j: number) => scrollToProgress(f(shownAt(j))), [scrollToProgress]);

    const flat = !sticky;
    const mode = flat ? s.flat : stitched ? s.sticky : s.phone;

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${s.scene} ${mode}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${PATH * 100}vh)`, '--over': `${OVER * 100}vh` } as CSSProperties}
            aria-labelledby="agents-title"
        >
            <div ref={screen} className={`${sc.screen} ${s.screen}`}>
                {sticky && (
                    <>
                        <Shell box={leftBox} frost={frost} opacity={leftShown} mask={leftMask} suck={leftSuck} z={2} />
                        <Shell box={rightBox} frost={frost} opacity={rightShown} mask={rightMask} suck={rightSuck} z={1} />
                    </>
                )}
                <div className={s.wrap}>
                    <motion.div className={s.head} style={sticky ? { opacity: head, y: headY } : undefined}>
                        <h2 id="agents-title" className={`${ralewayBold.className} ${t.title}`}>{sections.agents.title}</h2>
                        <p className={t.description}>{sections.agents.text}</p>
                    </motion.div>

                    <ul className={sticky ? s.pair : s.list}>
                        {deckAgents.map((agent, i) => (
                            <Agent
                                key={agent.title}
                                e={progress}
                                sticky={sticky}
                                animated={!reduceMotion}
                                i={i}
                                vertical={phone}
                                suck={i % PER ? rightSuck : leftSuck}
                                fade={textFade}
                                cellRef={i < PER ? (el) => { cells.current[i] = el } : undefined}
                            />
                        ))}
                    </ul>

                    {sticky && (
                        <motion.div className={s.dots} style={{ opacity: bars, y: barsY }} aria-hidden={barsLive ? undefined : true}>
                            {Array.from({ length: SLIDES }, (_, j) => (
                                <Dot key={j} e={progress} j={j} active={j === active} live={barsLive} onPick={onPick} />
                            ))}
                        </motion.div>
                    )}
                </div>

                {sticky && (
                    <>
                        {/* Копия верха HowWeWork: те же классы и ширина, линия – на высоте шара */}
                        <motion.div
                            ref={ghost}
                            className={`${t.section} ${s.ghost}`}
                            style={{ left: g.how.x, top: g.how.y, width: g.how.w || undefined, opacity: ghostOpacity }}
                            aria-hidden="true"
                        >
                            <motion.h2 className={`${ralewayBold.className} ${t.title}`} style={{ opacity: howHead, y: howHeadY }}>{sections.how.title}</motion.h2>
                            <motion.p className={t.description} style={{ opacity: howHead, y: howHeadY }}>{sections.how.text}</motion.p>
                            <HowFlow progress={ride} intro={stepsIntro} base={base} rider={rider} trackRef={ghostTrack} />
                        </motion.div>

                        <div className={s.sparks} aria-hidden="true">
                            {Array.from({ length: sparks }, (_, i) => <Spark key={i} e={progress} i={i} n={sparks} g={g} />)}
                        </div>

                        {/* Шар агента – как в ChatWorkScene: стекло, свет, звезда; в покое дышит */}
                        <motion.div
                            className={`${s.orb} ${rest ? o.breathe : ''}`}
                            style={{ x: orbX, y: orbY, width: orbD, height: orbD, scale: orbScale, opacity: orbOpacity }}
                            aria-hidden="true"
                        >
                            <span className={`${o.shell} ${s.orbShell}`}><span className={o.glass} /></span>
                            <span className={s.orbLight}>
                                <motion.span className={o.light} style={{ opacity: lightOpacity, filter: lightBlur }} />
                                <motion.span className={o.star} style={{ opacity: starOpacity }}>
                                    <OrbStar className={o.starIcon} />
                                </motion.span>
                            </span>
                        </motion.div>
                    </>
                )}
            </div>
            <div ref={path} className={`${sc.path} ${flat ? s.off : ''}`} aria-hidden="true" />
        </section>
    );
};

export default AgentDeck;
