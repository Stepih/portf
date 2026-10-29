"use client";

import { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import o from '../a/OrbScene.module.scss'
import t from '../sections/Sections.module.scss'
import m from '../sections/Monthly.module.scss'
import s from './MonthlyScene.module.scss'
import OrbStar from "@/app/(home)/components/chat/OrbStar";
import { ralewayBold } from "@/app/fonts/fonts";
import Rise from "../Rise";
import { ease, easeOut, lerp, offsetIn, SMOOTH, span } from "../scene";
import { howJoin, howTook, riderLeft } from "./handoff";
import { monthlyHeads, monthlyNotes, monthlyRanges, monthlyRows, monthlyRub, monthlyScale, monthlySum, sections } from "../../placeholders";

// Шкала – логарифмическая, от 100 до 20 000 ₽ в месяц: разброс «от 200 до 2 300» и «от 2 500 до 10 600» виден глазом
const MIN = 100;
const MAX = 20000;
export const scalePos = (v: number) => Math.log10(v / MIN) / Math.log10(MAX / MIN);

// ---------- Время сцены ----------
// Время – в экранах скролла от кадра, где экран раздела встал (отрицательное – раздел ещё въезжает). Путь – PATH
// экранов, плюс запас липкости (--hold). Шарик срывается с линии шагов, когда экран AgentDeck отпустил скролл (howTook)
const PATH = 2.5;
// Шар сел слева от шкалы
const LAND = .1;
// Шар уменьшается до толщины капсулы и отъезжает в начало шкалы, линия шкалы прорисовывается из-под него
const UNROLL = [.1, .3];
const DRAW = [.14, .28];
// Строка i: от ROW + i * STEP. Внутри – доли экрана от начала строки
const ROW = .4;
const STEP = .6;
const R = {
    // Подпись выезжает слева
    label: [0, .12],
    // Шар катится от начала шкалы к левой границе, счётчик – от 0 до неё
    pre: [.02, .1],
    // Шар катится к правой границе, за ним тянется капсула, счётчик – до правой
    stretch: [.12, .22],
    note: [.26, .12],
    // Плато – до .44: строка уезжает в таблицу (каждая часть – чуть позже предыдущей), шар катится назад
    fly: { label: [.44, .14], sum: [.45, .14], cap: [.46, .14], note: [.48, .14] },
    back: [.44, .16]
};
// Конец: шкала сжимается в шапку таблицы
const END = { ball: [2.1, .14], ticks: [2.12, .24], line: [2.14, .22], heads: [2.24, .14] };
const rowAt = (i: number) => ROW + i * STEP;
const k = (v: number, from: number, [a, d]: number[]) => span(v, from + a, d);

// Шар – как шар AgentDeck (стекло, свет, звезда); диаметр в полёте и толщина капсулы
const D = 220;
const BALL = 22;
const CAP = 44;
// Потолок отставания пружины, в экранах (как LAG_CAP в scene.ts)
const LAG_CAP = .3;

interface IPoint { x: number, y: number }
interface IBox extends IPoint { w: number, h: number }
// Замеры без transform, от верхнего левого угла экрана сцены. Крупная строка, сумма и пояснение лежат в одном
// месте для всех строк; ...To – места в компактной таблице, ...K – во сколько раз там меньше шрифт
interface IGeo {
    // Начало полёта шарика (экраны от закрепления, отрицательное) и путь
    pre: number,
    path: IPoint[],
    land: IPoint,
    rail: IBox,
    label: IPoint, labelTo: IPoint[], labelK: number,
    sum: IPoint, sumTo: IPoint[], sumK: number,
    note: IPoint[], noteTo: IPoint[], noteK: number, noteW: number[],
    // Капсулы и линия шкалы – от левого верха крупной шкалы
    capTo: IBox[],
    lineTo: IBox,
    tick: IPoint[], tickTo: IPoint[], tickK: number
}
const p0 = { x: 0, y: 0 };
const b0 = { x: 0, y: 0, w: 1, h: 1 };
const noGeo: IGeo = {
    pre: -1, path: [p0], land: p0, rail: b0,
    label: p0, labelTo: [p0, p0, p0], labelK: 1,
    sum: p0, sumTo: [p0, p0, p0], sumK: 1,
    note: [p0, p0, p0], noteTo: [p0, p0, p0], noteK: 1, noteW: [0, 0, 0],
    capTo: [b0, b0, b0], lineTo: b0,
    tick: monthlyScale.map(() => p0), tickTo: monthlyScale.map(() => p0), tickK: 1
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
// Где шар на шкале: в каждой строке – от начала к левой границе, к правой, назад к началу
const rideAt = (v: number) => {
    let p = 0;
    monthlyRanges.forEach((range, i) => {
        const from = rowAt(i);
        if (v < from) return;
        const a = scalePos(range[0]);
        const stretch = ease(k(v, from, R.stretch));
        const at = stretch > 0 ? capEnd(v, i) : a * ease(k(v, from, R.pre));
        p = lerp(at, 0, ease(k(v, from, R.back)));
    });
    return p;
};
// Счётчик: круглые числа, чтобы цифры не мельтешили; на шкале – тот же логарифм, что у шара
const round = (n: number) => n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100;
const sumAt = (v: number, i: number) => {
    const [lo, hi] = monthlyRanges[i];
    const stretch = ease(k(v, rowAt(i), R.stretch));
    if (stretch <= 0) return monthlyRub(round(lo * ease(k(v, rowAt(i), R.pre))));
    return monthlySum([lo, stretch >= 1 ? hi : round(lo * (hi / lo) ** stretch)]);
};

// Шар: падает с линии шагов и растёт, садится слева, уменьшается до толщины капсулы и катится по шкале; в конце
// исчезает в начале шкалы, пока она сжимается в шапку таблицы
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
    const end = ease(span(v, END.ball[0], END.ball[1]));
    const x = lerp(g.land.x, g.rail.x, u) + rideAt(v) * g.rail.w;
    // Катится без проскальзывания: поворот = путь / радиус (с толщины капсулы)
    const rot = (x - g.rail.x) / (CAP / 2) * u * 180 / Math.PI;
    return { x, y: g.rail.y + CAP / 2, scale: lerp(1, CAP / D, u) * (1 - end), rot, star: 1, on: end < 1 ? 1 : 0 };
};

// Сдвиг и масштаб из крупного места в компактное
const fly = (from: IPoint, to: IPoint, f: number) => ({ x: (to.x - from.x) * f, y: (to.y - from.y) * f });

// ---------- Крупная строка: подпись, сумма, капсула, пояснение ----------
interface IBig { time: MotionValue<number>, g: IGeo, i: number }

const BigLabel: FC<IBig & { cellRef: (el: HTMLSpanElement | null) => void }> = ({ time, g, i, cellRef }) => {
    const from = rowAt(i);
    const x = useTransform(time, (v) => -90 * (1 - easeOut(k(v, from, R.label))) + fly(g.label, g.labelTo[i], ease(k(v, from, R.fly.label))).x);
    const y = useTransform(time, (v) => fly(g.label, g.labelTo[i], ease(k(v, from, R.fly.label))).y);
    const scale = useTransform(time, (v) => lerp(1, g.labelK, ease(k(v, from, R.fly.label))));
    const opacity = useTransform(time, (v) => v >= from + R.fly.label[0] + R.fly.label[1] ? 0 : easeOut(k(v, from, R.label)));
    const row = monthlyRows[i];
    return (
        <motion.span ref={cellRef} className={s.bigLabel} style={{ x, y, scale, opacity }}>
            {row[0]}<span className={t.muted}> · {row[1]}</span>
        </motion.span>
    );
};

const BigSum: FC<IBig> = ({ time, g, i }) => {
    const from = rowAt(i);
    const f = (v: number) => ease(k(v, from, R.fly.sum));
    const x = useTransform(time, (v) => fly(g.sum, g.sumTo[i], f(v)).x);
    const y = useTransform(time, (v) => fly(g.sum, g.sumTo[i], f(v)).y);
    const scale = useTransform(time, (v) => lerp(1, g.sumK, f(v)));
    const opacity = useTransform(time, (v) => v >= from + R.fly.sum[0] + R.fly.sum[1] ? 0 : span(v, from + .02, .08));
    const text = useTransform(time, (v) => sumAt(v, i));
    return <motion.b className={`${ralewayBold.className} ${s.bigSum}`} style={{ x, y, scale, opacity }}>{text}</motion.b>;
};

// Капсула: тянется за шаром от левой границы, в конце уезжает на свою шкалу в таблице
const BigCap: FC<IBig> = ({ time, g, i }) => {
    const from = rowAt(i);
    const [a] = monthlyRanges[i].map(scalePos);
    const box = (v: number) => {
        const f = ease(k(v, from, R.fly.cap));
        const w = Math.max(0, (capEnd(v, i) - a) * g.rail.w);
        const to = g.capTo[i];
        return { x: lerp(a * g.rail.w, to.x, f), y: lerp(0, to.y, f), w: lerp(w, to.w, f), h: lerp(CAP, to.h, f), r: lerp(CAP / 2, to.h / 2, f) };
    };
    const x = useTransform(time, (v) => box(v).x);
    const y = useTransform(time, (v) => box(v).y);
    const width = useTransform(time, (v) => box(v).w);
    const height = useTransform(time, (v) => box(v).h);
    const borderRadius = useTransform(time, (v) => box(v).r);
    const opacity = useTransform(time, (v) => k(v, from, R.stretch) > 0 && v < from + R.fly.cap[0] + R.fly.cap[1] ? 1 : 0);
    return <motion.span className={s.bigCap} style={{ x, y, width, height, borderRadius, opacity }} />;
};

const BigNote: FC<IBig> = ({ time, g, i }) => {
    const from = rowAt(i);
    const f = (v: number) => ease(k(v, from, R.fly.note));
    const x = useTransform(time, (v) => 120 * (1 - easeOut(k(v, from, R.note))) + fly(g.note[i], g.noteTo[i], f(v)).x);
    const y = useTransform(time, (v) => fly(g.note[i], g.noteTo[i], f(v)).y);
    const scale = useTransform(time, (v) => lerp(1, g.noteK, f(v)));
    const opacity = useTransform(time, (v) => v >= from + R.fly.note[0] + R.fly.note[1] ? 0 : easeOut(k(v, from, R.note)));
    return <motion.span className={s.bigNote} style={{ x, y, scale, opacity, width: g.noteW[i] || undefined }}>{monthlyNotes[i]}</motion.span>;
};

// Отметка крупной шкалы: проявляется, когда до неё дорисовалась линия; подсвечивается, пока её закрывает капсула;
// в конце уезжает в шапку таблицы
const BigTick: FC<{ time: MotionValue<number>, g: IGeo, j: number, value: number }> = ({ time, g, j, value }) => {
    const p = scalePos(value);
    const shown = (v: number) => easeOut(span(ease(k(v, 0, DRAW)), Math.max(.001, p - .02), .14));
    const end = (v: number) => ease(k(v, 0, END.ticks));
    const x = useTransform(time, (v) => fly(g.tick[j], g.tickTo[j], end(v)).x);
    const y = useTransform(time, (v) => 24 * (1 - shown(v)) + fly(g.tick[j], g.tickTo[j], end(v)).y);
    const scale = useTransform(time, (v) => lerp(1, g.tickK, end(v)));
    const opacity = useTransform(time, (v) => v >= END.ticks[0] + END.ticks[1] ? 0 : shown(v));
    // Капсула текущей строки закрывает отметку – чернила; строка уехала – гаснет
    const lit = useTransform(time, (v) => Math.max(...monthlyRanges.map((range, i) => {
        const a = scalePos(range[0]);
        if (p < a - .005) return 0;
        return span(capEnd(v, i) - p, 0, .02) * (k(v, rowAt(i), R.stretch) > 0 ? 1 : 0) * (1 - ease(k(v, rowAt(i), R.fly.cap)));
    })));
    const label = `${value.toLocaleString('ru-RU')} ₽`;
    return (
        <motion.span className={s.bigTick} style={{ left: `${p * 100}%`, x, y, scale, opacity }}>
            {label}
            <motion.span className={s.tickInk} style={{ opacity: lit }}>{label}</motion.span>
        </motion.span>
    );
};

// Насечка на линии шкалы под отметкой
const Mark: FC<{ time: MotionValue<number>, value: number }> = ({ time, value }) => {
    const p = scalePos(value);
    const opacity = useTransform(time, (v) => easeOut(span(ease(k(v, 0, DRAW)), Math.max(.001, p - .02), .14)) * (1 - span(v, END.ticks[0], .08)));
    return <motion.span className={s.mark} style={{ left: `${p * 100}%`, opacity }} />;
};

// ---------- Компактная таблица: строки встают по очереди ----------
const Row: FC<{ time: MotionValue<number>, i: number, refs: IRowRefs }> = ({ time, i, refs }) => {
    const from = rowAt(i);
    const [a, b] = monthlyRanges[i].map(scalePos);
    const after = (f: number[]) => (v: number) => v >= from + f[0] + f[1] ? 1 : 0;
    const line = useTransform(time, (v) => ease(k(v, from, [R.fly.label[0], .16])));
    const hair = useTransform(time, (v) => span(v, from + .5, .1));
    const label = useTransform(time, after(R.fly.label));
    const sum = useTransform(time, after(R.fly.sum));
    const cap = useTransform(time, after(R.fly.cap));
    const row = monthlyRows[i];
    return (
        <div ref={refs.row} className={`${m.row} ${s.row}`} role="row">
            <motion.span className={s.rowLine} style={{ scaleX: line }} aria-hidden="true" />
            <motion.span ref={refs.label} className={s.who} role="cell" style={{ opacity: label }}>
                {row[0]}<span className={t.muted}> · {row[1]}</span>
            </motion.span>
            <motion.span ref={refs.track} className={m.track} role="presentation" style={{ opacity: hair }}>
                <motion.span className={m.capsule} style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%`, opacity: cap }} aria-hidden="true" />
            </motion.span>
            <motion.b ref={refs.sum} className={`${ralewayBold.className} ${m.value} ${s.value}`} role="cell" style={{ opacity: sum }}>{row[2]}</motion.b>
        </div>
    );
};
interface IRowRefs {
    row?: (el: HTMLDivElement | null) => void,
    label: (el: HTMLSpanElement | null) => void,
    track: (el: HTMLSpanElement | null) => void,
    sum: (el: HTMLElement | null) => void
}

const Note: FC<{ time: MotionValue<number>, i: number, noteRef: (el: HTMLLIElement | null) => void }> = ({ time, i, noteRef }) => {
    const from = rowAt(i);
    const opacity = useTransform(time, (v) => v >= from + R.fly.note[0] + R.fly.note[1] ? 1 : 0);
    return <motion.li ref={noteRef} className={m.note} style={{ opacity }}>{monthlyNotes[i]}</motion.li>;
};

const HeadTick: FC<{ time: MotionValue<number>, value: number }> = ({ time, value }) => {
    const opacity = useTransform(time, (v) => v >= END.ticks[0] + END.ticks[1] ? 1 : 0);
    return <motion.span className={`${m.tick} ${s.tick}`} style={{ left: `${scalePos(value) * 100}%`, opacity }}>{value.toLocaleString('ru-RU')} ₽</motion.span>;
};

interface IMonthlyScene {
    // Дорожка линии шагов HowWeWork: с её конца срывается шарик
    rider: HTMLElement
}

// «Каждый месяц», десктоп варианта C: сцена на весь экран. Шарик скатывается с конца линии шагов HowWeWork и, пока
// падает, растёт до шара AgentDeck; экран раздела встаёт. Шар садится слева и раскатывается в крупную шкалу на всю
// ширину: линия прорисовывается из-под него, отметки 100 / 1 000 / 10 000 ₽ проявляются. Строки по очереди: слева
// выезжает подпись, шар катится по шкале, за ним тянется капсула, отметки под ней загораются, сумма набегает
// счётчиком, справа выезжает пояснение; строка ужимается и уезжает на своё место в компактной таблице над шкалой.
// В конце шкала сжимается в шапку таблицы – экран отпускает скролл с обычной таблицей. Крупная сцена – aria-hidden,
// таблица (role="table") – настоящая
const MonthlyScene: FC<IMonthlyScene> = ({ rider }) => {
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const layout = useRef<HTMLDivElement>(null);
    const table = useRef<HTMLDivElement>(null);
    const headScale = useRef<HTMLSpanElement>(null);
    const firstRow = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const bigHead = useRef<HTMLDivElement>(null);
    const bigScale = useRef<HTMLDivElement>(null);
    const rail = useRef<HTMLDivElement>(null);
    const noteSlot = useRef<HTMLDivElement>(null);
    const bigLabels = useRef<(HTMLSpanElement | null)[]>([]);
    const cells = useRef<{ label: HTMLSpanElement | null, track: HTMLSpanElement | null, sum: HTMLElement | null }[]>(monthlyRows.map(() => ({ label: null, track: null, sum: null })));
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
        const st = stage.current;
        const lay = layout.current;
        const tb = table.current;
        const hs = headScale.current;
        const head = bigHead.current;
        const bs = bigScale.current;
        const rl = rail.current;
        const ns = noteSlot.current;
        const r0 = firstRow.current;
        if (!sec || !scr || !st || !lay || !tb || !hs || !head || !bs || !rl || !ns || !r0) return;
        sec.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
        const H = scr.offsetHeight;
        const W = scr.offsetWidth;
        const at = (el: HTMLElement) => offsetIn(el, scr);
        const box = (el: HTMLElement): IBox => ({ ...at(el), w: el.offsetWidth, h: el.offsetHeight });

        // Крупная сцена – под таблицей, посередине свободного места (над переключателем лабы внизу экрана)
        const tableBox = box(lay);
        const bottom = tableBox.y + tableBox.h;
        st.style.top = `${bottom + Math.max(24, (H - 90 - bottom - st.offsetHeight) / 2)}px`;
        // Раздел отпускает экран с таблицей вверху – «Что входит» подтягивается под неё на свободное место
        // (не больше, чем длится покой в конце сцены и запас липкости)
        sec.style.setProperty('--pull', `${Math.max(0, Math.min(H - bottom - 10, .5 * H))}px`);

        const font = (el: Element) => parseFloat(getComputedStyle(el).fontSize) || 1;
        const railBox = box(rl);
        const headBox = box(head);
        const label = bigLabels.current[0];
        const c = cells.current;
        const hsBox = box(hs);
        const bsBox = box(bs);
        const slot = box(ns);
        const tickEl = bs.firstElementChild;
        const headTick = hs.firstElementChild;
        const big = notes.current.map((el) => el ? el.offsetWidth : 0);
        const noteK = notes.current[0] && ns ? font(notes.current[0]) / font(ns) : 1;
        const noteW = big.map((w) => w / noteK);

        // Путь шарика: с конца линии шагов вправо, вниз за текстом шага 5, пологой дугой влево над шкалой – и в её начало
        const scenePos = offsetIn(sec, document.body);
        const tr = offsetIn(rider, document.body);
        const startY = tr.y - scenePos.y + rider.offsetHeight / 2;
        const start = { x: tr.x - scenePos.x + rider.offsetWidth, y: startY };
        const land = { x: railBox.x + D / 2 + 12, y: railBox.y + CAP / 2 };
        const right = Math.min(start.x + 140, W - D / 2 - 24);
        const path = samplePath([
            start,
            { x: start.x + 55, y: start.y + 3 },
            { x: right, y: start.y + 120 },
            { x: right, y: land.y - 180 },
            { x: right - 240, y: land.y - 60 },
            { x: land.x + 320, y: land.y - 20 },
            land
        ]);
        // Экран AgentDeck отпускает скролл, когда линия шагов доезжает до высоты шара сцены (orbY)
        const joinFrom = tr.y + rider.offsetHeight / 2 - (howJoin.get()?.orbY ?? 0);

        setG({
            pre: (joinFrom - scenePos.y) / H,
            path,
            land,
            rail: railBox,
            label: label ? at(label) : p0,
            labelTo: c.map((cell) => cell.label ? at(cell.label) : p0),
            labelK: label && c[0].label ? font(c[0].label) / font(label) : 1,
            sum: { x: headBox.x + headBox.w, y: headBox.y },
            sumTo: c.map((cell) => cell.sum ? { x: at(cell.sum).x + cell.sum.offsetWidth, y: at(cell.sum).y } : p0),
            sumK: c[0].sum ? font(c[0].sum) / font(head) : 1,
            note: noteW.map((w) => ({ x: slot.x + slot.w - w, y: slot.y })),
            noteTo: notes.current.map((el) => el ? at(el) : p0),
            noteK,
            noteW,
            capTo: c.map((cell, i) => {
                if (!cell.track) return b0;
                const tk = box(cell.track);
                const [a, b] = monthlyRanges[i].map(scalePos);
                return { x: tk.x - railBox.x + a * tk.w, y: tk.y - railBox.y, w: (b - a) * tk.w, h: tk.h };
            }),
            lineTo: { x: tableBox.x - railBox.x, y: at(r0).y - railBox.y, w: tb.offsetWidth, h: 1.5 },
            tick: monthlyScale.map((v) => ({ x: bsBox.x + scalePos(v) * bsBox.w, y: bsBox.y })),
            tickTo: monthlyScale.map((v) => ({ x: hsBox.x + scalePos(v) * hsBox.w, y: hsBox.y })),
            tickK: tickEl && headTick ? font(headTick) / font(tickEl) : 1
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

    // Линия крупной шкалы: прорисовывается из-под шара, в конце ложится линией над первой строкой таблицы
    const lineEnd = (v: number) => ease(k(v, 0, END.line));
    const lineX = useTransform(time, (v) => g.lineTo.x * lineEnd(v));
    const lineY = useTransform(time, (v) => (g.lineTo.y - (CAP / 2 - 1)) * lineEnd(v));
    const lineSX = useTransform(time, (v) => ease(k(v, 0, DRAW)) * lerp(1, g.lineTo.w / g.rail.w, lineEnd(v)));
    const lineSY = useTransform(time, (v) => lerp(1, g.lineTo.h / 2, lineEnd(v)));
    const lineOn = useTransform(time, (v) => v >= END.line[0] + END.line[1] ? 0 : 1);
    const heads = useTransform(time, (v) => span(v, END.heads[0], END.heads[1]));

    const rowRefs = (i: number): IRowRefs => ({
        row: i ? undefined : (el) => { firstRow.current = el },
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
                <div className={s.frame}>
                    <h2 id="monthly-title" className={`${ralewayBold.className} ${t.title}`}>
                        <Rise progress={time} from={-.6} dur={.2}>{sections.monthly.title}</Rise>
                    </h2>
                    <p className={t.description}>
                        <Rise progress={time} from={-.54} dur={.2}>{sections.monthly.text}</Rise>
                    </p>

                    <div ref={layout} className={m.layout}>
                        <div ref={table} role="table" aria-labelledby="monthly-title" className={m.table}>
                            <div className={`${m.row} ${m.head} ${s.head}`} role="row">
                                <motion.span role="columnheader" style={{ opacity: heads }}>{monthlyHeads[0]}</motion.span>
                                <span ref={headScale} className={m.scale} role="columnheader">
                                    {monthlyScale.map((v) => <HeadTick key={v} time={time} value={v} />)}
                                </span>
                                <motion.span role="columnheader" style={{ opacity: heads }}>{monthlyHeads[2]}</motion.span>
                            </div>
                            {monthlyRows.map((_, i) => <Row key={i} time={time} i={i} refs={rowRefs(i)} />)}
                        </div>
                        <ul className={m.notes}>
                            {monthlyNotes.map((_, i) => <Note key={i} time={time} i={i} noteRef={(el) => { notes.current[i] = el }} />)}
                        </ul>
                    </div>
                </div>

                {/* Крупная сцена – дубль строк для глаза; читается таблица выше */}
                <div ref={stage} className={s.stage} aria-hidden="true">
                    <div ref={bigHead} className={s.bigHead}>
                        {monthlyRows.map((_, i) => <BigLabel key={i} time={time} g={g} i={i} cellRef={(el) => { bigLabels.current[i] = el }} />)}
                        {monthlyRows.map((_, i) => <BigSum key={i} time={time} g={g} i={i} />)}
                    </div>
                    <div ref={bigScale} className={s.bigScale}>
                        {monthlyScale.map((v, j) => <BigTick key={v} time={time} g={g} j={j} value={v} />)}
                    </div>
                    <div ref={rail} className={s.rail}>
                        <motion.span className={s.line} style={{ x: lineX, y: lineY, scaleX: lineSX, scaleY: lineSY, opacity: lineOn }} />
                        {monthlyScale.map((v) => <Mark key={v} time={time} value={v} />)}
                        {monthlyRows.map((_, i) => <BigCap key={i} time={time} g={g} i={i} />)}
                    </div>
                    <div ref={noteSlot} className={s.noteSlot}>
                        {monthlyRows.map((_, i) => <BigNote key={i} time={time} g={g} i={i} />)}
                    </div>
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
