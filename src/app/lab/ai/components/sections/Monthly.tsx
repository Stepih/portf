"use client";

import { FC, RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import s from './Sections.module.scss'
import m from './Monthly.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import Rise from "../Rise";
import { clamp01, easeOut, easeOutBack, offsetIn, span, SMOOTH } from "../scene";
import { howJoin, howTook, howTrackEl, riderLeft } from "../c/handoff";
import { monthlyHeads, monthlyNotes, monthlyRanges, monthlyRows, monthlyScale, sections } from "../../placeholders";

// Шкала – логарифмическая, от 100 до 20 000 ₽ в месяц: разброс «от 200 до 2 300» и «от 2 500 до 10 600» виден глазом
const MIN = 100;
const MAX = 20000;
const pos = (v: number) => Math.log10(v / MIN) / Math.log10(MAX / MIN);

// Капсула диапазона: выезжает от начала шкалы точкой, едет и растягивается до своих границ
const Capsule: FC<{ progress: MotionValue<number>, i: number, range: number[] }> = ({ progress, i, range }) => {
    const reduceMotion = usePrefersReducedMotion();
    const [a, b] = range.map(pos);
    const ratio = a / (b - a);
    const k = (v: number) => span(v, .1 + i * .12, .45);
    const x = useTransform(progress, (v) => `${-ratio * (1 - easeOutBack(k(v))) * 100}%`);
    const scaleX = useTransform(progress, (v) => .08 + .92 * easeOut(span(k(v), .2, .8)));
    const opacity = useTransform(progress, (v) => span(k(v), 0, .15));

    return (
        <motion.span
            className={m.capsule}
            style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%`, ...(reduceMotion ? {} : { x, scaleX, opacity }) }}
            aria-hidden="true"
        />
    );
};

// ---------- Стык с HowWeWork (десктоп варианта C) ----------
// Малый шарик скатывается с конца линии шагов, падает по дуге справа от шага 5, огибает подпись раздела снизу
// и садится в начало шкалы первой строки (100 ₽); там становится чернильной точкой и делится на три: две
// скатываются к началу шкал своих строк, каждая точка растягивается в капсулу. Время – доля прогресса стыка
const T = {
    // Срывается с линии и летит, в конце – маленький отскок
    fly: [.02, .4],
    // Сел – сжимается до точки шкалы и заливается чернилами
    ink: [.47, .05],
    // Точка делится: копия шарика пропадает, на её месте – три точки-капсулы
    split: .525,
    // Точки 2 и 3 скатываются к своим строкам
    roll: (i: number) => [.53 + (i - 1) * .04, .12],
    // Точка растягивается в капсулу
    stretch: (i: number) => [.55 + i * .07, .26],
    note: (i: number) => [.62 + i * .08, .22],
    title: [.16, .14],
    text: [.21, .14]
};
// Диаметр точки = высота шкалы (.track в Monthly.module.scss); шарик – как .rider, 22px
const DOT = 14;
const BALL = 22;
// Длина стыка, в экранах скролла
const JOIN = .65;

interface IPoint { x: number, y: number }
interface IGeo {
    // Путь шарика: точки через равные доли длины, от конца линии шагов до начала первой шкалы
    path: IPoint[],
    // На сколько ниже первой шкалы начала шкал строк
    rows: number[]
}
const noGeo: IGeo = { path: [{ x: 0, y: 0 }], rows: [0, 0, 0] };
// Замеры – в ref, tick растёт с каждым замером: по нему пересчитываются позиции
interface IGeoSource { ref: RefObject<IGeo>, tick: MotionValue<number> }

// Сплайн Catmull–Rom через опорные точки, разбитый на точки через равные доли длины
const samplePath = (pts: IPoint[], n = 240) => {
    const dense: IPoint[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        for (let j = 0; j < 40; j++) {
            const t = j / 40, t2 = t * t, t3 = t2 * t;
            const c = (a: number, b: number, c: number, d: number) =>
                .5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
            dense.push({ x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) });
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
        const k = (d - len[j]) / ((len[j + 1] - len[j]) || 1);
        out.push({ x: dense[j].x + (dense[j + 1].x - dense[j].x) * k, y: dense[j].y + (dense[j + 1].y - dense[j].y) * k });
    }
    return out;
};

// Доля пути шарика к прогрессу: с места – с ускорением, как падение кусков линии; в конце – отскок, px
const flight = (v: number) => {
    const k = span(v, T.fly[0], T.fly[1]);
    return { s: k < .85 ? (k / .85) ** 2 : 1, hop: k > .85 ? Math.sin(Math.PI * (k - .85) / .15) * 10 : 0 };
};
const pointAt = (path: IPoint[], s: number) => {
    const n = path.length - 1;
    if (!n) return path[0];
    const f = s * n;
    const i = Math.min(n - 1, Math.floor(f));
    const a = path[i], b = path[i + 1];
    return { x: a.x + (b.x - a.x) * (f - i), y: a.y + (b.y - a.y) * (f - i) };
};

// Копия малого шарика: летит над обоими разделами, садится и становится чернильной точкой шкалы
const Ball: FC<{ progress: MotionValue<number>, geo: IGeoSource }> = ({ progress, geo }) => {
    const x = useTransform([progress, geo.tick], ([v]: number[]) => pointAt(geo.ref.current.path, flight(v).s).x - BALL / 2);
    const y = useTransform([progress, geo.tick], ([v]: number[]) => pointAt(geo.ref.current.path, flight(v).s).y - BALL / 2 - flight(v).hop);
    const scale = useTransform(progress, (v) => 1 - (1 - DOT / BALL) * easeOut(span(v, T.ink[0], T.ink[1])));
    const ink = useTransform(progress, (v) => span(v, T.ink[0], T.ink[1]));
    const opacity = useTransform(progress, (v) => v >= T.fly[0] && v < T.split ? 1 : 0);

    return (
        <motion.span className={`${s.rider} ${m.ball}`} style={{ x, y, scale, opacity }} aria-hidden="true">
            <motion.span className={m.ballInk} style={{ opacity: ink }} />
        </motion.span>
    );
};

// Капсула в стыке: точка там, где села копия шарика (у строк 2 и 3 – скатывается к своей шкале), и растягивается
// от начала шкалы до своих границ
const DotCapsule: FC<{ progress: MotionValue<number>, geo: IGeoSource, i: number, range: number[] }> = ({ progress, geo, i, range }) => {
    const [a, b] = range.map(pos);
    const [rollFrom, rollDur] = T.roll(i);
    const [from, dur] = T.stretch(i);
    // Скатывается вниз с ускорением и маленьким отскоком – как куски линии шагов
    const y = useTransform([progress, geo.tick], ([v]: number[]) => {
        if (!i) return 0;
        const k = span(v, rollFrom, rollDur);
        const fall = k < .8 ? (k / .8) ** 2 : 1 - Math.sin(Math.PI * (k - .8) / .2) * .06;
        return -geo.ref.current.rows[i] * (1 - fall);
    });
    const left = useTransform(progress, (v) => `${a * 100 * easeOutBack(span(v, from, dur))}%`);
    const width = useTransform(progress, (v) => {
        const k = easeOut(span(v, from + dur * .15, dur * .85));
        return `calc(${DOT * (1 - k)}px + ${(b - a) * 100 * k}%)`;
    });
    const opacity = useTransform(progress, (v) => v >= T.split ? 1 : 0);

    return <motion.span className={m.capsule} style={{ left, width, y, opacity }} aria-hidden="true" />;
};

// Правый край самой дальней капсулы, доля шкалы: по нему проявляются отметки
const reach = (v: number) => v < T.ink[0] ? -1 : Math.max(...monthlyRanges.map((range, i) => {
    const [a, b] = range.map(pos);
    const [from, dur] = T.stretch(i);
    return a * easeOutBack(span(v, from, dur)) + (b - a) * easeOut(span(v, from + dur * .15, dur * .85));
}));

const Tick: FC<{ progress?: MotionValue<number>, v: number }> = ({ progress, v }) => {
    const p = pos(v);
    // Без стыка – видна сразу: источник – постоянная, чтобы хуки не зависели от пропа
    const still = useMotionValue(1);
    const opacity = useTransform(progress ?? still, (k) => progress ? span(reach(k), p - .02, .06) : 1);
    return <motion.span className={m.tick} style={{ left: `${p * 100}%`, opacity }}>{v.toLocaleString('ru-RU')} ₽</motion.span>;
};

// Пояснение въезжает справа, когда его капсула доехала
const Note: FC<{ progress: MotionValue<number>, i: number, text: string, linked: boolean }> = ({ progress, i, text, linked }) => {
    const reduceMotion = usePrefersReducedMotion();
    const [from, dur] = linked ? T.note(i) : [.35 + i * .12, .35];
    const k = (v: number) => span(v, from, dur);
    const x = useTransform(progress, (v) => 60 * (1 - easeOut(k(v))));
    const opacity = useTransform(progress, (v) => k(v));
    return <motion.li className={m.note} style={reduceMotion ? { x: 0, opacity: 1 } : { x, opacity }}>{text}</motion.li>;
};

// Каждый месяц: модель и сервер (макет page_C_ai). У каждой строки – капсула диапазона на общей шкале:
// капсулы выезжают от нуля и растягиваются до своих сумм, пояснения въезжают справа.
// Десктоп варианта C – стык с HowWeWork: шарик с конца линии шагов падает в начало шкалы и делится на капсулы
const Monthly: FC = () => {
    const reduceMotion = usePrefersReducedMotion();
    const section = useRef<HTMLElement>(null);
    const description = useRef<HTMLParagraphElement>(null);
    const scale = useRef<HTMLSpanElement>(null);
    const tracks = useRef<(HTMLSpanElement | null)[]>([]);
    const table = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: table, offset: ['start 0.9', 'start 0.3'] });
    const progress = useSpring(scrollYProgress, SMOOTH);

    // Стык – только на десктопе варианта C: там у шагов HowWeWork тела и он отдаёт свою дорожку
    const [rider, setRider] = useState<HTMLElement | null>(null);
    useEffect(() => { setRider(howJoin.get()?.steps ? howTrackEl.get() : null) }, []);
    useMotionValueEvent(howTrackEl, 'change', (el) => setRider(howJoin.get()?.steps ? el : null));
    useMotionValueEvent(howJoin, 'change', (j) => setRider(j?.steps ? howTrackEl.get() : null));
    const linked = rider !== null && !reduceMotion;

    // Прогресс стыка – от кадра, где экран AgentDeck отпустил скролл (howTook): раньше линию шагов рисует копия сцены,
    // и шарик с неё срываться не должен. Длина – JOIN экрана скролла
    const { scrollY } = useScroll();
    const joinFrom = useMotionValue(0);
    const joinLen = useMotionValue(1);
    const joinRaw = useTransform([scrollY, joinFrom, joinLen, howTook], ([y, from, len, took]: number[]) => took ? clamp01((y - from) / len) : 0);
    const join = useSpring(joinRaw, SMOOTH);
    const geoRef = useRef<IGeo>(noGeo);
    const geoTick = useMotionValue(0);
    const geo = useMemo(() => ({ ref: geoRef, tick: geoTick }), [geoTick]);

    // Путь шарика и места точек – без transform, от верхнего левого угла раздела
    const measure = useCallback(() => {
        const sec = section.current;
        const desc = description.current;
        const sc = scale.current;
        const first = tracks.current[0];
        if (!linked || !rider || !sec || !desc || !sc || !first) return;
        const base = offsetIn(sec, document.body);
        const rel = (el: HTMLElement) => {
            const p = offsetIn(el, document.body);
            return { x: p.x - base.x, y: p.y - base.y };
        };
        const tr = rel(rider);
        const start = { x: tr.x + rider.offsetWidth, y: tr.y + rider.offsetHeight / 2 };
        const t0 = rel(first);
        const land = { x: t0.x + DOT / 2, y: t0.y + first.offsetHeight / 2 };
        // Дуга огибает подпись снизу – между ней и отметками шкалы
        const sweep = (rel(desc).y + desc.offsetHeight + rel(sc).y) / 2;
        // Справа – за текстом шага 5, но не за краем экрана
        const right = Math.min(start.x + 125, document.documentElement.clientWidth - base.x - BALL);
        const path = samplePath([
            start,
            { x: start.x + 55, y: start.y + 3 },
            { x: right, y: start.y + 70 },
            { x: right, y: sweep - 80 },
            { x: right - 90, y: sweep - 2 },
            { x: land.x + 170, y: sweep + 8 },
            land
        ]);
        const rows = tracks.current.map((el) => el ? rel(el).y - t0.y : 0);
        geoRef.current = { path, rows };
        geoTick.set(geoTick.get() + 1);
        // Экран сцены отпускает скролл, когда линия шагов доезжает до высоты шара сцены (orbY)
        joinFrom.set(base.y + start.y - (howJoin.get()?.orbY ?? 0));
        joinLen.set(JOIN * window.innerHeight);
    }, [linked, rider, geoTick, joinFrom, joinLen]);

    useLayoutEffect(() => {
        if (!linked) return;
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        if (section.current) observer.observe(section.current);
        const how = rider?.closest('section');
        if (how) observer.observe(how);
        window.addEventListener('resize', measure);
        // Высота шара сцены (orbY) меняется вместе с экраном AgentDeck
        const off = howJoin.on('change', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
            off();
        };
    }, [linked, rider, measure]);

    // Копия шарика вылетела – настоящий в HowWeWork прячется в тот же кадр
    const syncRider = useCallback(() => riderLeft.set(linked && join.get() >= T.fly[0] ? 1 : 0), [linked, join]);
    useMotionValueEvent(join, 'change', syncRider);
    useEffect(() => {
        syncRider();
        return () => riderLeft.set(0);
    }, [syncRider]);

    return (
        <section ref={section} className={`${s.section} ${m.section}`} aria-labelledby="monthly-title">
            <h2 id="monthly-title" className={`${ralewayBold.className} ${s.title}`}>
                {linked ? <Rise progress={join} from={T.title[0]} dur={T.title[1]}>{sections.monthly.title}</Rise> : sections.monthly.title}
            </h2>
            <p ref={description} className={s.description}>
                {linked ? <Rise progress={join} from={T.text[0]} dur={T.text[1]}>{sections.monthly.text}</Rise> : sections.monthly.text}
            </p>

            <div ref={table} className={m.layout}>
                <div role="table" aria-labelledby="monthly-title" className={m.table}>
                    <div className={`${m.row} ${m.head}`} role="row">
                        <span role="columnheader">{monthlyHeads[0]}</span>
                        <span ref={scale} className={m.scale} role="columnheader">
                            {monthlyScale.map((v) => <Tick key={`${v}-${linked}`} progress={linked ? join : undefined} v={v} />)}
                        </span>
                        <span role="columnheader">{monthlyHeads[2]}</span>
                    </div>
                    {monthlyRows.map((row, i) => (
                        <div key={i} className={m.row} role="row">
                            <span role="cell">{row[0]}<span className={s.muted}> · {row[1]}</span></span>
                            <span ref={(el) => { tracks.current[i] = el }} className={m.track} role="presentation">
                                {linked
                                    ? <DotCapsule progress={join} geo={geo} i={i} range={monthlyRanges[i]} />
                                    : <Capsule progress={progress} i={i} range={monthlyRanges[i]} />}
                            </span>
                            <b className={`${ralewayBold.className} ${m.value}`} role="cell">{row[2]}</b>
                        </div>
                    ))}
                </div>
                <ul className={m.notes}>
                    {monthlyNotes.map((note, i) => <Note key={`${i}-${linked}`} progress={linked ? join : progress} i={i} text={note} linked={linked} />)}
                </ul>
            </div>

            {linked && <Ball progress={join} geo={geo} />}
        </section>
    );
};

export default Monthly;
