"use client";

import { FC, useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";

import s from '../sections/Sections.module.scss'
import t from '../sections/Terms.module.scss'
import ts from './TermsScene.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import Rise from "../Rise";
import { clamp01, ease, easeOut, lerp, offsetIn, SMOOTH, span } from "../scene";
import { IMonthlyEnd } from "./handoff";
import { sections, terms } from "../../placeholders";

// ---------- Время ----------
// В экранах скролла от кадра, где экран «Каждый месяц» отпустил скролл (end.release); раздел не липкий.
// Под таблицей слева направо прорисовывается нижняя линия, отрывается и падает на первый ряд тем; к концу падения
// делится на куски по темам и, качнувшись, ложится над ними
const DRAW = [0, .08];
const FALL = [.09, .25];
const SPLIT = .55;
// Текст тем выезжает из-под линии; соседние темы – с шагом col
const TEXT = { label: .02, items: .05, item: .025, col: .035, dur: .14 };
// На правом конце первого ряда вырастает шарик и змейкой рисует линии следующих рядов: спуск на ряд, проезд вдоль
const GROW = [.38, .06];
const DROP = .1;
const ROLL = .28;
const OUT = .05;
const dropAt = (r: number) => GROW[0] + GROW[1] + (r - 1) * (DROP + ROLL);
// Шарик на спуске уходит наружу ряда дугой и чуть подпрыгивает на посадке
const BULGE = 40;
const HOP = 10;

interface IPoint { x: number, y: number }
interface IBox extends IPoint { w: number }
interface IRow { y: number, left: number, right: number, items: number[] }
// Замеры без transform, от левого верха сетки
interface IGeo { line: IBox, topics: IBox[], rows: IRow[] }
const noGeo: IGeo = { line: { x: 0, y: 0, w: 0 }, topics: [], rows: [] };

// Ряд r ≥ 1 едет навстречу прошлому: нечётные – справа налево. Начало ряда – там, где кончился прошлый
const fromX = (row: IRow, r: number) => r % 2 ? row.right : row.left;
const toX = (row: IRow, r: number) => r % 2 ? row.left : row.right;
const rollX = (v: number, g: IGeo, r: number) => {
    const row = g.rows[r];
    return lerp(fromX(row, r), toX(row, r), ease(span(v, dropAt(r) + DROP, ROLL)));
};

// Шарик: вырастает на конце первого ряда, по рядам – спуск и проезд, на конце последнего гаснет
const ballAt = (v: number, g: IGeo) => {
    const first = g.rows[0];
    if (!first || g.rows.length < 2) return { x: 0, y: 0, scale: 0 };
    let p: IPoint = { x: first.right, y: first.y };
    let scale = easeOut(span(v, GROW[0], GROW[1]));
    for (let r = 1; r < g.rows.length; r++) {
        const row = g.rows[r];
        const from = dropAt(r);
        if (v < from) return { ...p, scale };
        if (v < from + DROP) {
            const f = span(v, from, DROP);
            const side = r % 2 ? 1 : -1;
            const fall = f < .85 ? (f / .85) ** 2 : 1;
            const hop = f > .85 ? Math.sin(Math.PI * (f - .85) / .15) * HOP : 0;
            return { x: lerp(p.x, fromX(row, r), f) + side * BULGE * Math.sin(Math.PI * f), y: lerp(p.y, row.y, fall) - hop, scale };
        }
        p = { x: rollX(v, g, r), y: row.y };
        if (v < from + DROP + ROLL) return { ...p, scale };
    }
    scale *= 1 - ease(span(v, dropAt(g.rows.length - 1) + DROP + ROLL, OUT));
    return { ...p, scale };
};

// Какая доля темы под шариком уже прошла: линия темы тянется за ним
const covered = (v: number, g: IGeo, r: number, box: IBox) => {
    const x = rollX(v, g, r);
    return clamp01(r % 2 ? (box.x + box.w - x) / box.w : (x - box.x) / box.w);
};
// Когда шарик проходит середину темы – оттуда выезжает текст
const passAt = (g: IGeo, r: number, box: IBox) => {
    const from = dropAt(r) + DROP;
    for (let j = 0; j <= 60; j++) {
        const v = from + ROLL * j / 60;
        if (covered(v, g, r, box) >= .5) return v;
    }
    return from + ROLL;
};

// Кусок упавшей линии над темой первого ряда: сначала все куски – одна нижняя линия таблицы (прорисовываются
// по очереди), к концу падения расходятся
const Piece: FC<{ time: MotionValue<number>, g: IGeo, j: number, n: number }> = ({ time, g, j, n }) => {
    const to = g.topics[g.rows[0].items[j]];
    const from = { x: g.line.x + j * g.line.w / n, y: g.line.y, w: g.line.w / n };
    const fall = (v: number) => span(v, FALL[0], FALL[1]);
    const split = (v: number) => easeOut(span(fall(v), SPLIT, 1 - SPLIT));
    const y = useTransform(time, (v) => {
        const f = fall(v);
        const drop = f < .8 ? (f / .8) ** 2 : 1 - Math.sin(Math.PI * (f - .8) / .2) * .04;
        return lerp(from.y, to.y, drop);
    });
    const x = useTransform(time, (v) => lerp(from.x, to.x, split(v)));
    const width = useTransform(time, (v) => lerp(from.w, to.w, split(v)));
    const rotate = useTransform(time, (v) => Math.sin(Math.PI * span(fall(v), SPLIT, 1 - SPLIT)) * (j - (n - 1) / 2 || .6) * 4);
    const scaleX = useTransform(time, (v) => clamp01(ease(span(v, DRAW[0], DRAW[1])) * n - j));
    return <motion.span className={`${t.line} ${ts.piece}`} style={{ x, y, width, rotate, scaleX }} aria-hidden="true" />;
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
        : FALL[0] + FALL[1] + TEXT.label + g.rows[0].items.indexOf(i) * TEXT.col;
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

// «Что входит и что остаётся вам», десктоп варианта C – продолжение «Каждый месяц». Раздел не липкий: экран сцены
// отпустил скролл, под её таблицей прорисовывается нижняя линия, отрывается и падает на первый ряд тем, делится по темам и, качнувшись,
// ложится над ними – из-под линий выезжают темы, как тела шагов в «Как работаем». На правом конце ряда вырастает
// шарик (как на линии шагов) и змейкой рисует линии следующих рядов: спуск, проезд справа налево, линия тянется
// за ним, темы выезжают, когда он проходит их середину. На конце последнего ряда шарик гаснет
const TermsScene: FC<{ end: IMonthlyEnd }> = ({ end }) => {
    const grid = useRef<HTMLDivElement>(null);
    const topics = useRef<(HTMLDivElement | null)[]>([]);
    const [g, setG] = useState<IGeo>(noGeo);

    const { scrollY } = useScroll();
    const screenH = useMotionValue(1);
    const raw = useTransform([scrollY, screenH], ([y, h]: number[]) => (y - end.release) / h);
    const time = useSpring(raw, SMOOTH);

    const measure = useCallback(() => {
        const gr = grid.current;
        if (!gr) return;
        const at = offsetIn(gr, document.body);
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
        setG({ line: { x: end.x - at.x, y: end.y - at.y, w: end.w }, topics: boxes, rows });
        screenH.set(window.innerHeight);
    }, [end, screenH]);

    useLayoutEffect(() => {
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        if (grid.current) observer.observe(grid.current);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [measure]);

    const ball = useTransform(time, (v) => ballAt(v, g));
    const ballX = useTransform(ball, (b) => b.x);
    const ballY = useTransform(ball, (b) => b.y);
    const ballScale = useTransform(ball, (b) => b.scale);

    const first = g.rows[0]?.items ?? [];

    return (
        <section className={s.section} aria-labelledby="terms-title">
            <h2 id="terms-title" className={`${ralewayBold.className} ${s.title}`}>
                <Rise progress={time} from={-.22} dur={.16}>{sections.terms.title}</Rise>
            </h2>
            <p className={s.description}>
                <Rise progress={time} from={-.18} dur={.16}>{sections.terms.text}</Rise>
            </p>

            <div ref={grid} className={`${s.terms} ${t.grid}`}>
                {first.map((_, j) => <Piece key={j} time={time} g={g} j={j} n={first.length} />)}
                <motion.span className={`${s.rider} ${ts.ball}`} style={{ x: ballX, y: ballY, scale: ballScale }} aria-hidden="true" />
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
        </section>
    );
};

export default TermsScene;
