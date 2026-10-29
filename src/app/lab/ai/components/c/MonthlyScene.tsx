"use client";

import { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import o from '../a/OrbScene.module.scss'
import t from '../sections/Sections.module.scss'
import m from '../sections/Monthly.module.scss'
import s from './MonthlyScene.module.scss'
import OrbStar from "@/app/(home)/components/chat/OrbStar";
import { allerta, ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import Rise from "../Rise";
import { ease, easeOut, lerp, offsetIn, SMOOTH, span } from "../scene";
import { howJoin, howTook, riderLeft } from "./handoff";
import {
    monthlyCount, monthlyHeads, monthlyMinor, monthlyNotes, monthlyPer, monthlyRanges, monthlyRows, monthlyScale, monthlySum,
    monthlyUnit, sections
} from "../../placeholders";

// Шкала – логарифмическая, от 100 до 20 000 ₽ в месяц: разброс «от 200 до 2 300» и «от 2 500 до 10 600» виден глазом.
// Неравные деления показывают мелкие насечки (monthlyMinor)
const MIN = 100;
const MAX = 20000;
export const scalePos = (v: number) => Math.log10(v / MIN) / Math.log10(MAX / MIN);
const marks = [...monthlyScale, ...monthlyMinor].sort((a, b) => a - b);
const LAST = monthlyRows.length - 1;

// ---------- Время сцены ----------
// Время – в экранах скролла от кадра, где экран раздела встал (отрицательное – раздел ещё въезжает). Путь – PATH
// экранов, плюс запас липкости (--hold). Шарик срывается с линии шагов, когда экран AgentDeck отпустил скролл (howTook)
// Шар сел слева от шкалы
const LAND = .1;
// Шар уменьшается до толщины капсулы и отъезжает в начало шкалы, линия шкалы прорисовывается из-под него
const UNROLL = [.1, .2];
const DRAW = [.14, .14];
// Строка i: от ROW + i * STEP. Внутри – доли экрана от начала строки
const ROW = .36;
const STEP = .66;
const R = {
    // Новый шар вырастает из точки в начале шкалы (строки 2 и 3), пока прошлый гаснет в таблице
    grow: [-.04, .05],
    // Подпись выезжает слева
    label: [0, .1],
    // Шар катится от начала шкалы к левой границе
    pre: [.02, .08],
    // Шар катится к правой границе, за ним тянется капсула, сумма набегает счётчиком
    stretch: [.1, .2],
    note: [.2, .1],
    // Плато – до .36. Фаза 1: все части строки разом, одним easing, собираются под шкалой в компактную строку
    // таблицы (подпись – капсула – сумма, пояснение – рядом), шар на конце капсулы уменьшается до точки
    gather: [.36, .1],
    // Фаза 2: собранная строка одним блоком уезжает вверх в свою полосу таблицы, шар – вместе с ней
    fly: [.46, .12],
    // После посадки: линия строки прорисовывается, шар гаснет на конце капсулы
    line: [.58, .06],
    out: [.58, .04],
    // Крупная шкала гаснет до 30%, пока строка собирается и летит, – ничего не пересекает
    dim: [.33, .05]
};
const rowAt = (i: number) => ROW + i * STEP;
const k = (v: number, from: number, [a, d]: number[]) => span(v, from + a, d);
const landAt = (i: number) => rowAt(i) + R.fly[0] + R.fly[1];
// Конец: крупная шкала гаснет (ось уже в шапке таблицы), заголовок с таблицей опускаются в середину экрана
const END = { fade: [landAt(LAST), .08], center: [landAt(LAST) + .02, .16] };
const PATH = END.center[0] + END.center[1] + .02;

// Шар – как шар AgentDeck (стекло, свет, звезда): диаметр в полёте, толщина капсулы, точка в таблице
const D = 220;
const BALL = 22;
const CAP = 44;
const DOT = 26;
// Потолок отставания пружины, в экранах (как LAG_CAP в scene.ts)
const LAG_CAP = .3;

interface IPoint { x: number, y: number }
interface IBox extends IPoint { w: number, h: number }
// Замеры без transform, от верхнего левого угла экрана сцены. Крупные части строки (подпись, сумма, капсула,
// пояснение) у всех строк лежат в одних местах; ...To – их места в собранной строке под шкалой: место в таблице,
// поднятое на lift (насколько строка потом уедет вверх). ...K – во сколько раз в таблице меньше шрифт
interface IGeo {
    // Начало полёта шарика (экраны от закрепления, отрицательное) и путь
    pre: number,
    path: IPoint[],
    land: IPoint,
    rail: IBox,
    lift: number[],
    label: IPoint, labelTo: IPoint[], labelK: number,
    sum: IPoint, sumTo: IPoint[], sumK: number,
    note: IPoint[], noteTo: IPoint[], noteK: number, noteW: number[],
    // Капсула и волосяная линия строки – от левого верха крупной шкалы
    capTo: IBox[], trackTo: IBox[],
    // Конец капсулы в таблице – там садится шар
    dot: IPoint[],
    // Насколько заголовок с таблицей опускаются в конце
    shift: number
}
const p0 = { x: 0, y: 0 };
const b0 = { x: 0, y: 0, w: 1, h: 1 };
const each = <T,>(v: T) => monthlyRows.map(() => v);
const noGeo: IGeo = {
    pre: -1, path: [p0], land: p0, rail: b0, lift: each(0),
    label: p0, labelTo: each(p0), labelK: 1,
    sum: p0, sumTo: each(p0), sumK: 1,
    note: each(p0), noteTo: each(p0), noteK: 1, noteW: each(0),
    capTo: each(b0), trackTo: each(b0), dot: each(p0), shift: 0
};

// Сплайн Catmull–Rom через опорные точки, разбитый на точки через равные доли длины
const samplePath = (pts: IPoint[], n = 240) => {
    const dense: IPoint[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const q0 = pts[Math.max(0, i - 1)], q1 = pts[i], q2 = pts[i + 1], q3 = pts[Math.min(pts.length - 1, i + 2)];
        for (let j = 0; j < 40; j++) {
            const u = j / 40, u2 = u * u, u3 = u2 * u;
            const c = (a: number, b: number, c: number, d: number) =>
                .5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (3 * b - a - 3 * c + d) * u3);
            dense.push({ x: c(q0.x, q1.x, q2.x, q3.x), y: c(q0.y, q1.y, q2.y, q3.y) });
        }
    }
    dense.push(pts[pts.length - 1]);
    const len = [0];
    for (let i = 1; i < dense.length; i++) len.push(len[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y));
    const total = len[len.length - 1] || 1;
    const out: IPoint[] = [];
    let j = 0;
    for (let i = 0; i <= n; i++) {
        const d = total * i / n;
        while (j < len.length - 2 && len[j + 1] < d) j++;
        const f = (d - len[j]) / ((len[j + 1] - len[j]) || 1);
        out.push({ x: dense[j].x + (dense[j + 1].x - dense[j].x) * f, y: dense[j].y + (dense[j + 1].y - dense[j].y) * f });
    }
    return out;
};
const pointAt = (path: IPoint[], f: number) => {
    const n = path.length - 1;
    if (!n) return path[0];
    const x = f * n;
    const i = Math.min(n - 1, Math.floor(x));
    const a = path[i], b = path[i + 1];
    return { x: a.x + (b.x - a.x) * (x - i), y: a.y + (b.y - a.y) * (x - i) };
};

// Где на шкале правый край капсулы строки i (доля шкалы); до начала строки – её левая граница
const capEnd = (v: number, i: number) => {
    const [a, b] = monthlyRanges[i].map(scalePos);
    return lerp(a, b, ease(k(v, rowAt(i), R.stretch)));
};
// Где шар строки i на шкале: от начала к левой границе, затем к правой
const rideAt = (v: number, i: number) => k(v, rowAt(i), R.stretch) > 0 ? capEnd(v, i) : scalePos(monthlyRanges[i][0]) * ease(k(v, rowAt(i), R.pre));
// Счётчик: сразу диапазон – левая граница стоит, правая набегает от неё; круглые числа, чтобы цифры не мельтешили
const round = (n: number) => n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100;
const sumAt = (v: number, i: number) => {
    const [lo, hi] = monthlyRanges[i];
    const stretch = ease(k(v, rowAt(i), R.stretch));
    return monthlySum([lo, stretch >= 1 ? hi : round(lo * (hi / lo) ** stretch)]);
};
// Строка, к которой сейчас относится шар: последняя начавшаяся (с учётом того, что новый шар вырастает раньше)
const rowOf = (v: number) => {
    let i = 0;
    monthlyRows.forEach((_, j) => { if (j && v >= rowAt(j) + R.grow[0]) i = j });
    return i;
};

// Шар: падает с линии шагов и растёт, садится слева, уменьшается до толщины капсулы и катится по шкале. В строке
// катится к её границам, затем вместе со строкой сжимается до точки на конце капсулы и уезжает с ней в таблицу.
// Там гаснет – новый вырастает из начала шкалы; после последней строки шара нет
const ballAt = (v: number, g: IGeo) => {
    const start = g.pre + .02;
    if (v < LAND) {
        const f = span(v, start, LAND - start);
        // С места – с ускорением, как куски линии шагов; в конце – отскок
        const along = f < .85 ? (f / .85) ** 2 : 1;
        const hop = f > .85 ? Math.sin(Math.PI * (f - .85) / .15) * 16 : 0;
        const p = pointAt(g.path, along);
        return { x: p.x, y: p.y - hop, scale: lerp(BALL / D, 1, ease(span(f, .25, .6))), rot: 0, star: easeOut(span(f, .35, .3)), on: v >= start ? 1 : 0 };
    }
    const u = ease(span(v, UNROLL[0], UNROLL[1]));
    const i = rowOf(v);
    const from = rowAt(i);
    const railX = (i ? g.rail.x : lerp(g.land.x, g.rail.x, u)) + rideAt(v, i) * g.rail.w;
    const railY = g.rail.y + CAP / 2;
    // Катится без проскальзывания: поворот = путь / радиус (с толщины капсулы)
    const rot = (railX - g.rail.x) / (CAP / 2) * 180 / Math.PI;
    const gather = ease(k(v, from, R.gather));
    const fly = ease(k(v, from, R.fly));
    const dot = g.dot[i];
    const x = lerp(railX, dot.x, gather);
    const y = lerp(railY, dot.y - g.lift[i], gather) + g.lift[i] * fly + (i === LAST ? g.shift * ease(span(v, END.center[0], END.center[1])) : 0);
    let scale = lerp(i ? CAP / D : lerp(1, CAP / D, u), DOT / D, gather);
    if (i) scale *= easeOut(k(v, from, R.grow));
    scale *= 1 - ease(k(v, from, R.out));
    return { x, y, scale, rot, star: 1, on: scale > .001 ? 1 : 0 };
};

// Крупная шкала гаснет до 30%, пока строка собирается и летит в таблицу; в конце гаснет совсем
const scaleOpacity = (v: number) => {
    const i = rowOf(v);
    const from = rowAt(i);
    const back = i < LAST ? ease(k(v, from, R.line)) : 0;
    const dim = ease(k(v, from, R.dim)) * (1 - back);
    return (1 - .7 * dim) * (1 - span(v, END.fade[0], END.fade[1]));
};

// ---------- Крупная строка: блок из подписи, суммы, капсулы и пояснения ----------
interface IBig { time: MotionValue<number>, g: IGeo, i: number }
interface IBlockRefs { label?: (el: HTMLSpanElement | null) => void, sum?: (el: HTMLElement | null) => void }

// Блок строки повторяет раскладку крупной сцены (подпись и сумма, место шкалы, линия, пояснение) и лежит поверх неё.
// Фаза 1 – части сжимаются на свои места в собранной строке, фаза 2 – блок целиком уезжает вверх (общий transform)
const Block: FC<IBig & { refs: IBlockRefs }> = ({ time, g, i, refs }) => {
    const from = rowAt(i);
    const [a] = monthlyRanges[i].map(scalePos);
    const gather = (v: number) => ease(k(v, from, R.gather));
    const y = useTransform(time, (v) => g.lift[i] * ease(k(v, from, R.fly)));
    const opacity = useTransform(time, (v) => v >= landAt(i) || v < from + R.grow[0] ? 0 : 1);

    // Подпись выезжает слева и сжимается в ячейку таблицы
    const labelIn = (v: number) => easeOut(k(v, from, R.label));
    const labelX = useTransform(time, (v) => -90 * (1 - labelIn(v)) + (g.labelTo[i].x - g.label.x) * gather(v));
    const labelY = useTransform(time, (v) => (g.labelTo[i].y - g.label.y) * gather(v));
    const labelScale = useTransform(time, (v) => lerp(1, g.labelK, gather(v)));
    const labelOn = useTransform(time, labelIn);
    // «1 из 3» гаснет, пока строка собирается: в таблице номер стоит у полосы
    const countOn = useTransform(time, (v) => labelIn(v) * (1 - span(gather(v), 0, .4)));

    // Сумма справа: проявляется вместе с капсулой, набегает счётчиком
    const sumX = useTransform(time, (v) => (g.sumTo[i].x - g.sum.x) * gather(v));
    const sumY = useTransform(time, (v) => (g.sumTo[i].y - g.sum.y) * gather(v));
    const sumScale = useTransform(time, (v) => lerp(1, g.sumK, gather(v)));
    const sumOn = useTransform(time, (v) => span(v, from + R.stretch[0], .04));
    const text = useTransform(time, (v) => sumAt(v, i));

    // Капсула тянется за шаром от левой границы и сжимается в капсулу строки таблицы
    const cap = (v: number) => {
        const f = gather(v);
        const w = Math.max(0, (capEnd(v, i) - a) * g.rail.w);
        const to = g.capTo[i];
        return { x: lerp(a * g.rail.w, to.x, f), y: lerp(0, to.y, f), w: lerp(w, to.w, f), h: lerp(CAP, to.h, f) };
    };
    const capX = useTransform(time, (v) => cap(v).x);
    const capY = useTransform(time, (v) => cap(v).y);
    const capW = useTransform(time, (v) => cap(v).w);
    const capH = useTransform(time, (v) => cap(v).h);
    const capR = useTransform(time, (v) => cap(v).h / 2);
    const capOn = useTransform(time, (v) => k(v, from, R.stretch) > 0 ? 1 : 0);
    // Волосяная линия строки таблицы проявляется под капсулой, пока строка собирается
    const trackOn = useTransform(time, (v) => span(gather(v), .3, .7));

    // Пояснение въезжает справа и сжимается в плашку таблицы
    const noteIn = (v: number) => easeOut(k(v, from, R.note));
    const noteX = useTransform(time, (v) => 120 * (1 - noteIn(v)) + (g.noteTo[i].x - g.note[i].x) * gather(v));
    const noteY = useTransform(time, (v) => (g.noteTo[i].y - g.note[i].y) * gather(v));
    const noteScale = useTransform(time, (v) => lerp(1, g.noteK, gather(v)));
    const noteOn = useTransform(time, noteIn);

    const row = monthlyRows[i];
    const track = g.trackTo[i];
    return (
        <motion.div className={s.block} style={{ y, opacity }}>
            <div className={s.bigHead}>
                <motion.span className={s.count} style={{ opacity: countOn }}>{monthlyCount(i + 1, monthlyRows.length)}</motion.span>
                <motion.span ref={refs.label} className={s.bigLabel} style={{ x: labelX, y: labelY, scale: labelScale, opacity: labelOn }}>
                    {row[0]}<span className={t.muted}> · {row[1]}</span>
                </motion.span>
                <motion.b ref={refs.sum} className={`${ralewayBold.className} ${s.bigSum}`} style={{ x: sumX, y: sumY, scale: sumScale, opacity: sumOn }}>
                    <motion.span>{text}</motion.span><span className={`${ralewayRegular.className} ${s.unit}`}>{monthlyPer}</span>
                </motion.b>
            </div>
            <div className={s.bigScale} />
            <div className={s.rail}>
                <motion.span className={s.track} style={{ x: track.x, y: track.y + track.h / 2, width: track.w, opacity: trackOn }} />
                <motion.span className={s.bigCap} style={{ x: capX, y: capY, width: capW, height: capH, borderRadius: capR, opacity: capOn }} />
            </div>
            <div className={s.noteSlot}>
                <motion.span className={s.bigNote} style={{ x: noteX, y: noteY, scale: noteScale, opacity: noteOn, width: g.noteW[i] || undefined }}>
                    {monthlyNotes[i]}
                </motion.span>
            </div>
        </motion.div>
    );
};

// Отметка крупной шкалы: проявляется, когда до неё дорисовалась линия
const drawn = (v: number, p: number) => easeOut(span(ease(k(v, 0, DRAW)), Math.max(.001, p - .02), .14));
const BigTick: FC<{ time: MotionValue<number>, value: number }> = ({ time, value }) => {
    const p = scalePos(value);
    const y = useTransform(time, (v) => 24 * (1 - drawn(v, p)));
    const opacity = useTransform(time, (v) => drawn(v, p));
    return <motion.span className={s.bigTick} style={{ left: `${p * 100}%`, y, opacity }}>{value.toLocaleString('ru-RU')} ₽</motion.span>;
};

// Насечка на линии шкалы: под отметкой – длинная, мелкая (200, 500…) – короткая
const Mark: FC<{ time: MotionValue<number>, value: number }> = ({ time, value }) => {
    const p = scalePos(value);
    const opacity = useTransform(time, (v) => drawn(v, p));
    return <motion.span className={`${s.mark} ${monthlyScale.includes(value) ? '' : s.minor}`} style={{ left: `${p * 100}%`, opacity }} />;
};

// ---------- Компактная таблица: пустой каркас с первого кадра, строки садятся в свои полосы ----------
interface IRowRefs {
    row: (el: HTMLDivElement | null) => void,
    label: (el: HTMLSpanElement | null) => void,
    track: (el: HTMLSpanElement | null) => void,
    sum: (el: HTMLElement | null) => void
}
const Row: FC<{ time: MotionValue<number>, i: number, refs: IRowRefs, frame: MotionValue<number> }> = ({ time, i, refs, frame }) => {
    const [a, b] = monthlyRanges[i].map(scalePos);
    const landed = useTransform(time, (v) => v >= landAt(i) ? 1 : 0);
    // Линия строки – после посадки; пунктир пустой полосы гаснет под ней
    const line = useTransform(time, (v) => ease(k(v, landAt(i), [0, R.line[1]])));
    const ghost = useTransform([frame, line], ([f, l]: number[]) => f * (1 - l));
    const row = monthlyRows[i];
    return (
        <div ref={refs.row} className={`${m.row} ${s.row}`} role="row">
            <motion.span className={`${allerta.className} ${s.num}`} style={{ opacity: frame }} aria-hidden="true">{i + 1}</motion.span>
            <motion.span className={s.ghost} style={{ opacity: ghost }} aria-hidden="true" />
            <motion.span className={s.rowLine} style={{ scaleX: line }} aria-hidden="true" />
            <motion.span ref={refs.label} className={s.who} role="cell" style={{ opacity: landed }}>
                {row[0]}<span className={t.muted}> · {row[1]}</span>
            </motion.span>
            <motion.span ref={refs.track} className={`${m.track} ${s.rowTrack}`} role="presentation" style={{ opacity: landed }}>
                <span className={`${m.capsule} ${s.capsule}`} style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }} aria-hidden="true" />
            </motion.span>
            <motion.b ref={refs.sum} className={`${ralewayBold.className} ${m.value} ${s.value}`} role="cell" style={{ opacity: landed }}>
                {row[2]}<span className={`${ralewayRegular.className} ${s.unit}`} aria-hidden="true">{monthlyPer}</span>
            </motion.b>
        </div>
    );
};

