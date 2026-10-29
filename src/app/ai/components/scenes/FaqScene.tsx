"use client";

import { CSSProperties, FC, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import s from '../sections/Sections.module.scss'
import f from '@/app/(home)/components/faq/Faq.module.scss'
import q from '../sections/AiFaq.module.scss'
import fs from './FaqScene.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import Rise from "../Rise";
import { drop, durFor, easeOut, fadeFor, lerp, move, offsetIn, span, useSceneTime } from "../scene";
import { faqOn, faqPath, faqRelease, ITermsEnd, termsBallTook, termsGone, termsWipe } from "./handoff";
import { faq, sections } from "@/data/aiPage";

// ---------- Время ----------
// В экранах скролла от кадра, где липкий экран FAQ встал поверх последнего кадра «Что входит», минус LEAD.
// Шарик с конца сетки тем спускается под неё и тянет чернильную линию; линия поднимается и стирает темы снизу
// вверх, наверху ложится первой линией списка. Агент отвечает на два вопроса прямо в аккордеоне: вопрос приходит
// пузырём справа, шарик – аватар агента слева – «думает», ответ печатается по словам, пузырь тает в строку.
// Затем шарик рисует линию под вторым ответом, она веером раскладывается на разделители остальных вопросов,
// второй ответ сворачивается, а шарик садится на «+» первого вопроса и поворачивается в крестик.
// Единая скорость (speed.ts): окна – от путей из замеров (timesFor), окно – [от, до]; печать – TYPE знаков на px скролла
const LEAD = .1;
const TYPE = .5;
// Ответ на вопрос: пузырь приходит (ask), шарик едет к ответу (go), думает (think), печатает (type), пузырь тает (melt)
interface IStep { ask: number[], go: number[], think: number[], type: number[], melt: number[] }
interface ITimes {
    under: number[], draw: number[], rise: number[], narrow: number[], inkOff: number[], title: number,
    steps: IStep[],
    // Линии второго и третьего вопроса: шарик спускается к началу (down) и рисует слева направо (roll)
    line1: { down: number[], roll: number[] }, line2: { down: number[], roll: number[] },
    // Веер разделителей остальных вопросов: начало и длительность падения линии i
    fan: number, fanAt: number[], fanDur: number[], fanEnd: number,
    collapse: number[], plus: number[], path: number
}
// Шарик на спуске уходит наружу дугой; под сеткой линия – на GAP ниже её низа; аватар – левее текста
const BULGE = 40;
const GAP = 34;
const AVATAR = -30;
const RIDER = 22;
const ICON = 14;
const win = (v: number, [a, b]: number[]) => span(v, a, b - a);

interface IPoint { x: number, y: number }
// Замеры без transform, от левого верха списка: строки (верх, высота вопроса), высота второго ответа, ширина и низ
// списка; конец «Что входит» – в тех же координатах; at – верх списка от верха экрана
interface IRow { y: number, head: number }
interface IGeo { rows: IRow[], answer: number, w: number, bottom: number, end: ITermsEnd, at: IPoint, t: ITimes }

const timesFor = (g: Omit<IGeo, 't'>, h: number): ITimes => {
    const d = (px: number) => durFor(px, h);
    const fade = fadeFor(h);
    const at = (from: number, dur: number) => [from, from + dur];
    const under = g.end.bottom + GAP;
    const y0 = g.rows[0]?.y ?? 0;
    const head = (i: number) => g.rows[i]?.head ?? 0;
    const rowY = (i: number) => i < g.rows.length ? g.rows[i].y : g.bottom;
    const u = at(0, Math.max(fade, d(Math.hypot(g.end.left - g.end.ball.x, under - g.end.ball.y) + BULGE)));
    const draw = at(u[1], Math.max(fade, d(g.end.right - g.end.left)));
    // Подъём: 80% – с ускорением, 20% – перелёт и возврат; ширина – от сетки тем к ширине списка
    const rise = at(draw[1], Math.max(fade, d(Math.abs(under - y0)) / .8));
    const narrow = at(rise[0] + (rise[1] - rise[0]) * .5, Math.max((rise[1] - rise[0]) * .6, d(Math.max(Math.abs(g.end.left), Math.abs(g.w - (g.end.right - g.end.left))))));
    let t = Math.max(rise[1], narrow[1]);
    const steps: IStep[] = [];
    const lines: { down: number[], roll: number[] }[] = [];
    let ball: IPoint = { x: g.w, y: y0 };
    faq.slice(0, 2).forEach((item, i) => {
        const ask = at(t, Math.max(fade, d(g.w * .45)));
        const avatar = { x: AVATAR, y: rowY(i) + head(i) + 12 };
        const go = at(ask[0] + (ask[1] - ask[0]) * .8, Math.max(fade, d(Math.hypot(avatar.x - ball.x, avatar.y - ball.y))));
        const think = at(go[1], .06);
        const type = at(think[0] + .04, item.answer.length / TYPE / h);
        const melt = at(type[1] - .02, fade);
        steps.push({ ask, go, think, type, melt });
        // Линия под ответом: спуск к её началу и проезд
        const lineY = rowY(i + 1) + (i ? g.answer : 0);
        const down = at(melt[1] + .02, Math.max(fade, d(Math.hypot(avatar.x, lineY - avatar.y))));
        const roll = at(down[1], Math.max(fade, d(g.w)));
        lines.push({ down, roll });
        ball = { x: g.w, y: lineY };
        t = roll[1] + .06;
    });
    // Веер: линии остальных вопросов падают с третьей, дальние – чуть позже и дольше (путь длиннее)
    const fan = t;
    const n = g.rows.length;
    const fanAt = Array.from({ length: n + 1 }, (_, i) => fan + Math.max(0, i - 3) / Math.max(1, n - 2) * .06);
    const fanDur = fanAt.map((_, i) => i < 3 ? 0 : Math.max(fade, d(rowY(i) - rowY(2)) / .85));
    const fanEnd = Math.max(fan + fade, ...fanAt.map((a, i) => a + fanDur[i]));
    const collapse = at(fan + (fanEnd - fan) * .8, Math.max(fade, d(g.answer)));
    const plus = at(collapse[1], Math.max(fade * 1.5, d(Math.hypot(4 + ICON / 2, rowY(2) - (y0 + head(0) / 2)) + BULGE * .6)));
    return {
        under: u, draw, rise, narrow, inkOff: at(rise[1], fade), title: rise[0] + (rise[1] - rise[0]) * .7,
        steps, line1: lines[0], line2: lines[1], fan, fanAt, fanDur, fanEnd, collapse, plus, path: LEAD + plus[1] + .05
    };
};
const geo0 = { rows: [], answer: 0, w: 0, bottom: 0, at: { x: 0, y: 0 } };
const noTimes = timesFor({ ...geo0, end: { ball: { x: 0, y: 0 }, left: 0, right: 0, bottom: 0 } }, 900);

// Второй ответ раскрыт, пока агент его печатает; строки ниже сдвинуты на его высоту
const openOf = (v: number, t: ITimes) => move(win(v, t.steps[1].go)) * (1 - move(win(v, t.collapse)));
const shiftOf = (v: number, g: IGeo, i: number) => i >= 2 ? g.answer * openOf(v, g.t) : 0;
const lineYOf = (v: number, g: IGeo, i: number) => i < g.rows.length ? g.rows[i].y + shiftOf(v, g, i) : g.bottom + shiftOf(v, g, 2);

// Первая линия: прорисовывается под сеткой за шариком, с ускорением поднимается к верху списка, чуть перелетает
const under = (g: IGeo) => g.end.bottom + GAP;
const riseOf = (v: number, t: ITimes) => {
    const k = win(v, t.rise);
    return k < .8 ? drop(k / .8) : 1 + Math.sin(Math.PI * (k - .8) / .2) * .04;
};
const firstY = (v: number, g: IGeo) => lerp(under(g), g.rows[0].y, riseOf(v, g.t));
const firstBox = (v: number, g: IGeo) => {
    const narrow = move(win(v, g.t.narrow));
    const drawn = lerp(g.end.left, g.end.right, move(win(v, g.t.draw)));
    return { x: lerp(g.end.left, 0, narrow), w: lerp(drawn - g.end.left, g.w, narrow) };
};

// Аватар агента у ответа: левее текста, на высоте первой строки ответа
const avatar = (v: number, g: IGeo, i: number): IPoint => ({ x: AVATAR, y: lineYOf(v, g, i) + g.rows[i].head + 12 });
const arc = (a: IPoint, b: IPoint, k: number, bulge: number): IPoint => ({
    x: lerp(a.x, b.x, move(k)) + bulge * Math.sin(Math.PI * k),
    y: lerp(a.y, b.y, k < .85 ? drop(k / .85) : 1)
});
// К аватару: сначала вниз у правого края, под пузырь, потом влево вдоль ответа – не поверх текста вопроса
const toAvatar = (a: IPoint, b: IPoint, k: number): IPoint => ({ x: lerp(a.x, b.x, move(span(k, .3, .7))), y: lerp(a.y, b.y, move(span(k, 0, .4))) });
const roll = (a: IPoint, b: IPoint, k: number): IPoint => ({ x: lerp(a.x, b.x, move(k)), y: lerp(a.y, b.y, move(k)) });

// Шарик по отрезкам: каждый следующий начинается там, где кончился прошлый (точки – с учётом сдвига строк)
const ballAt = (v: number, g: IGeo): { x: number, y: number, scale: number, opacity: number } => {
    const t = g.t;
    let scale = 1;
    let opacity = v < -LEAD + .01 ? 0 : 1;
    const legs: [number[], (from: IPoint, k: number) => IPoint][] = [
        [t.under, (a, k) => arc(a, { x: g.end.left, y: under(g) }, k, -BULGE)],
        [t.draw, (a, k) => roll(a, { x: g.end.right, y: under(g) }, k)],
        // Едет на правом конце поднимающейся линии
        [[t.rise[0], Math.max(t.rise[1], t.narrow[1])], (_, k) => {
            const at = lerp(t.rise[0], Math.max(t.rise[1], t.narrow[1]), k);
            const b = firstBox(at, g);
            return { x: b.x + b.w, y: firstY(at, g) };
        }],
        [t.steps[0].go, (a, k) => toAvatar(a, avatar(v, g, 0), k)],
        [t.line1.down, (a, k) => arc(a, { x: 0, y: lineYOf(v, g, 1) }, k, 0)],
        [t.line1.roll, (a, k) => roll(a, { x: g.w, y: lineYOf(v, g, 1) }, k)],
        [t.steps[1].go, (a, k) => toAvatar(a, avatar(v, g, 1), k)],
        [t.line2.down, (a, k) => arc(a, { x: 0, y: lineYOf(v, g, 2) }, k, 0)],
        [t.line2.roll, (a, k) => roll(a, { x: g.w, y: lineYOf(v, g, 2) }, k)],
        // На «+» первого вопроса: дугой вверх по правому краю, сжимается до размера значка
        [t.plus, (a, k) => arc(a, { x: g.w - 4 - ICON / 2, y: g.rows[0].y + g.rows[0].head / 2 }, k, BULGE * .6)],
    ];
    let p: IPoint = g.end.ball;
    for (const [w, leg] of legs) {
        if (v < w[0]) break;
        p = leg(p, win(v, w));
    }
    // Ведёт по линии, пока строки ниже второго ответа съезжают
    if (v >= t.line2.roll[1] && v < t.plus[0]) p = { x: g.w, y: lineYOf(v, g, 2) };
    // Думает – пульсирует
    for (const step of t.steps) {
        const k = span(v, step.think[0], (step.think[1] - step.think[0]) + (step.type[1] - step.type[0]) * .3);
        if (k > 0 && k < 1) scale = 1 + .22 * Math.sin(Math.PI * ((k * 3) % 1));
    }
    const plus = win(v, t.plus);
    scale *= lerp(1, ICON / RIDER, move(plus));
    opacity *= 1 - span(plus, .75, .25);
    return { ...p, scale, opacity };
};

// Линия списка: волосяная, пока стирает – чернилами и вдвое толще
interface ILine { x: MotionValue<number>, y: MotionValue<number>, width: MotionValue<number>, opacity: MotionValue<number>, ink?: MotionValue<number>, thick?: MotionValue<number> }
const Line: FC<ILine> = ({ x, y, width, opacity, ink, thick }) => (
    <motion.span className={fs.line} style={{ x, y, width, opacity, scaleY: thick ?? 1 }} aria-hidden="true">
        {ink && <motion.span className={fs.ink} style={{ opacity: ink }} />}
    </motion.span>
);

// Первая линия – та, что стирает «Что входит»
const FirstLine: FC<{ time: MotionValue<number>, g: IGeo }> = ({ time, g }) => {
    const x = useTransform(time, (v) => firstBox(v, g).x);
    const width = useTransform(time, (v) => firstBox(v, g).w);
    const y = useTransform(time, (v) => firstY(v, g));
    const ink = useTransform(time, (v) => 1 - win(v, g.t.inkOff));
    const thick = useTransform(ink, (k) => 1 + k);
    const opacity = useTransform(time, (v): number => v >= g.t.draw[0] ? 1 : 0);
    return <Line x={x} y={y} width={width} opacity={opacity} ink={ink} thick={thick} />;
};

// Линия i-го вопроса (i = rows.length – нижняя). Вторую и третью рисует шарик; остальные падают веером с третьей
const RowLine: FC<{ time: MotionValue<number>, g: IGeo, i: number }> = ({ time, g, i }) => {
    const t = g.t;
    const drawn = i === 1 ? t.line1 : i === 2 ? t.line2 : null;
    const x = useMotionValue(0);
    const width = useTransform(time, (v) => drawn ? g.w * move(win(v, drawn.roll)) : g.w);
    const y = useTransform(time, (v) => {
        if (drawn) return lineYOf(v, g, i);
        const k = span(v, t.fanAt[i], t.fanDur[i]);
        const fall = k < .85 ? drop(k / .85) : 1 - Math.sin(Math.PI * (k - .85) / .15) * .03;
        return lerp(lineYOf(v, g, 2), lineYOf(v, g, i), fall);
    });
    const opacity = useTransform(time, (v): number => v >= (drawn ? drawn.roll[0] : t.fan) ? 1 : 0);
    return <Line x={x} y={y} width={width} opacity={opacity} />;
};

// Слово ответа – появляется по очереди, пока агент печатает
const Word: FC<{ time: MotionValue<number>, at: number, dur: number, children: string }> = ({ time, at, dur, children }) => {
    const opacity = useTransform(time, (v) => span(v, at, dur));
    return <motion.span style={{ opacity }}>{children} </motion.span>;
};

interface IQuestion {
    time: MotionValue<number>,
    g: IGeo,
    i: number,
    question: string,
    answer: string,
    rowRef: (el: HTMLDivElement | null) => void,
    headRef: (el: HTMLDivElement | null) => void,
    answerRef: (el: HTMLParagraphElement | null) => void
}

// Вопрос копии: первые два – пузыри клиента, на которые агент отвечает; остальные выезжают из-под своих линий
const Question: FC<IQuestion> = ({ time, g, i, question, answer, rowRef, headRef, answerRef }) => {
    const t = g.t;
    const step = t.steps[i];
    const ready = g.rows.length > i;
    const y = useTransform(time, (v) => ready ? shiftOf(v, g, i) : 0);
    // Пузырь въезжает справа с наклоном, распрямляется и тает в строку – как в обычном FAQ варианта
    // Без отскока: наклон кривой ограничен (единая скорость)
    const x = useTransform(time, (v) => step ? `${(1 - move(win(v, step.ask))) * 45}%` : '0%');
    const rotate = useTransform(time, (v) => step ? (1 - move(win(v, step.ask))) * 4 : 0);
    const shown = useTransform(time, (v) => step ? span(v, step.ask[0], (step.ask[1] - step.ask[0]) * .3) : 1);
    const bubble = useTransform(time, (v) => step ? 1 - easeOut(win(v, step.melt)) : 0);
    const color = useTransform(bubble, (b) => b > .5 ? 'var(--color-bg)' : 'var(--color-text-100)');
    // Остальные вопросы – когда под них ляжет линия веера
    const from = (t.fanAt[i] ?? t.fan) + (t.fanDur[i] ?? 0) * .6;
    // «+»: у отвеченных – когда пузырь растаял, у первого – из шарика, повёрнут в крестик
    const plusLen = t.plus[1] - t.plus[0];
    const icon = useTransform(time, (v) => i === 0 ? span(v, t.plus[0] + plusLen * .8, .03) : step ? span(v, (step.melt[0] + step.melt[1]) / 2, .05) : span(v, from + .04, .06));
    const turn = useTransform(time, (v) => i === 0 ? 45 * easeOut(span(v, t.plus[0] + plusLen * .85, .06)) : 0);
    // Второй ответ виден, пока раскрыт
    const answerOn = useTransform(time, (v) => i === 1 ? 1 - span(v, t.collapse[0], (t.collapse[1] - t.collapse[0]) * .5) : 1);
    const words = answer.split(' ');
    // Печать: слово за словом, TYPE знаков на px скролла
    const typeLen = step ? step.type[1] - step.type[0] : 0;
    const wordAt = (j: number) => step ? step.type[0] + typeLen * words.slice(0, j).join(' ').length / answer.length : 0;

    return (
        <motion.div ref={rowRef} className={`${f.item} ${q.item} ${fs.item}`} style={{ y }}>
            <motion.div ref={headRef} className={`${ralewayBold.className} ${f.question} ${q.question} ${fs.question}`} style={step ? { x, rotate, opacity: shown } : undefined}>
                {step && <motion.span className={q.bubble} style={{ opacity: bubble }} />}
                {step
                    ? <motion.span className={q.text} style={{ color }}>{question}</motion.span>
                    : <Rise progress={time} from={from} dur={.12}>{question}</Rise>}
                <motion.span className={fs.icon} style={{ opacity: icon, rotate: turn }} />
            </motion.div>
            {step && (
                <motion.p ref={answerRef} className={`${f.answer} ${i === 1 ? fs.floating : ''}`} style={{ opacity: answerOn }}>
                    {words.map((w, j) => <Word key={j} time={time} at={wordAt(j)} dur={Math.max(.004, typeLen / words.length)}>{w}</Word>)}
                </motion.p>
            )}
        </motion.div>
    );
};

// FAQ, десктоп варианта C – продолжение «Что входит» на том же неподвижном экране (TermsScene лежит под ним, все три
// экрана отпускают скролл вместе). На экране – копия верха FAQ (aria-hidden), под ней точь-в-точь настоящий
// аккордеон: в кадре отпускания копия прячется, дальше скроллится и раскрывается настоящий
const FaqScene: FC<{ end: ITermsEnd, children: ReactNode }> = ({ end, children }) => {
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const list = useRef<HTMLDivElement>(null);
    const rows = useRef<(HTMLDivElement | null)[]>([]);
    const heads = useRef<(HTMLDivElement | null)[]>([]);
    const answers = useRef<(HTMLParagraphElement | null)[]>([]);
    const [g, setG] = useState<IGeo | null>(null);

    const { scrollY } = useScroll();
    const pinY = useMotionValue(0);
    const screenH = useMotionValue(1);
    const releaseY = useMotionValue(Infinity);
    const raw = useTransform([scrollY, pinY, screenH], ([y, pin, h]: number[]) => (y - pin) / h - LEAD);
    const time = useSceneTime(raw);
    // Экраны отпустили скролл – дальше настоящий FAQ, по скроллу, а не по сглаженному времени
    const real = useTransform([scrollY, releaseY], ([y, at]: number[]) => y >= at - 1 ? 1 : 0);
    const copy = useTransform(real, (r) => 1 - r);

    const measure = useCallback(() => {
        const sec = scene.current;
        const scr = screen.current;
        const ls = list.current;
        if (!sec || !scr || !ls) return;
        sec.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
        const at = offsetIn(ls, scr);
        const geo = {
            rows: rows.current.map((el, i) => ({ y: el?.offsetTop ?? 0, head: heads.current[i]?.offsetHeight ?? 0 })),
            answer: answers.current[1]?.offsetHeight ?? 0,
            w: ls.offsetWidth,
            bottom: ls.offsetHeight - 1.5,
            end: {
                ball: { x: end.ball.x - at.x, y: end.ball.y - at.y },
                left: end.left - at.x, right: end.right - at.x, bottom: end.bottom - at.y
            },
            at
        };
        const tm = timesFor(geo, scr.offsetHeight);
        setG({ ...geo, t: tm });
        faqPath.set(tm.path);
        const top = offsetIn(sec, document.body).y;
        pinY.set(top);
        screenH.set(scr.offsetHeight);
        releaseY.set(top + sec.offsetHeight - scr.offsetHeight);
        faqRelease.set(releaseY.get());
    }, [end, pinY, screenH, releaseY]);

    useLayoutEffect(() => {
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        if (scene.current) observer.observe(scene.current);
        if (list.current) observer.observe(list.current);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [measure]);

    // Шарик и стирание – у «Что входит»: линия поднимается – TermsScene обрезает экран под ней, заголовок гаснет
    const sync = useCallback((v: number) => {
        if (!g) return;
        const k = win(v, g.t.rise);
        termsWipe.set(v < g.t.draw[0] ? -1 : v >= g.t.rise[1] ? 0 : g.at.y + lerp(under(g), g.rows[0].y, k < .8 ? riseOf(v, g.t) : 1.04));
        termsGone.set(span(v, g.t.title - .03, .1));
        termsBallTook.set(v >= -LEAD + .01 ? 1 : 0);
    }, [g]);
    useMotionValueEvent(time, 'change', sync);
    useEffect(() => {
        faqOn.set(true);
        sync(time.get());
        return () => {
            faqOn.set(false);
            termsWipe.set(-1);
            termsGone.set(0);
            termsBallTook.set(0);
        };
    }, [sync, time]);

    const ball = useTransform(time, (v) => g ? ballAt(v, g) : { x: 0, y: 0, scale: 0, opacity: 0 });
    const ballX = useTransform(ball, (b) => b.x);
    const ballY = useTransform(ball, (b) => b.y);
    const ballScale = useTransform(ball, (b) => b.scale);
    const ballOpacity = useTransform(ball, (b) => b.opacity);

    return (
        <>
            <section
                ref={scene}
                className={`${sc.scene} ${fs.scene}`}
                style={{ '--scene-h': `calc(var(--screen-h) + ${(g?.t.path ?? faqPath.get()) * 100}vh)` } as CSSProperties}
                aria-hidden="true"
            >
                <motion.div ref={screen} className={sc.screen} style={{ opacity: copy }}>
                    <div className={`${ralewayRegular.className} ${f.faq} ${fs.frame}`}>
                        <h2 className={`${ralewayBold.className} ${f.title}`}>
                            <Rise progress={time} from={g?.t.title ?? 1} dur={.14}>{sections.faq.title}</Rise>
                        </h2>
                        <p className={f.description}>
                            <Rise progress={time} from={(g?.t.title ?? 1) + .04} dur={.14}>{sections.faq.text}</Rise>
                        </p>

                        <div ref={list} className={`${f.list} ${q.list} ${fs.list}`}>
                            {g && <FirstLine time={time} g={g} />}
                            {g && g.rows.slice(1).map((_, j) => <RowLine key={j} time={time} g={g} i={j + 1} />)}
                            {g && <RowLine time={time} g={g} i={g.rows.length} />}
                            <motion.span className={`${s.rider} ${fs.ball}`} style={{ x: ballX, y: ballY, scale: ballScale, opacity: ballOpacity }} />
                            {faq.map((item, i) => (
                                <Question
                                    key={item.question}
                                    time={time}
                                    g={g ?? { ...geo0, end, t: noTimes }}
                                    i={i}
                                    question={item.question}
                                    answer={item.answer}
                                    rowRef={(el) => { rows.current[i] = el }}
                                    headRef={(el) => { heads.current[i] = el }}
                                    answerRef={(el) => { answers.current[i] = el }}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>
            <motion.div className={fs.real} style={{ opacity: real }}>{children}</motion.div>
        </>
    );
};

export default FaqScene;
