"use client";

import { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import s from '../sections/Sections.module.scss'
import cs from './CtaScene.module.scss'
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import FinalCta from "../sections/FinalCta";
import { durFor, easeOut, fadeFor, lerp, move, offsetIn, span, useSceneTime } from "../scene";
import { faqLineTook, faqListEl, faqOn, faqRelease } from "./handoff";

// ---------- Время ----------
// В экранах скролла от кадра, где липкий экран финала встал поверх низа FAQ. Настоящий FAQ уезжает вверх, нижняя
// линия его списка остаётся на экране: чернеет и толстеет (ink), стягивается к середине (shrink) и становится шариком
// (ball); шарик поднимается к ряду кнопок и растёт (lift). С stage – прежняя анимация FinalCta: шар растёт, делится
// на два круга, они разъезжаются и вытягиваются в кнопки – по скроллу, на неподвижном экране.
// Единая скорость (speed.ts): окна – от путей из замеров, [от, до]. Внутри stage самое длинное движение – кнопки
// разъезжаются (APART в FinalCta, 0,28 окна): окно не короче их пути
interface ITimes { ink: number[], shrink: number[], ball: number[], lift: number[], stage: number[], path: number }
const timesFor = (g: IGeo, h: number): ITimes => {
    const d = (px: number) => durFor(px, h);
    const fade = fadeFor(h);
    const at = (from: number, dur: number) => [from, from + dur];
    const ink = at(0, fade);
    const shrink = at(ink[1], Math.max(fade, d(g.line.w)));
    const ball = at(shrink[1] - fade * .5, fade);
    const lift = at(ball[1], Math.max(fade, d(Math.hypot(g.row.x - (g.line.x + g.line.w / 2), g.row.y - g.line.y))));
    const stage = at(lift[1], Math.max(.72, d(g.apart) / .28));
    return { ink, shrink, ball, lift, stage, path: stage[1] + .1 };
};
// Шарик – 22px; шар финала в первом кадре – 0,3 от 96px
const RIDER = 22;
const ORB_FROM = 96 * .3;

interface IGeo {
    // Нижняя линия списка FAQ в кадре, где экран встал, и центр ряда кнопок – от левого верха экрана; apart – путь
    // кнопки от центра ряда до своего места
    line: { x: number, y: number, w: number },
    row: { x: number, y: number },
    apart: number
}
const noTimes = timesFor({ line: { x: 0, y: 0, w: 800 }, row: { x: 0, y: 300 }, apart: 150 }, 900);

const Scene: FC<{ tgHref: string, list: HTMLElement }> = ({ tgHref, list }) => {
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const row = useRef<HTMLDivElement | null>(null);
    const [g, setG] = useState<(IGeo & { t: ITimes }) | null>(null);
    const [live, setLive] = useState(false);

    const { scrollY } = useScroll();
    const pinY = useMotionValue(0);
    const screenH = useMotionValue(1);
    const raw = useTransform([scrollY, pinY, screenH], ([y, pin, h]: number[]) => (y - pin) / h);
    const time = useSceneTime(raw);
    const t = g?.t ?? noTimes;
    const stage = useTransform(time, (v) => span(v, t.stage[0], t.stage[1] - t.stage[0]));

    const measure = useCallback(() => {
        const sec = scene.current;
        const scr = screen.current;
        const r = row.current;
        if (!sec || !scr || !r) return;
        sec.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
        // Экран встаёт в кадре, где экраны FAQ отпускают скролл: сцена заходит на FAQ ровно настолько
        const natural = offsetIn(sec, document.body).y - (parseFloat(sec.style.marginTop) || 0);
        sec.style.marginTop = `${faqRelease.get() - natural}px`;
        const pin = offsetIn(sec, document.body);
        const at = offsetIn(list, document.body);
        const rowAt = offsetIn(r, scr);
        // Кнопки ряда (FinalCta, .slot): дальняя от центра ряда
        const slots = [...r.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el.tagName === 'SPAN' && el.offsetWidth > 0);
        const apart = Math.max(0, ...slots.map((el) => Math.abs(r.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2))));
        const geo = {
            line: { x: at.x - pin.x, y: at.y + list.offsetHeight - 1.5 - pin.y, w: list.offsetWidth },
            row: { x: rowAt.x + r.offsetWidth / 2, y: rowAt.y + r.offsetHeight / 2 },
            apart
        };
        setG({ ...geo, t: timesFor(geo, scr.offsetHeight) });
        pinY.set(pin.y);
        screenH.set(scr.offsetHeight);
    }, [list, pinY, screenH]);

    useLayoutEffect(() => {
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        if (scene.current) observer.observe(scene.current);
        observer.observe(list);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [measure, list]);

    useMotionValueEvent(faqRelease, 'change', measure);

    // Экран встал – линию у списка FAQ забирает сцена (по скроллу: в этот кадр список и копия совпадают)
    useMotionValueEvent(raw, 'change', (v) => faqLineTook.set(v >= 0 ? 1 : 0));
    useEffect(() => {
        faqLineTook.set(raw.get() >= 0 ? 1 : 0);
        return () => faqLineTook.set(0);
    }, [raw]);
    // Кнопки нажимаются, когда у них проявились подписи: до того экран пропускает клики к FAQ под ним
    useMotionValueEvent(stage, 'change', (v) => setLive(v > .8));

    const win = (v: number, [a, b]: number[]) => span(v, a, b - a);
    const lineX = useTransform(time, (v) => g ? g.line.x + g.line.w / 2 * move(win(v, t.shrink)) : 0);
    const lineW = useTransform(time, (v) => g ? g.line.w * (1 - move(win(v, t.shrink))) : 0);
    const lineY = g?.line.y ?? 0;
    const ink = useTransform(time, (v) => win(v, t.ink));
    const thick = useTransform(ink, (k) => 1 + k);
    const lineOn = useTransform([raw, time], ([r, v]: number[]) => r >= 0 && v < t.shrink[1] ? 1 : 0);

    // Шарик: вырастает на середине линии, дугой поднимается к центру ряда кнопок, растёт до шара финала
    const ballX = useTransform(time, (v) => g ? lerp(g.line.x + g.line.w / 2, g.row.x, move(win(v, t.lift))) : 0);
    const ballY = useTransform(time, (v) => g ? lerp(g.line.y, g.row.y, move(win(v, t.lift))) : 0);
    const ballScale = useTransform(time, (v) =>
        easeOut(win(v, t.ball)) * lerp(1, ORB_FROM / RIDER, move(span(win(v, t.lift), .5, .5))));
    const ballOn = useTransform(time, (v) => v > t.stage[0] ? 0 : 1);

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${cs.scene}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${t.path * 100}vh)` } as CSSProperties}
        >
            <div ref={screen} className={`${sc.screen} ${cs.screen} ${live ? cs.live : ''}`}>
                <motion.span className={cs.line} style={{ x: lineX, y: lineY, width: lineW, scaleY: thick, opacity: lineOn }} aria-hidden="true">
                    <motion.span className={cs.ink} style={{ opacity: ink }} />
                </motion.span>
                <motion.span className={`${s.rider} ${cs.ball}`} style={{ x: ballX, y: ballY, scale: ballScale, opacity: ballOn }} aria-hidden="true" />
                <FinalCta tgHref={tgHref} staged={stage} rowRef={(el) => { row.current = el }} />
            </div>
        </section>
    );
};

// Финал варианта C: на десктопе, после сцены FAQ – липкий экран, связанный с FAQ линией (Scene); иначе – обычный
// FinalCta, шар растёт по скроллу, как в A и B
const CtaScene: FC<{ tgHref: string }> = ({ tgHref }) => {
    const reduceMotion = usePrefersReducedMotion();
    const [on, setOn] = useState(false);
    const [list, setList] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setOn(faqOn.get());
        setList(faqListEl.get());
    }, []);
    useMotionValueEvent(faqOn, 'change', setOn);
    useMotionValueEvent(faqListEl, 'change', setList);

    return on && list && !reduceMotion ? <Scene tgHref={tgHref} list={list} /> : <FinalCta tgHref={tgHref} />;
};

export default CtaScene;