const Note: FC<{ time: MotionValue<number>, i: number, noteRef: (el: HTMLLIElement | null) => void }> = ({ time, i, noteRef }) => {
    const opacity = useTransform(time, (v) => v >= landAt(i) ? 1 : 0);
    return <motion.li ref={noteRef} className={`${m.note} ${s.note}`} style={{ opacity }}>{monthlyNotes[i]}</motion.li>;
};

interface IMonthlyScene {
    // Дорожка линии шагов HowWeWork: с её конца срывается шарик
    rider: HTMLElement
}

// «Каждый месяц», десктоп варианта C: сцена на весь экран. Шарик скатывается с конца линии шагов HowWeWork и, пока
// падает, растёт до шара AgentDeck; экран раздела встаёт. Вверху с первого кадра – пустая таблица: шапка-ось и три
// полосы с номерами. Шар садится слева и раскатывается в крупную шкалу на всю ширину: линия прорисовывается из-под
// него, отметки 100 / 1 000 / 10 000 ₽ и мелкие насечки проявляются. Строки по очереди: слева выезжает подпись
// «1 из 3», шар катится по шкале, за ним тянется капсула, сумма «/мес» набегает счётчиком, справа выезжает
// пояснение. Затем строка собирается под шкалой в компактную и одним блоком уезжает в свою полосу (шкала гаснет до
// 30%), шар – точкой на конце капсулы; новый шар вырастает из начала шкалы. В конце шкала гаснет, заголовок с
// таблицей встают в середину экрана, шара в таблице нет. Крупная сцена –
// aria-hidden, таблица (role="table") – настоящая
const MonthlyScene: FC<IMonthlyScene> = ({ rider }) => {
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const frameEl = useRef<HTMLDivElement>(null);
    const layout = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const bigHead = useRef<HTMLDivElement>(null);
    const rail = useRef<HTMLDivElement>(null);
    const noteSlot = useRef<HTMLDivElement>(null);
    const bigLabel = useRef<HTMLSpanElement | null>(null);
    const bigSum = useRef<HTMLElement | null>(null);
    const cells = useRef(monthlyRows.map(() => ({
        row: null as HTMLDivElement | null, label: null as HTMLSpanElement | null, track: null as HTMLSpanElement | null, sum: null as HTMLElement | null
    })));
    const notes = useRef<(HTMLLIElement | null)[]>([]);
    const [g, setG] = useState<IGeo>(noGeo);

    // Время сцены – от скролла, сглаженное пружиной; при рывке (ползунок, End) пружина перескакивает к потолку отставания
    const { scrollY } = useScroll();
    const pinY = useMotionValue(0);
    const screenH = useMotionValue(1);
    const pre = useMotionValue(-1);
    const raw = useTransform([scrollY, pinY, screenH, pre, howTook], ([y, pin, h, from, took]: number[]) =>
        took ? Math.min(PATH + 1, Math.max(from, (y - pin) / h)) : from);
    const time = useSpring(raw, SMOOTH);
    useMotionValueEvent(raw, 'change', (r) => {
        const v = time.get();
        if (Math.abs(v - r) <= LAG_CAP) return;
        time.jump(v < r ? r - LAG_CAP : r + LAG_CAP);
        time.set(r);
    });

    const measure = useCallback(() => {
        const sec = scene.current;
        const scr = screen.current;
        const fr = frameEl.current;
        const st = stage.current;
        const lay = layout.current;
        const head = bigHead.current;
        const rl = rail.current;
        const ns = noteSlot.current;
        if (!sec || !scr || !fr || !st || !lay || !head || !rl || !ns) return;
        sec.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
        const H = scr.offsetHeight;
        const W = scr.offsetWidth;
        const at = (el: HTMLElement) => offsetIn(el, scr);
        const box = (el: HTMLElement): IBox => ({ ...at(el), w: el.offsetWidth, h: el.offsetHeight });
        // Низ экрана занят переключателем лабы и кнопкой чата
        const floor = H - 80;

        // Крупная сцена – под таблицей, посередине свободного места
        const tableBox = box(lay);
        const bottom = tableBox.y + tableBox.h;
        st.style.top = `${bottom + Math.max(20, (floor - bottom - st.offsetHeight) / 2)}px`;
        // В конце заголовок с таблицей встают в середину экрана (над переключателем лабы)
        const top = at(fr).y + parseFloat(getComputedStyle(fr).paddingTop);
        const shift = Math.max(0, (floor - (bottom - top)) / 2 - top);
        // Раздел отпускает экран с таблицей посередине – «Что входит» подтягивается под неё на свободное место
        sec.style.setProperty('--pull', `${Math.max(0, Math.min(H - bottom - shift - 10, .5 * H))}px`);

        const font = (el: Element) => parseFloat(getComputedStyle(el).fontSize) || 1;
        const railBox = box(rl);
        const headBox = box(head);
        const slot = box(ns);
        const label = bigLabel.current;
        const sum = bigSum.current;
        const c = cells.current;
        const big = notes.current.map((el) => el ? el.offsetWidth : 0);
        const noteK = notes.current[0] ? font(notes.current[0]) / font(ns) : 1;
        const noteW = big.map((w) => w / noteK);
        // Собранная строка встаёт под шкалой: верх строки или её пояснения (что выше) – чуть ниже линии; lift –
        // насколько она потом уедет вверх
        const dockY = railBox.y + railBox.h + 14;
        const lift = c.map((cell, i) => {
            const note = notes.current[i];
            return cell.row ? Math.min(at(cell.row).y, note ? at(note).y : Infinity) - dockY : 0;
        });
        const up = (p: IPoint, i: number) => ({ x: p.x, y: p.y - lift[i] });

        // Путь шарика: с конца линии шагов вправо и вниз за текстом шага 5, затем рано уходит влево – высоко над
        // шкалой, не у кнопки чата и переключателя лабы внизу справа – и пологой дугой садится в её начало
        const scenePos = offsetIn(sec, document.body);
        const tr = offsetIn(rider, document.body);
        const startY = tr.y - scenePos.y + rider.offsetHeight / 2;
        const start = { x: tr.x - scenePos.x + rider.offsetWidth, y: startY };
        const land = { x: railBox.x + D / 2 + 12, y: railBox.y + CAP / 2 };
        const right = Math.min(start.x + 120, W - D / 2 - 24);
        const path = samplePath([
            start,
            { x: start.x + 55, y: start.y + 3 },
            { x: right, y: start.y + 110 },
            { x: right - 220, y: land.y - 330 },
            { x: land.x + 420, y: land.y - 230 },
            { x: land.x + 140, y: land.y - 70 },
            land
        ]);
        // Экран AgentDeck отпускает скролл, когда линия шагов доезжает до высоты шара сцены (orbY)
        const joinFrom = tr.y + rider.offsetHeight / 2 - (howJoin.get()?.orbY ?? 0);

        setG({
            pre: (joinFrom - scenePos.y) / H,
            path,
            land,
            rail: railBox,
            lift,
            label: label ? at(label) : p0,
            labelTo: c.map((cell, i) => cell.label ? up(at(cell.label), i) : p0),
            labelK: label && c[0].label ? font(c[0].label) / font(label) : 1,
            sum: { x: headBox.x + headBox.w, y: headBox.y },
            sumTo: c.map((cell, i) => cell.sum ? up({ x: at(cell.sum).x + cell.sum.offsetWidth, y: at(cell.sum).y }, i) : p0),
            sumK: sum && c[0].sum ? font(c[0].sum) / font(sum) : 1,
            note: noteW.map((w) => ({ x: slot.x + slot.w - w, y: slot.y })),
            noteTo: notes.current.map((el, i) => el ? up(at(el), i) : p0),
            noteK,
            noteW,
            capTo: c.map((cell, i) => {
                if (!cell.track) return b0;
                const tk = box(cell.track);
                const [a, b] = monthlyRanges[i].map(scalePos);
                return { x: tk.x - railBox.x + a * tk.w, y: tk.y - railBox.y - lift[i], w: (b - a) * tk.w, h: tk.h };
            }),
            trackTo: c.map((cell, i) => {
                if (!cell.track) return b0;
                const tk = box(cell.track);
                return { x: tk.x - railBox.x, y: tk.y - railBox.y - lift[i], w: tk.w, h: tk.h };
            }),
            dot: c.map((cell, i) => {
                if (!cell.track) return p0;
                const tk = box(cell.track);
                return { x: tk.x + scalePos(monthlyRanges[i][1]) * tk.w, y: tk.y + tk.h / 2 };
            }),
            shift
        });
        pinY.set(scenePos.y);
        screenH.set(H);
        pre.set((joinFrom - scenePos.y) / H);
    }, [rider, pinY, screenH, pre]);

    useLayoutEffect(() => {
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        if (scene.current) observer.observe(scene.current);
        const how = rider.closest('section');
        if (how) observer.observe(how);
        window.addEventListener('resize', measure);
        // Высота шара сцены AgentDeck (orbY) меняется вместе с её экраном
        const off = howJoin.on('change', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
            off();
        };
    }, [rider, measure]);

    // Шарик сорвался – настоящий в HowWeWork прячется в тот же кадр
    const syncRider = useCallback(() => riderLeft.set(howTook.get() && time.get() >= pre.get() + .02 ? 1 : 0), [time, pre]);
    useMotionValueEvent(time, 'change', syncRider);
    useEffect(() => {
        syncRider();
        return () => riderLeft.set(0);
    }, [syncRider]);

    // Шар
    const ball = useTransform(time, (v) => ballAt(v, g));
    const ballX = useTransform(ball, (b) => b.x - D / 2);
    const ballY = useTransform(ball, (b) => b.y - D / 2);
    const ballScale = useTransform(ball, (b) => b.scale);
    const ballOn = useTransform(ball, (b) => b.on);
    const starRot = useTransform(ball, (b) => b.rot);
    const starOn = useTransform(ball, (b) => b.star);

    // Каркас таблицы проявляется вместе с заголовком; в конце заголовок с таблицей опускаются в середину экрана
    const frame = useTransform(time, (v) => easeOut(span(v, -.5, .2)));
    const frameY = useTransform(time, (v) => g.shift * ease(span(v, END.center[0], END.center[1])));
    // Крупная шкала: линия прорисовывается из-под шара
    const scaleOn = useTransform(time, scaleOpacity);
    const lineSX = useTransform(time, (v) => ease(k(v, 0, DRAW)));
    const unitOn = useTransform(time, (v) => span(v, DRAW[0] + DRAW[1], .06));

    const rowRefs = (i: number): IRowRefs => ({
        row: (el) => { cells.current[i].row = el },
        label: (el) => { cells.current[i].label = el },
        track: (el) => { cells.current[i].track = el },
        sum: (el) => { cells.current[i].sum = el }
    });

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${s.scene}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${PATH * 100}vh)` } as CSSProperties}
            aria-labelledby="monthly-title"
        >
            <div ref={screen} className={`${sc.screen} ${s.screen}`}>
                <motion.div ref={frameEl} className={s.frame} style={{ y: frameY }}>
                    <h2 id="monthly-title" className={`${ralewayBold.className} ${t.title}`}>
                        <Rise progress={time} from={-.6} dur={.2}>{sections.monthly.title}</Rise>
                    </h2>
                    <p className={t.description}>
                        <Rise progress={time} from={-.54} dur={.2}>{sections.monthly.text}</Rise>
                    </p>

                    <div ref={layout} className={m.layout}>
                        <div role="table" aria-labelledby="monthly-title" className={m.table}>
                            <motion.div className={`${m.row} ${m.head} ${s.row} ${s.head}`} role="row" style={{ opacity: frame }}>
                                <span role="columnheader">{monthlyHeads[0]}</span>
                                <span className={m.scale} role="columnheader">
                                    {monthlyScale.map((v) => (
                                        <span key={v} className={`${m.tick} ${s.tick}`} style={{ left: `${scalePos(v) * 100}%` }}>{v.toLocaleString('ru-RU')} ₽</span>
                                    ))}
                                    {marks.map((v) => (
                                        <span key={v} className={`${s.headMark} ${monthlyScale.includes(v) ? '' : s.minor}`} style={{ left: `${scalePos(v) * 100}%` }} aria-hidden="true" />
                                    ))}
                                </span>
                                <span role="columnheader">{monthlyHeads[2]}</span>
                            </motion.div>
                            {monthlyRows.map((_, i) => <Row key={i} time={time} i={i} refs={rowRefs(i)} frame={frame} />)}
                        </div>
                        <ul className={m.notes}>
                            {monthlyNotes.map((_, i) => <Note key={i} time={time} i={i} noteRef={(el) => { notes.current[i] = el }} />)}
                        </ul>
                    </div>
                </motion.div>

                {/* Крупная сцена – дубль строк для глаза; читается таблица выше */}
                <div ref={stage} className={s.stage} aria-hidden="true">
                    <div ref={bigHead} className={s.bigHead} />
                    <motion.div className={s.bigScale} style={{ opacity: scaleOn }}>
                        {monthlyScale.map((v) => <BigTick key={v} time={time} value={v} />)}
                    </motion.div>
                    <div ref={rail} className={s.rail}>
                        <motion.div className={s.axis} style={{ opacity: scaleOn }}>
                            <motion.span className={s.line} style={{ scaleX: lineSX }} />
                            {marks.map((v) => <Mark key={v} time={time} value={v} />)}
                            <motion.span className={s.unitLabel} style={{ opacity: unitOn }}>{monthlyUnit}</motion.span>
                        </motion.div>
                    </div>
                    <div ref={noteSlot} className={s.noteSlot} />
                    {monthlyRows.map((_, i) => (
                        <Block
                            key={i}
                            time={time}
                            g={g}
                            i={i}
                            refs={i ? {} : { label: (el) => { bigLabel.current = el }, sum: (el) => { bigSum.current = el } }}
                        />
                    ))}
                </div>

                {/* Шар – как в AgentDeck: стекло, свет, звезда; звезда катится вместе с ним */}
                <motion.div className={s.ball} style={{ x: ballX, y: ballY, scale: ballScale, opacity: ballOn, width: D, height: D }} aria-hidden="true">
                    <span className={`${o.shell} ${s.ballShell}`}><span className={o.glass} /></span>
                    <span className={s.ballLight}>
                        <span className={o.light} />
                        <motion.span className={o.star} style={{ rotate: starRot, opacity: starOn }}>
                            <OrbStar className={o.starIcon} />
                        </motion.span>
                    </span>
                </motion.div>
            </div>
        </section>
    );
};

export default MonthlyScene;
