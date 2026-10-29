"use client";

import { CSSProperties, FC, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import o from './OrbScene.module.scss'
import sx from '../sections/Sections.module.scss'
import s from './AgentDeck.module.scss'
import OrbStar from "@/app/(home)/components/chat/OrbStar";
import { ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { drop as dropCurve, durFor, easeOut, fadeFor, lerp, move, offsetIn, rise, SMOOTH, span, useStickyScene } from "../scene";
import { DROP_TAIL, HowFlow, PAST } from "../sections/HowWeWork";
import { deckAgents, deckChips, deckSlideLabel, flow, sections } from "@/data/aiPage";
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
// заполняется, в конце слайда строки уходят вверх, снизу входят следующие, шар вздрагивает.
// Конец сцены (вариант 2 «лист целиком»): карточка вместе со всем содержимым уходит в шар одним движением, как плоский
// лист – равномерно уменьшается к центру шара с ускорением и закручивается потоком, у шара гаснет; правая (нижняя)
// чуть отстаёт. Шар по ходу растёт. Удар, как только ушёл последний лист, – шар сжимается, и из него вылетают пять
// точек – по точке на место шага линии HowWeWork, центральная первой. Долетев, точка вырастает в кружок с номером,
// между кружками от середины прорисовывается линия, проступает заголовок «Как работаем». Шар уменьшается до малого
// шарика, становится им и проезжает линию, зажигая шаги; каждый шаг роняет кусок линии, под ним выезжают подпись и
// текст (StepBody). Экран отпускает скролл – верх дальше рисует сам HowWeWork (handoff.ts).
// Единая скорость (speed.ts): окна движений – от их путей (timesFor, по замерам onMeasure); слайд – время чтения,
// экран на слайд
const OVER = .3;
// Строк в слайде и шаги между ними – см. rowIn / rowOut
interface ITimes {
    swap: number, rise: number[], split: number[], drop: number[], emerge: number[], frost: number[], head: number[],
    bars: number[], orb: number[], first: number, slide: number, row: number, step: number, col: number,
    outLead: number, outRow: number, outStep: number, inLag: number,
    suck: number, suckLen: number, lag: number, fade: number[], grow: number[], beat: number[], recoil: number[],
    sparks: number, spread: number, flight: number, howHead: number[], steps: number[], base: number[],
    star: number[], become: number[], ride: number[], past: number[], stepLen: number, path: number
}

// Шар: диаметр, зазор между ним и краем выреза, размытие света (как у шара первого экрана: 28px на 200px).
// Зазор между карточками – в AgentDeck.module.scss (.pair): шар заходит в каждую карточку на радиус + ring − зазор / 2
const ORB = { desk: { d: 88, ring: 10, blur: 12 }, phone: { d: 60, ring: 8, blur: 8 } };
// Малый шар линии шагов (.rider в Sections.module.scss): 22px, размытие света 3px
const RIDER = { d: 22, blur: 3 };
// Телефон: копия верха HowWeWork с телами шагов – от верха экрана, px
const PHONE_TOP = 24;

interface IBox { x: number, y: number, w: number, h: number }
interface IPoint { x: number, y: number }
// card – откуда выходят карточки (вторая ступень ChatWorkScene; на телефоне – середина между местами), tier – выходят
// из ступени, left / right – места карточек агентов, orb – центр шара, track – линия шагов копии HowWeWork, how – сама
// копия (левый верх, ширина)
interface IGeo { card: IBox, tier: boolean, left: IBox, right: IBox, orb: IPoint, track: IBox, vertical: boolean, how: IPoint & { w: number }, t: ITimes }
const noBox: IBox = { x: 0, y: 0, w: 0, h: 0 };
const geo0: Omit<IGeo, 't'> = {
    card: noBox, tier: false, left: { x: 0, y: 200, w: 500, h: 400 }, right: { x: 560, y: 200, w: 500, h: 400 }, orb: { x: 530, y: 400 },
    track: { x: 0, y: 400, w: 850, h: 2 }, vertical: false, how: { x: 0, y: 0, w: 0 }
};
const mix = (a: IBox, b: IBox, m: number): IBox => ({ x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m), w: lerp(a.w, b.w, m), h: lerp(a.h, b.h, m) });

// Левая карточка: с места ступени на своё место, по пути принимает его размер. Из ступени – по высоте быстрее
const leftAt = (v: number, g: IGeo): IBox => {
    const b = mix(g.card, g.left, move(k(g.t, v, g.t.split)));
    if (!g.tier) return b;
    const d = move(k(g.t, v, g.t.drop));
    return { ...b, y: lerp(g.card.y, g.left.y, d), h: lerp(g.card.h, g.left.h, d) };
};
// Правая – того же размера, что левая, выезжает из-под неё: сдвиг от левой растёт до расстояния между местами
const rightAt = (v: number, g: IGeo): IBox => {
    const b = leftAt(v, g);
    const u = move(k(g.t, v, g.t.emerge));
    return { ...b, x: b.x + (g.right.x - g.left.x) * u, y: b.y + (g.right.y - g.left.y) * u };
};

// Начало линии шагов – там шарик линии в начале проезда
const trackStart = (g: Omit<IGeo, 't'>): IPoint => g.vertical
    ? { x: g.track.x + g.track.w / 2, y: g.track.y }
    : { x: g.track.x, y: g.track.y + g.track.h / 2 };

// Окна сцены: [от, до] в экранах. Движения – по путям из замеров, по порядку; проявления – не короче fadeFor
const timesFor = (g: Omit<IGeo, 't'>, h: number, orb: number): ITimes => {
    const d = (px: number) => durFor(px, h);
    const fade = fadeFor(h);
    const at = (from: number, dur: number) => [from, from + dur];
    const swap = .25;
    const move2 = (a: IBox, b: IBox) => Math.max(Math.hypot(b.x - a.x, b.y - a.y), Math.abs(b.w - a.w), Math.abs(b.h - a.h));
    const split = at(swap, Math.max(fade, d(move2(g.card, g.left))));
    const drop = at(swap, Math.max(fade, d(Math.max(Math.abs(g.left.y - g.card.y), Math.abs(g.left.h - g.card.h)))));
    const emerge = at(swap + .05, Math.max(fade, d(Math.hypot(g.right.x - g.left.x, g.right.y - g.left.y))));
    const mid = (split[0] + split[1]) / 2;
    const placed = Math.max(split[1], emerge[1]);
    const orbW = at(placed - fade, Math.max(fade * 2, d(orb)));
    const first = orbW[0] + .02;
    const t0 = {
        swap, rise: [0, Math.max(fade, .3)], split, drop, emerge, frost: at(mid, fade * 2), head: at(mid, fade * 2),
        bars: at(mid + fade, fade * 2), orb: orbW, first, slide: 1, row: fade * 1.5, step: .06, col: .06,
        outLead: .12, outRow: fade * 1.3, outStep: .045, inLag: .08
    };
    // Слайд целиком въехал: первая строка левой карточки + сдвиг правой + шаги строк + въезд строки
    const shown = (j: number) => (j === 0 ? first : first + j * t0.slide + t0.inLag) + t0.col + (ROWS - 1) * t0.step + t0.row;
    const SUCK = shown(SLIDES - 1) + .45;
    // Лист уходит в шар: путь – от центра карточки до шара, размер – до 3%
    const sheet = Math.max(g.left.w, g.left.h, Math.hypot(g.orb.x - (g.left.x + g.left.w / 2), g.orb.y - (g.left.y + g.left.h / 2)));
    // Лист и уменьшается, и едет к шару – с запасом на сложение движений
    const suckLen = Math.max(fade * 2, d(sheet * 1.3));
    const lag = .04;
    const gone = SUCK + .05 + lag + suckLen;
    const beat = at(gone, .2);
    const recoil = at(beat[1], .2);
    const sparks = gone + .17;
    const spread = .12;
    // Точки: самая дальняя – до крайнего шага
    const n = flow.length;
    const far = Math.max(...flow.map((_, i) => {
        const p = (g.vertical ? g.track.h : g.track.w) / (n - 1) * i;
        const to = g.vertical ? { x: g.track.x + g.track.w / 2, y: g.track.y + p } : { x: g.track.x + p, y: g.track.y + g.track.h / 2 };
        return Math.hypot(to.x - g.orb.x, to.y - g.orb.y);
    }));
    const flight = Math.max(fade * 2, d(far));
    const steps = at(sparks + flight, .4);
    const len = g.vertical ? g.track.h : g.track.w;
    // Линия между кружками прорисовывается от середины к краям: путь – половина
    const base = at(steps[0] + .08, Math.max(fade * 2, d(len / 2)));
    const star = at(Math.max(base[1], steps[1]) + .05, fade * 2);
    const start = trackStart(g);
    const become = at(star[0], Math.max(fade * 2, d(Math.hypot(start.x - g.orb.x, start.y - g.orb.y))));
    const ride = at(become[1] + .05, Math.max(fade * 2, d(len)));
    const stepLen = (ride[1] - ride[0]) / (n - 1);
    // Шарик откатывается за шаг 5 (стык с Monthly, десктоп)
    const past = at(ride[1], Math.max(fade, d(PAST)));
    const path = Math.max(ride[1] + DROP_TAIL * stepLen, past[1]) + .1;
    return {
        ...t0, suck: SUCK + .05, suckLen, lag, fade: at(SUCK, .15), grow: [SUCK + .05, gone], beat, recoil,
        sparks, spread, flight, howHead: at(sparks + .13, .4), steps, base, star, become, ride, past, stepLen, path
    };
};

// Доли пути
const f = (t: ITimes, v: number) => v / t.path;
const k = (t: ITimes, v: number, [a, b]: number[]) => span(v, a / t.path, (b - a) / t.path);
const slideAt = (t: ITimes, j: number) => t.first + j * t.slide;
// Когда въезжает и уходит первая строка слайда j
const inFrom = (t: ITimes, j: number) => j === 0 ? t.first : slideAt(t, j) + t.inLag;
const outFrom = (t: ITimes, j: number) => slideAt(t, j + 1) - t.outLead;
// Слайд целиком въехал – сюда ведёт клик по полоске
const shownAt = (t: ITimes, j: number) => inFrom(t, j) + t.col + (ROWS - 1) * t.step + t.row;
// Строка r карточки i: въезд и уход 0–1. У последнего слайда ухода нет – его карточки втягиваются в шар
const rowIn = (t: ITimes, v: number, i: number, r: number) => {
    const from = inFrom(t, Math.floor(i / PER)) + (i % PER) * t.col + r * t.step;
    return k(t, v, [from, from + t.row]);
};
const rowOut = (t: ITimes, v: number, i: number, r: number) => {
    const j = Math.floor(i / PER);
    if (j >= SLIDES - 1) return 0;
    const from = outFrom(t, j) + (i % PER) * t.col * .5 + r * t.outStep;
    return k(t, v, [from, from + t.outRow]);
};
// Активный слайд: меняется на границе слайдов, вместе со сменой строк
const slideOf = (t: ITimes, v: number) => Math.min(SLIDES - 1, Math.max(0, Math.floor((v * t.path - t.first) / t.slide)));

const noGeo: IGeo = { ...geo0, t: timesFor(geo0, 900, ORB.desk.d) };

interface ISuck {
    // Доля ухода 0–1
    u: MotionValue<number>,
    // Одно преобразование листа – и для фона (Shell), и для содержимого (li агента): масштаб, поворот, прозрачность
    scale: MotionValue<number>,
    rotate: MotionValue<number>,
    opacity: MotionValue<number>,
    // Центр шара в координатах ячейки карточки – transform-origin. Коробка Shell к концу сцены совпадает с ячейкой
    // (leftAt / rightAt приехали на место), li агента и есть ячейка – origin у обоих слоёв один
    origin: string
}

// Уход карточки side в шар плоским листом. Масштаб строго равномерный (текст не искажается), к центру шара, с
// ускорением; поворот потоком растёт вместе с ним, у левой и правой – в разные стороны. У шара лист гаснет
const useSuck = (e: MotionValue<number>, side: number, g: IGeo): ISuck => {
    const t = g.t;
    const from = t.suck + side * t.lag;
    const u = useTransform(e, (v) => k(t, v, [from, from + t.suckLen]));
    // С ускорением (как падение): наклон ограничен, без рывка в конце
    const m = useTransform(u, dropCurve);
    const scale = useTransform(m, (x) => lerp(1, .03, x));
    const rotate = useTransform(m, (x) => x * (side ? -13 : 13));
    const opacity = useTransform(u, (x) => 1 - span(x, .7, .3));
    const cell = side ? g.right : g.left;
    const origin = `${g.orb.x - cell.x}px ${g.orb.y - cell.y}px`;
    return { u, scale, rotate, opacity, origin };
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
// Вырез под шар – маской на лице карточки, тень – drop-shadow на обёртке: повторяет вырез. Содержимое лежит
// отдельно, в сетке мест (.pair): фон едет, строки стоят. В конце фон уходит в шар тем же преобразованием, что и
// содержимое (suck)
const Shell: FC<IShell> = ({ box, frost, opacity, mask, suck, z }) => {
    const top = useTransform(box, (b) => b.y);
    const left = useTransform(box, (b) => b.x);
    const width = useTransform(box, (b) => b.w);
    const height = useTransform(box, (b) => b.h);
    // Тень – как vars.$shadow, гаснет в начале ухода в шар
    const filter = useTransform(suck.u, (u) => `drop-shadow(0 4px 48px rgba(0, 0, 0, ${(.25 * (1 - span(u, 0, .15))).toFixed(3)}))`);

    return (
        <motion.div
            className={s.shell}
            style={{ top, left, width, height, opacity, filter, zIndex: z, scale: suck.scale, rotate: suck.rotate, transformOrigin: suck.origin }}
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
    t: ITimes,
    own: MotionValue<number>,
    sticky: boolean,
    animated: boolean,
    i: number,
    r: number,
    className?: string,
    children: ReactNode
}

// Строка карточки: въезжает снизу с проявлением, уходит вверх, тая. Без сцены – только въезд по своему скроллу
const Line: FC<ILine> = ({ e, t, own, sticky, animated, i, r, className, children }) => {
    const state = useTransform([e, own], ([v, u]: number[]) => sticky
        ? { in: rowIn(t, v, i, r), out: rowOut(t, v, i, r) }
        : { in: span(u, r * .12, .52), out: 0 });
    const opacity = useTransform(state, (st) => easeOut(st.in) * (1 - st.out));
    const y = useTransform(state, (st) => 18 * (1 - rise(st.in)) - 18 * move(st.out));

    return <motion.div className={className} style={animated ? { opacity, y } : { opacity: 1, y: 0 }}>{children}</motion.div>;
};

interface IAgent {
    e: MotionValue<number>,
    t: ITimes,
    sticky: boolean,
    animated: boolean,
    i: number,
    // В сцене: место в сетке (на телефоне – строка) и уход в шар листом (только у карточек последнего слайда)
    vertical?: boolean,
    suck?: ISuck,
    cellRef?: (el: HTMLLIElement | null) => void,
    // Плашек «где работает»
    chipCount: number
}

// Агент. В сцене фон рисует его Shell, а карточки слайдов лежат в одной ячейке сетки друг на друге; без сцены – обычная карточка
const Agent: FC<IAgent> = ({ e, t, sticky, animated, i, vertical, suck, cellRef, chipCount }) => {
    const agent = deckAgents[i];
    const ref = useRef<HTMLLIElement | null>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.7'] });
    const own = useSpring(scrollYProgress, SMOOTH);
    const line = { e, t, own, sticky, animated, i };
    const side = i % PER;
    // В сцене – своё место сетки; у последнего слайда – то же преобразование листа, что у его Shell
    const style = sticky
        ? {
            gridColumn: vertical ? 1 : side + 1,
            gridRow: vertical ? side + 1 : 1,
            ...(suck ? { scale: suck.scale, rotate: suck.rotate, opacity: suck.opacity, transformOrigin: suck.origin } : {}),
        }
        : undefined;
    // Тестовые надписи плашек, у каждого агента – со своего места списка
    const labels = deckChips.labels;
    const chips = Array.from({ length: chipCount }, (_, j) => labels[(i + j) % labels.length]);

    return (
        <motion.li
            ref={(el) => { ref.current = el; cellRef?.(el) }}
            className={`${s.agent} ${sticky ? `${s.bare} ${side ? s.sideB : s.sideA}` : ''}`}
            style={style}
        >
            <Line {...line} r={0} className={`${ralewayBold.className} ${s.num}`}>{String(i + 1).padStart(2, '0')}</Line>
            <Line {...line} r={1}><h3 className={`${ralewayBold.className} ${s.name}`}>{agent.title}</h3></Line>
            <Line {...line} r={2}><p className={s.text}>{agent.text}</p></Line>
            <Line {...line} r={3} className={s.chipRow}>
                {chips.map((label, j) => <span key={j} className={s.chip}>{label}</span>)}
            </Line>
            <Line {...line} r={4} className={s.priceRow}>
                <p className={s.price}><b className={ralewayBold.className}>{agent.price}</b> · {agent.term} · {agent.condition}</p>
            </Line>
        </motion.li>
    );
};

interface IDot {
    e: MotionValue<number>,
    t: ITimes,
    j: number,
    active: boolean,
    live: boolean,
    onPick: (j: number) => void
}

// Полоска слайда: тонкая видимая линия в кнопке высотой 32px, заполняется по ходу своего слайда
const Dot: FC<IDot> = ({ e, t, j, active, live, onPick }) => {
    const fill = useTransform(e, (v) => k(t, v, [slideAt(t, j), slideAt(t, j + 1)]));

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

// Светящаяся точка: вылетает из шара на место своего шага (центральная – первой) и гаснет под кружком шага,
// который из неё вырастает
const Spark: FC<ISpark> = ({ e, i, n, g }) => {
    const c = (n - 1) / 2;
    const t = g.t;
    const from = t.sparks + Math.abs(i - c) / c * t.spread;
    const land = from + t.flight;
    const at = (g.vertical ? g.track.h : g.track.w) / (n - 1) * i;
    const to: IPoint = g.vertical
        ? { x: g.track.x + g.track.w / 2, y: g.track.y + at }
        : { x: g.track.x + at, y: g.track.y + g.track.h / 2 };
    const u = useTransform(e, (v) => move(k(t, v, [from, land])));
    const x = useTransform(u, (m) => (to.x - g.orb.x) * m);
    const y = useTransform(u, (m) => (to.y - g.orb.y) * m);
    const opacity = useTransform(e, (v) => k(t, v, [from, from + .04]) * (1 - k(t, v, [land, land + .1])));

    return <motion.span className={s.spark} style={{ left: g.orb.x, top: g.orb.y, x, y, opacity }} />;
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
        let tier = false;
        const el = stitched ? document.querySelector<HTMLElement>('[data-deck-from]') : null;
        const elScreen = el?.closest<HTMLElement>(`.${sc.screen}`);
        if (el && elScreen) {
            const p = offsetIn(el, elScreen);
            card = { x: p.x, y: p.y, w: el.offsetWidth, h: el.offsetHeight };
            tier = true;
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
            vertical = gt.offsetHeight > gt.offsetWidth;
            // Десктоп: линия – на высоте шара. Телефон: линия с телами шагов высокая – копия стоит от верха экрана
            y = vertical ? PHONE_TOP : orb.y - (p.y + gt.offsetHeight / 2);
            track = { x: x + p.x, y: y + p.y, w: gt.offsetWidth, h: gt.offsetHeight };
        }

        const geo = { card, tier, left, right, orb, track, vertical, how: { x, y, w } };
        setG({ ...geo, t: timesFor(geo, root.offsetHeight, size.d) });
        // HowWeWork встаёт так, чтобы его линия совпала с линией копии в кадре отпускания
        howJoin.set(sticky ? { orbY: track.y + track.h / 2, h: root.offsetHeight, steps: true, monthly: stitched } : null);
    }, [sceneY, sticky, stitched, size.d]);

    const { progress, measure, scrollToProgress } = useStickyScene({ scene, path, screen }, onMeasure);

    // Копия HowWeWork меняет высоту, когда получила ширину раздела, – замер заново
    useLayoutEffect(() => {
        const el = ghost.current;
        if (!el) return;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [measure, sticky]);

    const chipCount = phone ? deckChips.phone : deckChips.desk;
    // В шар уходят карточки последнего слайда: агенты с lastFirst
    const lastFirst = (SLIDES - 1) * PER;

    // Экран сцены стоит – карточки видно. До этого он въезжает снизу под ChatWorkScene
    const shown = useTransform([scrollY, sceneY], ([y, top]: number[]): number => y >= top - 1 ? 1 : 0);

    // Текст ступени растаял – ChatWorkScene прячет свою пустую карточку, под ней такая же левая этой сцены
    const syncTook = useCallback(() => {
        deckTook.set(stitched && shown.get() && progress.get() >= f(g.t, g.t.swap) ? 1 : 0);
    }, [stitched, shown, progress, g]);
    // Экран отпустил скролл – верх рисует HowWeWork
    const syncHow = useCallback(() => {
        howTook.set(sticky && scrollY.get() >= unpinY.current - 1 ? 1 : 0);
    }, [sticky, scrollY]);
    useMotionValueEvent(progress, 'change', (v) => {
        syncTook();
        const t = g.t;
        setActive(slideOf(t, v));
        setBarsLive(v >= f(t, t.bars[0]) && v < f(t, t.fade[0]));
        setRest(v >= f(t, t.orb[1]) && v < f(t, t.fade[0]));
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
    const t = g.t;
    const frost = useTransform(progress, (v) => k(t, v, t.frost));
    const leftSuck = useSuck(progress, 0, g);
    const rightSuck = useSuck(progress, 1, g);
    // Десктоп – экран встал под ChatWorkScene; телефон – карточка проявляется посередине. У шара лист гаснет
    const shellIn = useTransform([progress, shown], ([v, sh]: number[]) => phone ? k(t, v, t.rise) : sh);
    const leftShown = useTransform([shellIn, leftSuck.opacity], ([sh, op]: number[]) => sh * op);
    // Правая до выезда лежит ровно под левой – прячется, чтобы тень не темнела вдвое
    const rightShown = useTransform([progress, shellIn, rightSuck.opacity], ([v, sh, op]: number[]) => v > f(t, t.emerge[0]) ? sh * op : 0);
    // Вырез: круг вокруг центра шара (ring от его края), радиус растёт вместе с появлением шара
    const notch = (b: IBox, v: number) => {
        const r = (size.d / 2 + size.ring) * move(k(t, v, t.orb));
        return r < .5 ? 'none' : `radial-gradient(circle at ${g.orb.x - b.x}px ${g.orb.y - b.y}px, transparent ${r.toFixed(2)}px, #000 ${(r + 1).toFixed(2)}px)`;
    };
    const leftMask = useTransform(progress, (v) => notch(leftAt(v, g), v));
    const rightMask = useTransform(progress, (v) => notch(rightAt(v, g), v));

    const head = useTransform(progress, (v) => easeOut(k(t, v, t.head)) * (1 - k(t, v, t.fade)));
    const headY = useTransform(progress, (v) => 14 * (1 - rise(k(t, v, t.head))));
    const bars = useTransform(progress, (v) => easeOut(k(t, v, t.bars)) * (1 - k(t, v, t.fade)));
    const barsY = useTransform(progress, (v) => 10 * (1 - rise(k(t, v, t.bars))));

    // Шар: проявляется в зазоре, вздрагивает при смене слайда, растёт, поглощая листы, с ударом сжимается (в этот
    // момент вылетают точки) и отходит, потом уменьшается до шарика линии и едет к шагу 1; там его сменяет шарик
    // копии HowWeWork
    const orbState = useTransform([progress, kick], ([v, kk]: number[]) => {
        const into = move(k(t, v, t.become));
        const end = trackStart(g);
        const d = lerp(size.d, RIDER.d, into);
        const grow = move(k(t, v, t.grow));
        const beat = move(k(t, v, t.beat));
        // Ушёл левый лист – короткий глоток (правый уходит прямо в удар)
        const gone = t.suck + t.suckLen;
        const gulp = Math.sin(Math.PI * k(t, v, [gone - .03, gone + .07]));
        const full = 1 + .2 * grow + .05 * gulp;
        const pulse = v < f(t, t.beat[1]) ? lerp(full, .92, beat) : lerp(.92, 1, move(k(t, v, t.recoil)));
        return {
            x: lerp(g.orb.x, end.x, into) - d / 2,
            y: lerp(g.orb.y, end.y, into) - d / 2,
            d,
            scale: lerp(.6, 1, move(k(t, v, t.orb))) * (1 + .1 * kk) * pulse,
            opacity: v >= f(t, t.become[1]) ? 0 : k(t, v, t.orb),
            light: lerp(Math.min(1, .7 + .25 * kk + .3 * Math.max(grow, gulp) * (1 - beat)), .8, into),
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
    const starOpacity = useTransform(progress, (v) => 1 - k(t, v, t.star));

    // Копия верха HowWeWork
    const howHead = useTransform(progress, (v) => k(t, v, t.howHead));
    const howHeadY = useTransform(howHead, (h) => 14 * (1 - rise(h)));
    const stepsIntro = useTransform(progress, (v) => k(t, v, t.steps));
    const base = useTransform(progress, (v) => move(k(t, v, t.base)));
    const rider = useTransform(progress, (v): number => v >= f(t, t.become[1]) ? 1 : 0);
    // До прихода шара шаг 1 не горит (прогресс чуть ниже нуля), с его приходом – как у HowWeWork в начале.
    // Шарик едет равномерно, со скоростью SPEED
    const ride = useTransform(progress, (v) => v < f(t, t.ride[0])
        ? lerp(-.07, 0, k(t, v, [t.become[1] - .1, t.become[1]]))
        : k(t, v, t.ride));
    const past = useTransform(progress, (v) => k(t, v, t.past));
    // Время в шагах для тел шагов: шаг i загорается в i
    const drop = useTransform(progress, (v) => (v * t.path - t.ride[0]) / t.stepLen);
    const ghostOpacity = useTransform(howTook, (took) => 1 - took);

    // Клик по полоске – плавно к кадру, где слайд целиком въехал
    const onPick = useCallback((j: number) => scrollToProgress(f(g.t, shownAt(g.t, j))), [scrollToProgress, g]);

    const flat = !sticky;
    const mode = flat ? s.flat : stitched ? s.sticky : s.phone;

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${s.scene} ${mode}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${t.path * 100}vh)`, '--over': `${OVER * 100}vh` } as CSSProperties}
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
                    <motion.div className={s.head} style={sticky ? { opacity: head, y: headY } : { opacity: 1, y: 0 }}>
                        <h2 id="agents-title" className={`${ralewayBold.className} ${sx.title}`}>{sections.agents.title}</h2>
                        <p className={sx.description}>{sections.agents.text}</p>
                    </motion.div>

                    <ul className={sticky ? s.pair : s.list}>
                        {deckAgents.map((agent, i) => (
                            <Agent
                                key={agent.title}
                                e={progress}
                                t={t}
                                sticky={sticky}
                                animated={!reduceMotion}
                                i={i}
                                vertical={phone}
                                cellRef={i < PER ? (el) => { cells.current[i] = el } : undefined}
                                suck={sticky && i >= lastFirst ? (i % PER ? rightSuck : leftSuck) : undefined}
                                chipCount={chipCount}
                            />
                        ))}
                    </ul>

                    {sticky && (
                        <motion.div className={s.dots} style={{ opacity: bars, y: barsY }} aria-hidden={barsLive ? undefined : true}>
                            {Array.from({ length: SLIDES }, (_, j) => (
                                <Dot key={j} e={progress} t={t} j={j} active={j === active} live={barsLive} onPick={onPick} />
                            ))}
                        </motion.div>
                    )}
                </div>

                {sticky && (
                    <>
                        {/* Копия верха HowWeWork: те же классы и ширина, линия – на высоте шара */}
                        <motion.div
                            ref={ghost}
                            className={`${sx.section} ${s.ghost}`}
                            style={{ left: g.how.x, top: g.how.y, width: g.how.w || undefined, opacity: ghostOpacity }}
                            aria-hidden="true"
                        >
                            <motion.h2 className={`${ralewayBold.className} ${sx.title}`} style={{ opacity: howHead, y: howHeadY }}>{sections.how.title}</motion.h2>
                            <motion.p className={sx.description} style={{ opacity: howHead, y: howHeadY }}>{sections.how.text}</motion.p>
                            <HowFlow progress={ride} intro={stepsIntro} base={base} rider={rider} past={stitched ? past : undefined} drop={drop} trackRef={ghostTrack} />
                        </motion.div>

                        <div className={s.sparks} aria-hidden="true">
                            {flow.map((label, i) => <Spark key={label} e={progress} i={i} n={flow.length} g={g} />)}
                        </div>

                        {/* Шар агента – как в ChatWorkScene: стекло, свет, звезда; в покое дышит */}
                        <motion.div
                            className={s.orb}
                            style={{ x: orbX, y: orbY, width: orbD, height: orbD, scale: orbScale, opacity: orbOpacity }}
                            aria-hidden="true"
                        >
                            {/* Дыхание – на вложенном слое: свойство scale на самом шаре масштабирует и его сдвиг x / y, шар качается */}
                            <span className={`${s.orbBody} ${rest ? o.breathe : ''}`}>
                                <span className={`${o.shell} ${s.orbShell}`}><span className={o.glass} /></span>
                                <span className={s.orbLight}>
                                    <motion.span className={o.light} style={{ opacity: lightOpacity, filter: lightBlur }} />
                                    <motion.span className={o.star} style={{ opacity: starOpacity }}>
                                        <OrbStar className={o.starIcon} />
                                    </motion.span>
                                </span>
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
