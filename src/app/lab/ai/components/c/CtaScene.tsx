"use client";

import { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import s from '../sections/Sections.module.scss'
import cs from './CtaScene.module.scss'
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import FinalCta from "../sections/FinalCta";
import { ease, easeOut, easeOutBack, lerp, offsetIn, SMOOTH, span } from "../scene";
import { faqLineTook, faqListEl, faqOn, faqRelease } from "./handoff";

// ---------- Время ----------
// В экранах скролла от кадра, где липкий экран финала встал поверх низа FAQ. Настоящий FAQ уезжает вверх, нижняя
// линия его списка остаётся на экране: чернеет и толстеет (INK), стягивается к середине (SHRINK) и становится шариком
// (BALL); шарик поднимается к ряду кнопок и растёт (LIFT). С STAGE – прежняя анимация FinalCta: шар растёт, делится
// на два круга, они разъезжаются и вытягиваются в кнопки – по скроллу, на неподвижном экране
const PATH = 1.25;
const INK = [0, .08];
const SHRINK = [.08, .1];
const BALL = [.16, .06];
const LIFT = [.24, .18];
const STAGE = [.42, .72];
// Шарик – 22px; шар финала в первом кадре – 0,3 от 96px
const RIDER = 22;
const ORB_FROM = 96 * .3;

interface IGeo {
    // Нижняя линия списка FAQ в кадре, где экран встал, и центр ряда кнопок – от левого верха экрана
    line: { x: number, y: number, w: number },
    row: { x: number, y: number }
}

const Scene: FC<{ tgHref: string, list: HTMLElement }> = ({ tgHref, list }) => {
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const row = useRef<HTMLDivElement | null>(null);
    const [g, setG] = useState<IGeo | null>(null);
    const [live, setLive] = useState(false);

    const { scrollY } = useScroll();
    const pinY = useMotionValue(0);
    const screenH = useMotionValue(1);
    const raw = useTransform([scrollY, pinY, screenH], ([y, pin, h]: number[]) => (y - pin) / h);
    const time = useSpring(raw, SMOOTH);
    const stage = useTransform(time, (v) => span(v, STAGE[0], STAGE[1]));

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
        setG({
            line: { x: at.x - pin.x, y: at.y + list.offsetHeight - 1.5 - pin.y, w: list.offsetWidth },
            row: { x: rowAt.x + r.offsetWidth / 2, y: rowAt.y + r.offsetHeight / 2 }
        });
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

    const lineX = useTransform(time, (v) => g ? g.line.x + g.line.w / 2 * ease(span(v, SHRINK[0], SHRINK[1])) : 0);
    const lineW = useTransform(time, (v) => g ? g.line.w * (1 - ease(span(v, SHRINK[0], SHRINK[1]))) : 0);
    const lineY = g?.line.y ?? 0;
    const ink = useTransform(time, (v) => span(v, INK[0], INK[1]));
    const thick = useTransform(ink, (k) => 1 + ease(k));
    const lineOn = useTransform([raw, time], ([r, v]: number[]) => r >= 0 && v < SHRINK[0] + SHRINK[1] ? 1 : 0);

    // Шарик: вырастает на середине линии, дугой поднимается к центру ряда кнопок, растёт до шара финала
    const ballX = useTransform(time, (v) => g ? lerp(g.line.x + g.line.w / 2, g.row.x, ease(span(v, LIFT[0], LIFT[1]))) : 0);
    const ballY = useTransform(time, (v) => g ? lerp(g.line.y, g.row.y, easeOutBack(span(v, LIFT[0], LIFT[1]))) : 0);
    const ballScale = useTransform(time, (v) =>
        easeOut(span(v, BALL[0], BALL[1])) * lerp(1, ORB_FROM / RIDER, ease(span(v, LIFT[0] + LIFT[1] * .5, LIFT[1] * .5))));
    const ballOn = useTransform(time, (v) => v > STAGE[0] ? 0 : 1);

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${cs.scene}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${PATH * 100}vh)` } as CSSProperties}
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
