"use client";

import { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import s from '../sections/Sections.module.scss'
import t from '../sections/Terms.module.scss'
import ts from './TermsScene.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import Rise from "../Rise";
import { clamp01, drop, durFor, easeOut, fadeFor, lerp, move, offsetIn, span, useSceneTime, useValue } from "../scene";
import { faqOn, faqPath, IMonthlyEnd, monthlyGone, monthlyWipe, termsBallTook, termsEnd, termsGone, termsPath, termsWipe } from "./handoff";
import { sections, terms } from "@/data/aiPage";

// ---------- Время ----------
// В экранах скролла от кадра, где липкий экран раздела встал поверх последнего экрана «Каждый месяц», минус LEAD.
// Линия под шапкой таблицы чернеет и становится толще – шапка над ней стёрта; линия падает до низа таблицы,
// растянувшись на неё с пояснениями, и стирает их над собой. Сетка тем на том же экране выше низа таблицы: после
// отскока линия спокойно всплывает к её верху, пока выезжает заголовок, и, качнувшись, делится на разделители тем
// первого ряда, снова волосяная. На правом конце первого ряда вырастает шарик и змейкой рисует линии следующих рядов:
// спуск на ряд, проезд вдоль. Единая скорость (speed.ts): окна – от путей из замеров (timesFor), окно – [начало, длительность]
const LEAD = .12;
type W = [number, number];
interface ITimes {
    ink: W, fall: W, widen: W, rise: W, title: number, split: W, grow: W,
    // Ряд r ≥ 1: спуск шарика и проезд
    rows: { drop: W, roll: W }[],
    out: W, path: number
}
// Текст тем выезжает из-под линии; соседние темы – с шагом col
const TEXT = { label: .02, items: .05, item: .025, col: .035, dur: .14 };
// Шарик на спуске уходит наружу ряда дугой и чуть подпрыгивает на посадке
const BULGE = 40;
const HOP = 10;
const win = (v: number, [a, d]: W) => span(v, a, d);
const end = ([a, d]: W) => a + d;

interface IPoint { x: number, y: number }
interface IBox extends IPoint { w: number }
interface IRow { y: number, left: number, right: number, items: number[] }
// Замеры без transform, от левого верха сетки: линия под шапкой, ширина и низ таблицы с пояснениями, темы и ряды;
// top – верх сетки от верха экрана
interface IGeo { line: IBox, wide: { x: number, w: number }, bottom: number, topics: IBox[], rows: IRow[], top: number, t: ITimes }

// Ряд r ≥ 1 едет навстречу прошлому: нечётные – справа налево. Начало ряда – там, где кончился прошлый
const fromX = (row: IRow, r: number) => r % 2 ? row.right : row.left;
const toX = (row: IRow, r: number) => r % 2 ? row.left : row.right;

const timesFor = (g: Omit<IGeo, 't'>, h: number): ITimes => {
    const d = (px: number) => durFor(px, h);
    const fade = fadeFor(h);
    const ink: W = [0, fade * .5];
    // Падение: 80% окна – с ускорением, 20% – отскок
    const fall: W = [end(ink), Math.max(fade, d(Math.abs(g.bottom - g.line.y)) / .8)];
    const widen: W = [fall[0], Math.max(fall[1] * .3, d(Math.max(Math.abs(g.wide.w - g.line.w), Math.abs(g.wide.x - g.line.x))))];
    const row0 = g.rows[0] ?? { y: 0, left: 0, right: 0, items: [] };
    const w0 = row0.right - row0.left;
    const rise: W = [end(fall) + .02, Math.max(fade, d(Math.max(Math.abs(g.bottom - row0.y), Math.abs(w0 - g.wide.w), Math.abs(row0.left - g.wide.x))))];
    const n = row0.items.length || 1;
    const splitPx = Math.max(0, ...row0.items.map((it, j) => {
        const to = g.topics[it];
        return to ? Math.max(Math.abs(to.x - (row0.left + j * w0 / n)), Math.abs(to.w - w0 / n)) : 0;
    }));
    const split: W = [end(rise), Math.max(fade * 1.5, d(splitPx))];
    const grow: W = [end(split) + .04, fade];
    let at = end(grow);
    let p: IPoint = { x: row0.right, y: row0.y };
    const rows = g.rows.map((row, r) => {
        if (!r) return { drop: [0, 0] as W, roll: [0, 0] as W };
        const dropW: W = [at, Math.max(fade, d(Math.hypot(fromX(row, r) - p.x, row.y - p.y) + BULGE) / .85)];
        const roll: W = [end(dropW), Math.max(fade, d(row.right - row.left))];
        at = end(roll);
        p = { x: toX(row, r), y: row.y };
        return { drop: dropW, roll };
    });
    const out: W = [at, fade];
    return { ink, fall, widen, rise, title: rise[0] + rise[1] * .2, split, grow, rows, out, path: LEAD + end(out) + .02 };
};
const geo0: Omit<IGeo, 't'> = { line: { x: 0, y: 0, w: 0 }, wide: { x: 0, w: 0 }, bottom: 300, topics: [], rows: [], top: 0 };
const noGeo: IGeo = { ...geo0, t: timesFor(geo0, 900) };

// Падающая линия: с ускорением до низа таблицы, короткий отскок, затем всплывает к верху сетки
const lineY = (v: number, g: IGeo) => {
    const f = win(v, g.t.fall);
    const fall = f < .8 ? drop(f / .8) : 1 - Math.sin(Math.PI * (f - .8) / .2) * .06;
    const down = lerp(g.line.y, g.bottom, fall);
    return lerp(down, g.rows[0]?.y ?? down, move(win(v, g.t.rise)));
};
// Докуда стёрто: самая низкая точка линии – при всплытии таблица не возвращается
const wipeY = (v: number, g: IGeo) => v >= end(g.t.fall) ? g.bottom + 20 : lineY(v, g);
// Края линии: в начале падения растягивается на таблицу с пояснениями, пока всплывает – по ширине сетки
const lineBox = (v: number, g: IGeo) => {
    const wide = move(win(v, g.t.widen));
    const narrow = move(win(v, g.t.rise));
    const row = g.rows[0];
    const x = lerp(lerp(g.line.x, g.wide.x, wide), row?.left ?? 0, narrow);
    const w = lerp(lerp(g.line.w, g.wide.w, wide), row ? row.right - row.left : 0, narrow);
    return { x, w };
};
// Чёрная и вдвое толще – от отрыва до деления
const inkOf = (v: number, t: ITimes) => win(v, t.ink) * (1 - span(v, t.split[0], .08));

const rollX = (v: number, g: IGeo, r: number) => {
    const row = g.rows[r];
    return lerp(fromX(row, r), toX(row, r), move(win(v, g.t.rows[r].roll)));
};

// Шарик: вырастает на конце первого ряда, по рядам – спуск и проезд, на конце последнего гаснет
const ballAt = (v: number, g: IGeo) => {
    const first = g.rows[0];
    if (!first || g.rows.length < 2) return { x: 0, y: 0, scale: 0 };
    let p: IPoint = { x: first.right, y: first.y };
    let scale = easeOut(win(v, g.t.grow));
    for (let r = 1; r < g.rows.length; r++) {
        const row = g.rows[r];
        const { drop: dw, roll } = g.t.rows[r];
        if (v < dw[0]) return { ...p, scale };
        if (v < end(dw)) {
            const f = win(v, dw);
            const side = r % 2 ? 1 : -1;
            const fall = f < .85 ? drop(f / .85) : 1;
            const hop = f > .85 ? Math.sin(Math.PI * (f - .85) / .15) * HOP : 0;
            return { x: lerp(p.x, fromX(row, r), move(f)) + side * BULGE * Math.sin(Math.PI * f), y: lerp(p.y, row.y, fall) - hop, scale };
        }
        p = { x: rollX(v, g, r), y: row.y };
        if (v < end(roll)) return { ...p, scale };
    }
    // Дальше шарик везёт FaqScene – здесь он не гаснет
    if (!faqOn.get()) scale *= 1 - win(v, g.t.out);
    return { ...p, scale };
};

// Какая доля темы под шариком уже прошла: линия темы тянется за ним
const covered = (v: number, g: IGeo, r: number, box: IBox) => {
    const x = rollX(v, g, r);
    return clamp01(r % 2 ? (box.x + box.w - x) / box.w : (x - box.x) / box.w);
};
// Когда шарик проходит середину темы – оттуда выезжает текст
const passAt = (g: IGeo, r: number, box: IBox) => {
    const [from, dur] = g.t.rows[r].roll;
    for (let j = 0; j <= 60; j++) {
        const v = from + dur * j / 60;
        if (covered(v, g, r, box) >= .5) return v;
    }
    return from + dur;
};

// Кусок падающей линии: до деления все куски – одна линия, после – разделитель над темой первого ряда
const Piece: FC<{ time: MotionValue<number>, g: IGeo, j: number, n: number }> = ({ time, g, j, n }) => {
    const to = g.topics[g.rows[0].items[j]];
    const split = (v: number) => move(win(v, g.t.split));
    const y = useTransform(time, (v) => lineY(v, g));
    const x = useTransform(time, (v) => {
        const b = lineBox(v, g);
        return lerp(b.x + j * b.w / n, to.x, split(v));
    });
    const width = useTransform(time, (v) => lerp(lineBox(v, g).w / n, to.w, split(v)));
    const rotate = useTransform(time, (v) => Math.sin(Math.PI * win(v, g.t.split)) * (j - (n - 1) / 2 || .6) * 1.2);
    const scaleY = useTransform(time, (v) => 1 + inkOf(v, g.t));
    const ink = useTransform(time, (v) => inkOf(v, g.t));
    const opacity = useTransform(time, (v) => v >= g.t.ink[0] ? 1 : 0);
    return (
        <motion.span className={`${t.line} ${ts.piece}`} style={{ x, y, width, rotate, scaleY, opacity }} aria-hidden="true">
            <motion.span className={ts.ink} style={{ opacity: ink }} />
        </motion.span>
    );
};

interface ITopic {
    time: MotionValue<number>,
    g: IGeo,
    i: number,
    title: string,
    items: string[],
    topicRef: (el: HTMLDivElement | null) => void
}

// Тема: в первом ряду линию над ней дают куски упавшей, в следующих – тянется за шариком
const Topic: FC<ITopic> = ({ time, g, i, title, items, topicRef }) => {
    const r = Math.max(0, g.rows.findIndex((row) => row.items.includes(i)));
    const box = g.topics[i];
    const ready = !!box && !!g.rows.length;
    const from = !ready ? 0 : r
        ? passAt(g, r, box)
        : g.t.split[0] + g.t.split[1] * .6 + TEXT.label + g.rows[0].items.indexOf(i) * TEXT.col;
    const line = useTransform(time, (v) => ready && r ? covered(v, g, r, box) : 0);

    return (
        <div ref={topicRef} className={`${s.topic} ${t.topic}`}>
            {r > 0 && (
                <motion.span className={`${t.line} ${r % 2 ? ts.fromRight : ''}`} style={{ scaleX: line }} aria-hidden="true" />
            )}
            <h3 className={`${ralewayBold.className} ${s.topicTitle}`}>
                <Rise progress={time} from={from} dur={TEXT.dur}>{title}</Rise>
            </h3>
            <ul className={`${s.list} ${s.plain}`}>
                {items.map((item, j) => (
                    <li key={j}>
                        <Rise progress={time} from={from + TEXT.items - TEXT.label + j * TEXT.item} dur={TEXT.dur}>
                            <span className={s.bulleted}>{item}</span>
                        </Rise>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// «Что входит и что остаётся вам», десктоп варианта C – продолжение «Каждый месяц» на том же неподвижном экране:
// липкий экран раздела лежит поверх последнего экрана сцены, оба отпускают скролл вместе. Линия под шапкой таблицы
// чернеет, отрывается и падает до её низа, стирая над собой таблицу и пояснения; всплывает к верху сетки, выезжает
// заголовок (заголовок «Каждый месяц» гаснет), линия, качнувшись, делится по темам первого ряда – из-под линий выезжают темы,
// как тела шагов в «Как работаем». На правом конце ряда вырастает шарик (как на линии шагов) и змейкой рисует
// линии следующих рядов: спуск, проезд справа налево, линия тянется за ним, темы выезжают, когда он проходит их
// середину. На конце последнего ряда шарик гаснет
const TermsScene: FC<{ end: IMonthlyEnd }> = ({ end: last }) => {
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const grid = useRef<HTMLDivElement>(null);
    const topics = useRef<(HTMLDivElement | null)[]>([]);
    const [g, setG] = useState<IGeo>(noGeo);

    // Время – от кадра, где экран раздела встал (LEAD – пауза после конца «Каждый месяц»)
    const { scrollY } = useScroll();
    const pinY = useMotionValue(0);
    const screenH = useMotionValue(1);
    const raw = useTransform([scrollY, pinY, screenH], ([y, pin, h]: number[]) => (y - pin) / h - LEAD);
    const time = useSceneTime(raw);
    const faq = useValue(faqPath);

    const measure = useCallback(() => {
        const sec = scene.current;
        const scr = screen.current;
        const gr = grid.current;
        if (!sec || !scr || !gr) return;
        sec.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
        const at = offsetIn(gr, scr);
        const boxes = topics.current.map((el) => el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth } : { x: 0, y: 0, w: 0 });
        // Ряды сетки – по высоте тем
        const rows: IRow[] = [];
        boxes.forEach((b, i) => {
            const row = rows.find((r) => Math.abs(r.y - b.y) < 2);
            if (row) {
                row.items.push(i);
                row.left = Math.min(row.left, b.x);
                row.right = Math.max(row.right, b.x + b.w);
            } else rows.push({ y: b.y, left: b.x, right: b.x + b.w, items: [i] });
        });
        const lastRow = rows.length - 1;
        termsEnd.set(rows.length > 1 ? {
            ball: { x: at.x + toX(rows[lastRow], lastRow), y: at.y + rows[lastRow].y },
            left: at.x + rows[0].left, right: at.x + rows[0].right, bottom: at.y + gr.offsetHeight
        } : null);
        const geo = {
            line: { x: last.x - at.x, y: last.y - at.y, w: last.w }, wide: { x: last.wide.x - at.x, w: last.wide.w },
            bottom: last.bottom - at.y, topics: boxes, rows, top: at.y
        };
        const tm = timesFor(geo, scr.offsetHeight);
        setG({ ...geo, t: tm });
        termsPath.set(tm.path);
        pinY.set(offsetIn(sec, document.body).y);
        screenH.set(scr.offsetHeight);
    }, [last, pinY, screenH]);

    useLayoutEffect(() => {
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        if (scene.current) observer.observe(scene.current);
        if (grid.current) observer.observe(grid.current);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [measure]);
    useEffect(() => () => termsEnd.set(null), []);

    // Линия оторвалась – «Каждый месяц» прячет свою и обрезает над ней таблицу; заголовок гаснет вместе с выездом
    // заголовка раздела
    const sync = useCallback((v: number) => {
        monthlyWipe.set(v >= g.t.ink[0] && g.rows.length ? g.top + wipeY(v, g) : -1);
        monthlyGone.set(span(v, g.t.title - .03, .1));
    }, [g]);
    useMotionValueEvent(time, 'change', sync);
    useEffect(() => {
        sync(time.get());
        return () => {
            monthlyWipe.set(-1);
            monthlyGone.set(0);
        };
    }, [sync, time]);

    const ball = useTransform(time, (v) => ballAt(v, g));
    const ballX = useTransform(ball, (b) => b.x);
    const ballY = useTransform(ball, (b) => b.y);
    const ballScale = useTransform(ball, (b) => b.scale);

    const first = g.rows[0]?.items ?? [];
    // Стык с FAQ: поднимающаяся линия обрезает экран под собой, заголовок гаснет, шарик уходит в FaqScene
    const wipe = useTransform(termsWipe, (w) => w >= 0 ? `inset(0 0 calc(100% - ${w}px) 0)` : 'none');
    const titleOn = useTransform(termsGone, (v) => 1 - v);
    const ballOn = useTransform(termsBallTook, (v) => 1 - v);

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${ts.scene}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${(g.t.path + faq) * 100}vh)` } as CSSProperties}
            aria-labelledby="terms-title"
        >
            <motion.div ref={screen} className={sc.screen} style={{ clipPath: wipe }}>
                <div className={`${s.section} ${ts.frame}`}>
                    <motion.h2 id="terms-title" className={`${ralewayBold.className} ${s.title}`} style={{ opacity: titleOn }}>
                        <Rise progress={time} from={g.t.title} dur={.14}>{sections.terms.title}</Rise>
                    </motion.h2>
                    <motion.p className={s.description} style={{ opacity: titleOn }}>
                        <Rise progress={time} from={g.t.title + .04} dur={.14}>{sections.terms.text}</Rise>
                    </motion.p>

                    <div ref={grid} className={`${s.terms} ${t.grid}`}>
                        {first.map((_, j) => <Piece key={j} time={time} g={g} j={j} n={first.length} />)}
                        <motion.span className={`${s.rider} ${ts.ball}`} style={{ x: ballX, y: ballY, scale: ballScale, opacity: ballOn }} aria-hidden="true" />
                        {terms.map((topic, i) => (
                            <Topic
                                key={topic.title}
                                time={time}
                                g={g}
                                i={i}
                                title={topic.title}
                                items={topic.items}
                                topicRef={(el) => { topics.current[i] = el }}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default TermsScene;
