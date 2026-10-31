"use client";

import { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import o from './OrbScene.module.scss'
import t from '../sections/Sections.module.scss'
import m from '../sections/Monthly.module.scss'
import s from './MonthlyScene.module.scss'
import OrbStar from "@/app/(home)/components/chat/OrbStar";
import { allerta, ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import Rise from "../Rise";
import { drop, durFor, fadeFor, lerp, move, offsetIn, rise, span, useSceneTime, useValue } from "../scene";
import { PAST } from "../sections/HowWeWork";
import { faqPath, howJoin, howTook, monthlyEnd, monthlyGone, monthlyWipe, riderLeft, termsPath } from "./handoff";
import {
    monthlyCount, monthlyHeads, monthlyMinor, monthlyNotes, monthlyPer, monthlyRanges, monthlyRows, monthlyScale, monthlySum,
    monthlyUnit, sections
} from "@/data/aiPage";

// Шкала – логарифмическая, от 100 до 20 000 ₽ в месяц: разброс «от 200 до 2 300» и «от 2 500 до 10 600» виден глазом.
// Неравные деления показывают мелкие насечки (monthlyMinor)
const MIN = 100;
const MAX = 20000;
export const scalePos = (v: number) => Math.log10(v / MIN) / Math.log10(MAX / MIN);
const marks = [...monthlyScale, ...monthlyMinor].sort((a, b) => a - b);
const LAST = monthlyRows.length - 1;

// ---------- Время сцены ----------
// Время – в экранах скролла от кадра, где экран раздела встал (отрицательное – раздел ещё въезжает). Путь – t.path
// экранов, плюс запас липкости (--hold). Шарик срывается с линии шагов, когда экран AgentDeck отпустил скролл (howTook).
// Единая скорость (speed.ts): каждое окно – от пути своего движения, измеренного в measure (timesFor), окна идут
// друг за другом. Окно – [начало, длительность]
type W = [number, number];
interface IRowT {
    // Новый шар вырастает из точки в начале шкалы (строки 2 и 3); подпись выезжает слева; шар катится к левой границе,
    // затем к правой – за ним тянется капсула, сумма набегает счётчиком; пояснение въезжает справа сразу на своё место
    // в столбце пояснений таблицы
    grow: W, label: W, pre: W, stretch: W, note: W,
    // Фаза 1: все части строки разом собираются под крупной подписью в компактную строку (шар на конце капсулы – до точки);
    // фаза 2: собранная строка одним блоком уезжает вверх в свою полосу таблицы
    gather: W, fly: W,
    // Строка села (land): линия строки прорисовывается, шар гаснет; крупная шкала гаснет до 30%, пока строка летит
    land: number, line: W, out: W, dim: W
}
interface ITimes {
    // Шар падает с линии шагов и растёт; садится слева, уменьшается до толщины капсулы (unroll); линия шкалы
    // прорисовывается из-под него (draw), под ней проявляется единица (unit)
    fall: W, unroll: W, draw: W, unit: W,
    rows: IRowT[],
    // Конец: крупная шкала гаснет (ось уже в шапке таблицы), заголовок с таблицей опускаются в середину экрана
    fade: W, center: W,
    path: number
}
// Паузы, в экранах: строка дочитывается до сборки; между строками шар невидим хотя бы кадр
const READ = .1;
const GAP = .02;
// Подпись въезжает слева на LABEL_IN, пояснение в таблице справа – на NOTE_IN, px
const LABEL_IN = 90;
const NOTE_IN = 120;
const win = (v: number, [a, d]: W) => span(v, a, d);

// Шар – как шар AgentDeck (стекло, свет, звезда): диаметр в полёте, толщина капсулы, точка в таблице
const D = 220;
const BALL = 22;
const CAP = 44;
const DOT = 26;
// Крупная сцена на низком экране: шрифты не мельче FIT_MIN от обычных. BIG_FIXED – её высота, не зависящая от шрифта
// (капсула, отступы, строка «1 из 3»), px
const FIT_MIN = .6;
const BIG_FIXED = 130;
// Собранная строка встаёт на DOCK ниже крупной подписи – на место подписей отметок (при сборке они гаснут), px
const DOCK = 8;

interface IPoint { x: number, y: number }
interface IBox extends IPoint { w: number, h: number }
// Замеры без transform, от верхнего левого угла экрана сцены. Крупные части строки (подпись, сумма, капсула)
// у всех строк лежат в одних местах; ...To – их места в собранной строке под подписью: место в таблице,
// поднятое на lift (насколько строка потом уедет вверх). ...K – во сколько раз в таблице меньше шрифт
interface IGeo {
    // Начало полёта шарика (экраны от закрепления, отрицательное), путь и его длина, px
    pre: number,
    path: IPoint[],
    fallLen: number,
    land: IPoint,
    rail: IBox,
    lift: number[],
    label: IPoint, labelTo: IPoint[], labelK: number,
    sum: IPoint, sumTo: IPoint[], sumK: number,
    // Капсула и волосяная линия строки – от левого верха крупной шкалы
    capTo: IBox[], trackTo: IBox[],
    // Конец капсулы в таблице – там садится шар
    dot: IPoint[],
    // Насколько заголовок с таблицей опускаются в конце
    shift: number,
    // Пути для окон, px: сборка строки (самая дальняя часть), ширина строки таблицы (её линия)
    gatherLen: number[],
    rowW: number,
    t: ITimes
}
const p0 = { x: 0, y: 0 };
const b0 = { x: 0, y: 0, w: 1, h: 1 };
const each = <T,>(v: T) => monthlyRows.map(() => v);

// Окна сцены от путей: начало следующего – конец прошлого, длительность – durFor(путь). Проявления – не короче fadeFor
const timesFor = (g: Omit<IGeo, 't'>, h: number): ITimes => {
    const d = (px: number) => durFor(px, h);
    const fade = fadeFor(h);
    // Падение: 90% окна – путь по дуге (drop), последние 10% – отскок
    const fall: W = [g.pre + .02, Math.max(fade, d(g.fallLen) / .9)];
    const unroll: W = [fall[0] + fall[1], Math.max(fade, d(Math.max(D - CAP, Math.abs(g.land.x - g.rail.x))))];
    const draw: W = [unroll[0] + unroll[1] * .4, d(g.rail.w)];
    const unit: W = [draw[0] + draw[1], fade];
    let at = Math.max(unroll[0] + unroll[1], draw[0] + draw[1]);
    const rows = monthlyRows.map((_, i): IRowT => {
        const [a, b] = monthlyRanges[i].map(scalePos);
        const grow: W = [at, i ? fade : 0];
        const label: W = [at + grow[1] * .5, Math.max(fade, d(LABEL_IN))];
        const pre: W = [label[0] + grow[1] * .5, Math.max(fade * .5, d(a * g.rail.w))];
        const stretch: W = [pre[0] + pre[1], Math.max(fade, d((b - a) * g.rail.w))];
        const note: W = [stretch[0] + stretch[1] * .5, Math.max(fade, d(NOTE_IN))];
        const gather: W = [Math.max(stretch[0] + stretch[1], note[0] + note[1]) + READ, Math.max(fade, d(g.gatherLen[i]))];
        const fly: W = [gather[0] + gather[1], Math.max(fade, d(g.lift[i]))];
        const land = fly[0] + fly[1];
        const out: W = [land, fade];
        at = land + fade + GAP;
        return { grow, label, pre, stretch, note, gather, fly, land, line: [land, d(g.rowW)], out, dim: [gather[0] - fade * .5, fade] };
    });
    const last = rows[LAST];
    const center: W = [last.land + .02, Math.max(fade, d(g.shift))];
    // Линия последней строки дорисовывается уже под стыком с «Что входит» (линия Terms стирает таблицу)
    const path = Math.max(center[0] + center[1], last.line[0] + last.line[1] - .3) + .02;
    return { fall, unroll, draw, unit, rows, fade: [last.land, fade], center, path };
};

const geo0: Omit<IGeo, 't'> = {
    pre: -1, path: [p0], fallLen: 900, land: p0, rail: { ...b0, w: 1200 }, lift: each(300),
    label: p0, labelTo: each(p0), labelK: 1,
    sum: p0, sumTo: each(p0), sumK: 1,
    capTo: each(b0), trackTo: each(b0), dot: each(p0), shift: 100, gatherLen: each(300), rowW: 700
};
const noGeo: IGeo = { ...geo0, t: timesFor(geo0, 900) };

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
const capEnd = (v: number, t: ITimes, i: number) => {
    const [a, b] = monthlyRanges[i].map(scalePos);
    return lerp(a, b, move(win(v, t.rows[i].stretch)));
};
// Где шар строки i на шкале: от начала к левой границе, затем к правой
const rideAt = (v: number, t: ITimes, i: number) => win(v, t.rows[i].stretch) > 0
    ? capEnd(v, t, i)
    : scalePos(monthlyRanges[i][0]) * move(win(v, t.rows[i].pre));
// Счётчик: сразу диапазон – левая граница стоит, правая набегает от неё; круглые числа, чтобы цифры не мельтешили
const round = (n: number) => n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100;
const sumAt = (v: number, t: ITimes, i: number) => {
    const [lo, hi] = monthlyRanges[i];
    const stretch = move(win(v, t.rows[i].stretch));
    return monthlySum([lo, stretch >= 1 ? hi : round(lo * (hi / lo) ** stretch)]);
};
// Строка, к которой сейчас относится шар: последняя начавшаяся (новый шар вырастает в начале своей строки)
const rowOf = (v: number, t: ITimes) => {
    let i = 0;
    t.rows.forEach((row, j) => { if (j && v >= row.grow[0]) i = j });
    return i;
};

// Шар: падает с линии шагов и растёт, садится слева, уменьшается до толщины капсулы и катится по шкале. В строке
// катится к её границам, затем вместе со строкой сжимается до точки на конце капсулы и уезжает с ней в таблицу.
// Там гаснет – новый вырастает из начала шкалы; после последней строки шара нет
const ballAt = (v: number, g: IGeo) => {
    const t = g.t;
    if (v < t.fall[0] + t.fall[1]) {
        const f = win(v, t.fall);
        // С места – с ускорением, как куски линии шагов; в конце – отскок
        const along = f < .9 ? drop(f / .9) : 1;
        const hop = f > .9 ? Math.sin(Math.PI * (f - .9) / .1) * 16 : 0;
        const p = pointAt(g.path, along);
        return { x: p.x, y: p.y - hop, scale: lerp(BALL / D, 1, move(span(f, .2, .6))), rot: 0, star: span(f, .35, .3), on: v >= t.fall[0] ? 1 : 0 };
    }
    const u = move(win(v, t.unroll));
    const i = rowOf(v, t);
    const row = t.rows[i];
    const railX = (i ? g.rail.x : lerp(g.land.x, g.rail.x, u)) + rideAt(v, t, i) * g.rail.w;
    const railY = g.rail.y + CAP / 2;
    // Катится без проскальзывания: поворот = путь / радиус (с толщины капсулы)
    const rot = (railX - g.rail.x) / (CAP / 2) * 180 / Math.PI;
    const gather = move(win(v, row.gather));
    const fly = move(win(v, row.fly));
    const dot = g.dot[i];
    const x = lerp(railX, dot.x, gather);
    const y = lerp(railY, dot.y - g.lift[i], gather) + g.lift[i] * fly + (i === LAST ? g.shift * move(win(v, t.center)) : 0);
    let scale = lerp(i ? CAP / D : lerp(1, CAP / D, u), DOT / D, gather);
    if (i) scale *= win(v, row.grow);
    scale *= 1 - win(v, row.out);
    return { x, y, scale, rot, star: 1, on: scale > .001 ? 1 : 0 };
};

// Крупная шкала гаснет до 30%, пока строка собирается и летит в таблицу; в конце гаснет совсем. Подписи отметок
// (depth 1) гаснут полностью: собранная строка проходит по ним
const scaleOpacity = (v: number, t: ITimes, depth = .7) => {
    const i = rowOf(v, t);
    const row = t.rows[i];
    const back = i < LAST ? win(v, row.out) : 0;
    const dim = win(v, row.dim) * (1 - back);
    return (1 - depth * dim) * (1 - win(v, t.fade));
};

// ---------- Крупная строка: блок из подписи, суммы, капсулы и пояснения ----------
interface IBig { time: MotionValue<number>, g: IGeo, i: number }
interface IBlockRefs { label: (el: HTMLSpanElement | null) => void, sum?: (el: HTMLElement | null) => void }

// Блок строки повторяет раскладку крупной сцены (подпись и сумма, место шкалы, линия) и лежит поверх неё.
// Фаза 1 – части сжимаются на свои места в собранной строке, фаза 2 – блок целиком уезжает вверх (общий transform)
const Block: FC<IBig & { refs: IBlockRefs }> = ({ time, g, i, refs }) => {
    const r = g.t.rows[i];
    const [a] = monthlyRanges[i].map(scalePos);
    const gather = (v: number) => move(win(v, r.gather));
    const y = useTransform(time, (v) => g.lift[i] * move(win(v, r.fly)));
    const opacity = useTransform(time, (v) => v >= r.land || v < r.grow[0] ? 0 : 1);

    // Подпись выезжает слева и сжимается в ячейку таблицы
    const labelIn = (v: number) => win(v, r.label);
    const labelX = useTransform(time, (v) => -LABEL_IN * (1 - move(labelIn(v))) + (g.labelTo[i].x - g.label.x) * gather(v));
    const labelY = useTransform(time, (v) => (g.labelTo[i].y - g.label.y) * gather(v));
    const labelScale = useTransform(time, (v) => lerp(1, g.labelK, gather(v)));
    const labelOn = useTransform(time, labelIn);
    // «1 из 3» гаснет, пока строка собирается: в таблице номер стоит у полосы
    const countOn = useTransform(time, (v) => labelIn(v) * (1 - span(gather(v), 0, .4)));

    // Сумма справа: проявляется вместе с капсулой, набегает счётчиком
    const sumX = useTransform(time, (v) => (g.sumTo[i].x - g.sum.x) * gather(v));
    const sumY = useTransform(time, (v) => (g.sumTo[i].y - g.sum.y) * gather(v));
    const sumScale = useTransform(time, (v) => lerp(1, g.sumK, gather(v)));
    const sumOn = useTransform(time, (v) => win(v, [r.stretch[0], fadeFor(900)]));
    const text = useTransform(time, (v) => sumAt(v, g.t, i));

    // Капсула тянется за шаром от левой границы и сжимается в капсулу строки таблицы
    const cap = (v: number) => {
        const f = gather(v);
        const w = Math.max(0, (capEnd(v, g.t, i) - a) * g.rail.w);
        const to = g.capTo[i];
        return { x: lerp(a * g.rail.w, to.x, f), y: lerp(0, to.y, f), w: lerp(w, to.w, f), h: lerp(CAP, to.h, f) };
    };
    const capX = useTransform(time, (v) => cap(v).x);
    const capY = useTransform(time, (v) => cap(v).y);
    const capW = useTransform(time, (v) => cap(v).w);
    const capH = useTransform(time, (v) => cap(v).h);
    const capR = useTransform(time, (v) => cap(v).h / 2);
    const capOn = useTransform(time, (v) => win(v, r.stretch) > 0 ? 1 : 0);
    // Волосяная линия строки таблицы проявляется под капсулой, пока строка собирается
    const trackOn = useTransform(time, (v) => span(gather(v), .3, .7));

    const row = monthlyRows[i];
    const track = g.trackTo[i];
    return (
        <motion.div className={s.block} style={{ y, opacity }}>
            <div className={s.bigHead}>
                <motion.span className={s.count} style={{ opacity: countOn }}>{monthlyCount(i + 1, monthlyRows.length)}</motion.span>
                <motion.span ref={refs.label} className={s.bigLabel} style={{ x: labelX, y: labelY, scale: labelScale, opacity: labelOn }}>
                    {row[0]}<span className={s.vol}>{row[1]}</span>
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
        </motion.div>
    );
};

// Отметка крупной шкалы: проявляется и выезжает на 24px, когда до неё дорисовалась линия
const drawn = (v: number, t: ITimes, p: number) => span(move(win(v, t.draw)), Math.max(.001, p - .02), .14);
const BigTick: FC<{ time: MotionValue<number>, t: ITimes, value: number }> = ({ time, t, value }) => {
    const p = scalePos(value);
    const y = useTransform(time, (v) => 24 * (1 - rise(drawn(v, t, p))));
    const opacity = useTransform(time, (v) => drawn(v, t, p));
    return <motion.span className={s.bigTick} style={{ left: `${p * 100}%`, y, opacity }}>{value.toLocaleString('ru-RU')} ₽</motion.span>;
};

// Насечка на линии шкалы: под отметкой – длинная, мелкая (200, 500…) – короткая
const Mark: FC<{ time: MotionValue<number>, t: ITimes, value: number }> = ({ time, t, value }) => {
    const p = scalePos(value);
    const opacity = useTransform(time, (v) => drawn(v, t, p));
    return <motion.span className={`${s.mark} ${monthlyScale.includes(value) ? '' : s.minor}`} style={{ left: `${p * 100}%`, opacity }} />;
};

// ---------- Компактная таблица: пустой каркас с первого кадра, строки садятся в свои полосы ----------
interface IRowRefs {
    row: (el: HTMLDivElement | null) => void,
    label: (el: HTMLSpanElement | null) => void,
    track: (el: HTMLSpanElement | null) => void,
    sum: (el: HTMLElement | null) => void,
    line: (el: HTMLSpanElement | null) => void
}
const Row: FC<{ time: MotionValue<number>, t: ITimes, i: number, refs: IRowRefs, frame: MotionValue<number> }> = ({ time, t, i, refs, frame }) => {
    const [a, b] = monthlyRanges[i].map(scalePos);
    const r = t.rows[i];
    const landed = useTransform(time, (v) => v >= r.land ? 1 : 0);
    // Линия строки – после посадки; пунктир пустой полосы гаснет под ней
    const line = useTransform(time, (v) => move(win(v, r.line)));
    const ghost = useTransform([frame, line], ([f, l]: number[]) => f * (1 - l));
    // Линия под шапкой отрывается и падает на темы «Что входит» – дальше её рисует Terms
    const lineOn = useTransform(monthlyWipe, (w) => !i && w >= 0 ? 0 : 1);
    const row = monthlyRows[i];
    return (
        <div ref={refs.row} className={`${m.row} ${s.row}`} role="row">
            <motion.span className={`${allerta.className} ${s.num}`} style={{ opacity: frame }} aria-hidden="true">{i + 1}</motion.span>
            <motion.span className={s.ghost} style={{ opacity: ghost }} aria-hidden="true" />
            <motion.span ref={refs.line} className={s.rowLine} style={{ scaleX: line, opacity: lineOn }} aria-hidden="true" />
            <motion.span ref={refs.label} className={s.who} role="cell" style={{ opacity: landed }}>
                {row[0]}<span className={s.vol}>{row[1]}</span>
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

// Пояснение въезжает справа прямо на своё место, пока строка играет (владелец 31.10.2026: под крупной шкалой
// для него не хватало высоты экрана). Пояснения под таблицей (≤900px, side = false) – после посадки строки:
// иначе собранная строка летела бы сквозь пояснение
const Note: FC<{ time: MotionValue<number>, t: ITimes, i: number, side: boolean, noteRef: (el: HTMLLIElement | null) => void }> = ({ time, t, i, side, noteRef }) => {
    const w = (v: number) => win(v, side ? t.rows[i].note : t.rows[i].out);
    const x = useTransform(time, (v) => NOTE_IN * (1 - move(w(v))));
    const opacity = useTransform(time, w);
    return <motion.li ref={noteRef} className={`${m.note} ${s.note}`} style={{ x, opacity }}>{monthlyNotes[i]}</motion.li>;
};

interface IMonthlyScene {
    // Дорожка линии шагов HowWeWork: с её конца срывается шарик
    rider: HTMLElement
}

// «Каждый месяц», десктоп варианта C: сцена на весь экран. Шарик скатывается с конца линии шагов HowWeWork и, пока
// падает, растёт до шара AgentDeck; экран раздела встаёт. Вверху с первого кадра – пустая таблица: шапка-ось и три
// полосы с номерами. Шар садится слева и раскатывается в крупную шкалу на всю ширину: линия прорисовывается из-под
// него, отметки 100 / 1 000 / 10 000 ₽ и мелкие насечки проявляются. Строки по очереди: слева выезжает подпись
// «1 из 3», шар катится по шкале, за ним тянется капсула, сумма «/мес» набегает счётчиком, пояснение въезжает
// справа сразу в столбец пояснений таблицы. Затем строка собирается в компактную на месте отметок (они гаснут,
// линия шкалы – до 30%) и одним блоком уезжает в свою полосу, шар – точкой на конце капсулы; новый шар вырастает
// из начала шкалы. В конце шкала гаснет, заголовок с таблицей встают в середину экрана, шара в таблице нет.
// Крупная сцена – aria-hidden, таблица (role="table") – настоящая
const MonthlyScene: FC<IMonthlyScene> = ({ rider }) => {
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const frameEl = useRef<HTMLDivElement>(null);
    const layout = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const bigHead = useRef<HTMLDivElement>(null);
    const rail = useRef<HTMLDivElement>(null);
    const bigLabels = useRef<(HTMLSpanElement | null)[]>([]);
    const bigSum = useRef<HTMLElement | null>(null);
    const cells = useRef(monthlyRows.map(() => ({
        row: null as HTMLDivElement | null, label: null as HTMLSpanElement | null, track: null as HTMLSpanElement | null, sum: null as HTMLElement | null,
        line: null as HTMLSpanElement | null
    })));
    const notes = useRef<(HTMLLIElement | null)[]>([]);
    const [g, setG] = useState<IGeo>(noGeo);
    // Столбец пояснений – справа от таблицы (а не под ней)
    const [noteSide, setNoteSide] = useState(true);
    // Верх таблицы с пояснениями после отпускания экрана: над падающей линией Terms таблица обрезается
    // Подписка явная, а не useTransform по двум значениям: при быстром проходе (ползунок, End) он терял последнее
    // изменение, и таблица оставалась обрезанной на полпути – нижнее пояснение висело поверх «Что входит»
    const layoutTop = useMotionValue(0);
    const wipe = useMotionValue('none');
    const syncWipe = useCallback(() => {
        const w = monthlyWipe.get();
        wipe.set(w < 0 ? 'none' : `inset(${Math.max(0, w - layoutTop.get())}px -60px -60px -60px)`);
    }, [wipe, layoutTop]);
    useMotionValueEvent(monthlyWipe, 'change', syncWipe);
    useMotionValueEvent(layoutTop, 'change', syncWipe);
    // Экран держится и на время «Что входит» и FAQ (termsPath + faqPath): заголовок гаснет, когда выезжает заголовок Terms
    const titleOn = useTransform(monthlyGone, (v) => 1 - v);

    // Время сцены – от скролла, сглаженное пружиной; при рывке (ползунок, End) пружина перескакивает к потолку отставания
    const { scrollY } = useScroll();
    const pinY = useMotionValue(0);
    const screenH = useMotionValue(1);
    const pre = useMotionValue(-1);
    const total = useMotionValue(noGeo.t.path);
    const raw = useTransform([scrollY, pinY, screenH, pre, howTook, total], ([y, pin, h, from, took, end]: number[]) =>
        took ? Math.min(end + 1, Math.max(from, (y - pin) / h)) : from);
    const time = useSceneTime(raw);
    const terms = useValue(termsPath);
    const faq = useValue(faqPath);

    const measure = useCallback(() => {
        const sec = scene.current;
        const scr = screen.current;
        const fr = frameEl.current;
        const st = stage.current;
        const lay = layout.current;
        const head = bigHead.current;
        const rl = rail.current;
        if (!sec || !scr || !fr || !st || !lay || !head || !rl) return;
        sec.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
        const H = scr.offsetHeight;
        const W = scr.offsetWidth;
        const at = (el: HTMLElement) => offsetIn(el, scr);
        const box = (el: HTMLElement): IBox => ({ ...at(el), w: el.offsetWidth, h: el.offsetHeight });
        // Низ экрана справа занят кнопкой чата: таблица в конце встаёт посередине выше неё. Крупной сцене она не мешает
        // (у пояснения справа место под кнопку, шкала выше пояснения) – её пол ниже
        const floor = H - 80;
        const bigFloor = H - 16;

        const font = (el: Element) => parseFloat(getComputedStyle(el).fontSize) || 1;
        const sum = bigSum.current;
        const c = cells.current;
        // Подпись строки переносится в ячейке таблицы так же, как крупная: ширина крупной – ширина ячейки / labelK.
        // Высота самой высокой крупной подписи – в --label-h (по ней высота строки с суммой)
        const labels = bigLabels.current;
        const label = labels[0];
        const sizeLabels = () => {
            const k = label && c[0].label ? font(c[0].label) / font(label) : 1;
            labels.forEach((el, i) => {
                const cell = c[i].label;
                if (el && cell) el.style.width = `${cell.offsetWidth / k}px`;
            });
            st.style.setProperty('--label-h', `${Math.max(0, ...labels.map((el) => el?.offsetHeight ?? 0))}px`);
            return k;
        };
        // Высота крупной сцены: до низа подписи шкалы или до низа собранной строки (dockY ниже)
        const need = () => Math.max(st.offsetHeight, head.offsetTop + head.offsetHeight + DOCK + Math.max(0, ...c.map((cell) => cell.row?.offsetHeight ?? 0)));

        // Крупная сцена – под таблицей, посередине свободного места. Не влезает до пола (низкий экран, пояснения
        // в 2–3 строки) – её шрифты мельче на --fit; шар, капсула и отступы прежние
        const tableBox = box(lay);
        const firstNote = notes.current[0];
        const table = lay.firstElementChild as HTMLElement | null;
        setNoteSide(!!firstNote && !!table && at(firstNote).x >= at(table).x + table.offsetWidth);
        const bottom = tableBox.y + tableBox.h;
        const room = bigFloor - bottom - 20;
        let fit = 1;
        st.style.setProperty('--fit', '1');
        let labelK = sizeLabels();
        for (let n = 0; n < 3 && fit > FIT_MIN && need() > room + 1; n++) {
            fit = Math.max(FIT_MIN, fit * (room - BIG_FIXED) / Math.max(1, need() - BIG_FIXED));
            st.style.setProperty('--fit', `${fit}`);
            labelK = sizeLabels();
        }
        const stTop = bottom + Math.max(20, (bigFloor - bottom - need()) / 2);
        st.style.top = `${stTop}px`;
        // Шкала дошла до высоты кнопки чата (60px в 24px от края) – кончается левее неё
        st.style.setProperty('--fab-gap', stTop + rl.offsetTop + rl.offsetHeight > H - 24 - 60 - 8 ? '76px' : '0px');
        // В конце заголовок с таблицей встают в середину экрана (над переключателем лабы)
        const top = at(fr).y + parseFloat(getComputedStyle(fr).paddingTop);
        const shift = Math.max(0, (floor - (bottom - top)) / 2 - top);

        const railBox = box(rl);
        const headBox = box(head);
        // Собранная строка встаёт под крупной подписью, на месте погасших отметок; lift – насколько она потом уедет вверх
        const dockY = headBox.y + headBox.h + DOCK;
        const lift = c.map((cell) => cell.row ? at(cell.row).y - dockY : 0);
        const up = (p: IPoint, i: number) => ({ x: p.x, y: p.y - lift[i] });

        // Путь шарика: с конца линии шагов вправо и вниз за текстом шага 5, затем рано уходит влево – высоко над
        // шкалой, не у кнопки чата и переключателя лабы внизу справа – и пологой дугой садится в её начало
        const scenePos = offsetIn(sec, document.body);
        const tr = offsetIn(rider, document.body);
        const startY = tr.y - scenePos.y + rider.offsetHeight / 2;
        // Шарик ждёт старта, откатившись за кружок шага 5 на PAST (HowWeWork): не закрывает цифру
        const start = { x: tr.x - scenePos.x + rider.offsetWidth + PAST, y: startY };
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

        const labelAt = label ? at(label) : p0;
        const labelTo = c.map((cell, i) => cell.label ? up(at(cell.label), i) : p0);
        const sumAtBox = { x: headBox.x + headBox.w, y: headBox.y };
        const sumTo = c.map((cell, i) => cell.sum ? up({ x: at(cell.sum).x + cell.sum.offsetWidth, y: at(cell.sum).y }, i) : p0);
        const sumK = sum && c[0].sum ? font(c[0].sum) / font(sum) : 1;
        const geo: Omit<IGeo, 't'> = {
            pre: (joinFrom - scenePos.y) / H,
            path,
            // Длина пути падения – по точкам сплайна (они через равные доли длины)
            fallLen: path.reduce((len, p, i) => i ? len + Math.hypot(p.x - path[i - 1].x, p.y - path[i - 1].y) : 0, 0),
            land,
            rail: railBox,
            lift,
            label: labelAt,
            labelTo,
            labelK,
            sum: sumAtBox,
            sumTo,
            sumK,
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
            shift,
            gatherLen: [],
            rowW: c[0].row?.offsetWidth ?? 0
        };
        // Сборка строки: самая дальняя часть – сдвиг и изменение размера (подпись и сумма сжимаются в ячейку)
        const far = (a: IPoint, b: IPoint, size: number) => Math.hypot(b.x - a.x, b.y - a.y) + size / 2;
        geo.gatherLen = monthlyRows.map((_, i) => {
            const [a, b] = monthlyRanges[i].map(scalePos);
            const lw = labels[i]?.offsetWidth ?? 0;
            const cap = geo.capTo[i];
            const ball = { x: railBox.x + b * railBox.w, y: railBox.y + CAP / 2 };
            return Math.max(
                far(labelAt, labelTo[i], lw * (1 - labelK)),
                far(sumAtBox, sumTo[i], (sum?.offsetWidth ?? 0) * (1 - sumK)),
                Math.hypot(cap.x - a * railBox.w, cap.y) + Math.abs((b - a) * railBox.w - cap.w),
                Math.hypot(geo.dot[i].x - ball.x, geo.dot[i].y - lift[i] - ball.y)
            );
        });
        const tm = timesFor(geo, H);
        setG({ ...geo, t: tm });
        total.set(tm.path);
        pinY.set(scenePos.y);
        screenH.set(H);
        pre.set((joinFrom - scenePos.y) / H);

        // Линия под шапкой и таблица с пояснениями в последнем кадре (таблица опущена на shift), от верха экрана:
        // Terms на том же экране роняет эту линию на темы, она стирает над собой таблицу
        const headLine = c[0].line;
        layoutTop.set(tableBox.y + shift);
        if (headLine) {
            const p = at(headLine);
            monthlyEnd.set({
                x: p.x, y: p.y + shift, w: headLine.offsetWidth,
                wide: { x: tableBox.x, w: tableBox.w }, bottom: tableBox.y + tableBox.h + shift
            });
        }
    }, [rider, pinY, screenH, pre, layoutTop, total]);

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
            monthlyEnd.set(null);
        };
    }, [rider, measure]);

    // Шарик сорвался – настоящий в HowWeWork прячется в тот же кадр
    const syncRider = useCallback(() => riderLeft.set(howTook.get() && time.get() >= g.t.fall[0] ? 1 : 0), [time, g]);
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
    const frame = useTransform(time, (v) => span(v, -.5, .2));
    const frameY = useTransform(time, (v) => g.shift * move(win(v, g.t.center)));
    // Крупная шкала: линия прорисовывается из-под шара
    const scaleOn = useTransform(time, (v) => scaleOpacity(v, g.t));
    const ticksOn = useTransform(time, (v) => scaleOpacity(v, g.t, 1));
    const lineSX = useTransform(time, (v) => move(win(v, g.t.draw)));
    const unitOn = useTransform(time, (v) => win(v, g.t.unit));

    const rowRefs = (i: number): IRowRefs => ({
        row: (el) => { cells.current[i].row = el },
        label: (el) => { cells.current[i].label = el },
        track: (el) => { cells.current[i].track = el },
        sum: (el) => { cells.current[i].sum = el },
        line: (el) => { cells.current[i].line = el }
    });

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${s.scene}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${(g.t.path + terms + faq) * 100}vh)` } as CSSProperties}
            aria-labelledby="monthly-title"
        >
            <div ref={screen} className={`${sc.screen} ${s.screen}`}>
                <motion.div ref={frameEl} className={s.frame} style={{ y: frameY }}>
                    <motion.h2 id="monthly-title" className={`${ralewayBold.className} ${t.title}`} style={{ opacity: titleOn }}>
                        <Rise progress={time} from={-.6} dur={.2}>{sections.monthly.title}</Rise>
                    </motion.h2>
                    <motion.p className={t.description} style={{ opacity: titleOn }}>
                        <Rise progress={time} from={-.54} dur={.2}>{sections.monthly.text}</Rise>
                    </motion.p>

                    <motion.div ref={layout} className={m.layout} style={{ clipPath: wipe }}>
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
                            {monthlyRows.map((_, i) => <Row key={i} time={time} t={g.t} i={i} refs={rowRefs(i)} frame={frame} />)}
                        </div>
                        <ul className={m.notes}>
                            {monthlyNotes.map((_, i) => <Note key={i} time={time} t={g.t} i={i} side={noteSide} noteRef={(el) => { notes.current[i] = el }} />)}
                        </ul>
                    </motion.div>
                </motion.div>

                {/* Крупная сцена – дубль строк для глаза; читается таблица выше */}
                <div ref={stage} className={s.stage} aria-hidden="true">
                    <div ref={bigHead} className={s.bigHead} />
                    <motion.div className={s.bigScale} style={{ opacity: ticksOn }}>
                        {monthlyScale.map((v) => <BigTick key={v} time={time} t={g.t} value={v} />)}
                    </motion.div>
                    <div ref={rail} className={s.rail}>
                        <motion.div className={s.axis} style={{ opacity: scaleOn }}>
                            <motion.span className={s.line} style={{ scaleX: lineSX }} />
                            {marks.map((v) => <Mark key={v} time={time} t={g.t} value={v} />)}
                            <motion.span className={s.unitLabel} style={{ opacity: unitOn }}>{monthlyUnit}</motion.span>
                        </motion.div>
                    </div>
                    {monthlyRows.map((_, i) => (
                        <Block
                            key={i}
                            time={time}
                            g={g}
                            i={i}
                            refs={{ label: (el) => { bigLabels.current[i] = el }, sum: i ? undefined : (el) => { bigSum.current = el } }}
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
