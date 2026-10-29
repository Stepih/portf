"use client";

import { CSSProperties, FC, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import s from '../sections/Sections.module.scss'
import f from '@/app/(home)/components/faq/Faq.module.scss'
import q from '../sections/AiFaq.module.scss'
import fs from './FaqScene.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import Rise from "../Rise";
import { ease, easeOut, easeOutBack, lerp, offsetIn, SMOOTH, span } from "../scene";
import { FAQ_PATH, faqOn, faqRelease, ITermsEnd, termsBallTook, termsGone, termsWipe } from "./handoff";
import { faq, sections } from "../../placeholders";

// ---------- Время ----------
// В экранах скролла от кадра, где липкий экран FAQ встал поверх последнего кадра «Что входит», минус LEAD.
// Шарик с конца сетки тем спускается под неё и тянет чернильную линию; линия поднимается и стирает темы снизу
// вверх, наверху ложится первой линией списка. Агент отвечает на два вопроса прямо в аккордеоне: вопрос приходит
// пузырём справа, шарик – аватар агента слева – «думает», ответ печатается по словам, пузырь тает в строку.
// Затем шарик рисует линию под вторым ответом, она веером раскладывается на разделители остальных вопросов,
// второй ответ сворачивается, а шарик садится на «+» первого вопроса и поворачивается в крестик
const LEAD = .1;
const UNDER = [0, .1];
const DRAW = [.1, .1];
const RISE = [.22, .2];
const INK_OFF = [.42, .06];
const TITLE = .36;
// Ответ на вопрос: пузырь приходит (ask), шарик едет к ответу (go), думает (think), печатает (type), пузырь тает (melt)
interface IStep { ask: number, go: number, think: number, type: number, melt: number }
const STEPS: IStep[] = [
    { ask: .5, go: .58, think: .66, type: .7, melt: .78 },
    { ask: .94, go: 1.02, think: 1.1, type: 1.12, melt: 1.2 },
];
const ASK = .1;
const GO = .08;
const THINK = .06;
const TYPE = .1;
const MELT = .08;
// Линия второго вопроса: шарик спускается к её началу и рисует слева направо
const LINE1 = [.84, .04, .08];
// Линия под вторым ответом и веер разделителей остальных вопросов
const LINE2 = [1.28, .04, .07];
const FAN = [1.39, .14];
const COLLAPSE = [1.5, .08];
const PLUS = [1.57, .12];
// Шарик на спуске уходит наружу дугой; под сеткой линия – на GAP ниже её низа; аватар – левее текста
const BULGE = 40;
const GAP = 34;
const AVATAR = -30;
const RIDER = 22;
const ICON = 14;

interface IPoint { x: number, y: number }
// Замеры без transform, от левого верха списка: строки (верх, высота вопроса), высота второго ответа, ширина и низ
// списка; конец «Что входит» – в тех же координатах; at – верх списка от верха экрана
interface IRow { y: number, head: number }
interface IGeo { rows: IRow[], answer: number, w: number, bottom: number, end: ITermsEnd, at: IPoint }

// Второй ответ раскрыт, пока агент его печатает; строки ниже сдвинуты на его высоту
const openOf = (v: number) => easeOut(span(v, STEPS[1].go, GO)) * (1 - ease(span(v, COLLAPSE[0], COLLAPSE[1])));
const shiftOf = (v: number, g: IGeo, i: number) => i >= 2 ? g.answer * openOf(v) : 0;
const lineYOf = (v: number, g: IGeo, i: number) => i < g.rows.length ? g.rows[i].y + shiftOf(v, g, i) : g.bottom + shiftOf(v, g, 2);

// Первая линия: прорисовывается под сеткой за шариком, с ускорением поднимается к верху списка, чуть перелетает
const under = (g: IGeo) => g.end.bottom + GAP;
const riseOf = (v: number) => {
    const k = span(v, RISE[0], RISE[1]);
    return k < .8 ? (k / .8) ** 2 : 1 + Math.sin(Math.PI * (k - .8) / .2) * .04;
};
const firstY = (v: number, g: IGeo) => lerp(under(g), g.rows[0].y, riseOf(v));
const firstBox = (v: number, g: IGeo) => {
    const narrow = ease(span(v, RISE[0] + RISE[1] * .5, RISE[1] * .6));
    const drawn = lerp(g.end.left, g.end.right, ease(span(v, DRAW[0], DRAW[1])));
    return { x: lerp(g.end.left, 0, narrow), w: lerp(drawn - g.end.left, g.w, narrow) };
};

// Аватар агента у ответа: левее текста, на высоте первой строки ответа
const avatar = (v: number, g: IGeo, i: number): IPoint => ({ x: AVATAR, y: lineYOf(v, g, i) + g.rows[i].head + 12 });
const arc = (a: IPoint, b: IPoint, k: number, bulge: number): IPoint => ({
    x: lerp(a.x, b.x, ease(k)) + bulge * Math.sin(Math.PI * k),
    y: lerp(a.y, b.y, k < .85 ? (k / .85) ** 2 : 1)
});
// К аватару: сначала вниз у правого края, под пузырь, потом влево вдоль ответа – не поверх текста вопроса
const toAvatar = (a: IPoint, b: IPoint, k: number): IPoint => ({ x: lerp(a.x, b.x, ease(span(k, .3, .7))), y: lerp(a.y, b.y, easeOut(span(k, 0, .4))) });
const roll = (a: IPoint, b: IPoint, k: number): IPoint => ({ x: lerp(a.x, b.x, ease(k)), y: lerp(a.y, b.y, ease(k)) });

// Шарик по отрезкам: каждый следующий начинается там, где кончился прошлый (точки – с учётом сдвига строк)
const ballAt = (v: number, g: IGeo): { x: number, y: number, scale: number, opacity: number } => {
    let scale = 1;
    let opacity = v < -LEAD + .01 ? 0 : 1;
    const legs: [number, number, (from: IPoint, k: number) => IPoint][] = [
        [UNDER[0], UNDER[1], (a, k) => arc(a, { x: g.end.left, y: under(g) }, k, -BULGE)],
        [DRAW[0], DRAW[1], (a, k) => roll(a, { x: g.end.right, y: under(g) }, k)],
        // Едет на правом конце поднимающейся линии
        [RISE[0], RISE[1] + .1, (_, k) => {
            const t = RISE[0] + k * (RISE[1] + .1);
            const b = firstBox(t, g);
            return { x: b.x + b.w, y: firstY(t, g) };
        }],
        [STEPS[0].go, GO, (a, k) => toAvatar(a, avatar(v, g, 0), k)],
        [LINE1[0], LINE1[1], (a, k) => arc(a, { x: 0, y: lineYOf(v, g, 1) }, k, 0)],
        [LINE1[0] + LINE1[1], LINE1[2], (a, k) => roll(a, { x: g.w, y: lineYOf(v, g, 1) }, k)],
        [STEPS[1].go, GO, (a, k) => toAvatar(a, avatar(v, g, 1), k)],
        [LINE2[0], LINE2[1], (a, k) => arc(a, { x: 0, y: lineYOf(v, g, 2) }, k, 0)],
        [LINE2[0] + LINE2[1], LINE2[2], (a, k) => roll(a, { x: g.w, y: lineYOf(v, g, 2) }, k)],
        // На «+» первого вопроса: дугой вверх по правому краю, сжимается до размера значка
        [PLUS[0], PLUS[1], (a, k) => arc(a, { x: g.w - 4 - ICON / 2, y: g.rows[0].y + g.rows[0].head / 2 }, k, BULGE * .6)],
    ];
    let p: IPoint = g.end.ball;
    for (const [at, dur, leg] of legs) {
        if (v < at) break;
        p = leg(p, span(v, at, dur));
    }
    // Ведёт по линии, пока строки ниже второго ответа съезжают
    if (v >= LINE2[0] + LINE2[1] + LINE2[2] && v < PLUS[0]) p = { x: g.w, y: lineYOf(v, g, 2) };
    // Думает – пульсирует
    for (const step of STEPS) {
        const k = span(v, step.think, THINK + TYPE * .3);
        if (k > 0 && k < 1) scale = 1 + .22 * Math.sin(Math.PI * ((k * 3) % 1));
    }
    const plus = span(v, PLUS[0], PLUS[1]);
    scale *= lerp(1, ICON / RIDER, ease(plus));
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
    const ink = useTransform(time, (v) => 1 - span(v, INK_OFF[0], INK_OFF[1]));
    const thick = useTransform(ink, (k) => 1 + k);
    const opacity = useTransform(time, (v) => v >= DRAW[0] ? 1 : 0);
    return <Line x={x} y={y} width={width} opacity={opacity} ink={ink} thick={thick} />;
};

// Линия i-го вопроса (i = rows.length – нижняя). Вторую и третью рисует шарик; остальные падают веером с третьей
const RowLine: FC<{ time: MotionValue<number>, g: IGeo, i: number }> = ({ time, g, i }) => {
    const n = g.rows.length;
    const drawn = i === 1 ? LINE1 : i === 2 ? LINE2 : null;
    const land = FAN[0] + (i - 3) / Math.max(1, n - 2) * FAN[1] * .4;
    const x = useMotionValue(0);
    const width = useTransform(time, (v) => drawn ? g.w * ease(span(v, drawn[0] + drawn[1], drawn[2])) : g.w);
    const y = useTransform(time, (v) => {
        if (drawn) return lineYOf(v, g, i);
        const k = span(v, FAN[0], land + FAN[1] * .6 - FAN[0]);
        const fall = k < .85 ? (k / .85) ** 2 : 1 - Math.sin(Math.PI * (k - .85) / .15) * .03;
        return lerp(lineYOf(v, g, 2), lineYOf(v, g, i), fall);
    });
    const opacity = useTransform(time, (v) => v >= (drawn ? drawn[0] + drawn[1] : FAN[0]) ? 1 : 0);
    return <Line x={x} y={y} width={width} opacity={opacity} />;
};

// Слово ответа – появляется по очереди, пока агент печатает
const Word: FC<{ time: MotionValue<number>, at: number, children: string }> = ({ time, at, children }) => {
    const opacity = useTransform(time, (v) => span(v, at, .012));
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
    const step = STEPS[i];
    const ready = g.rows.length > i;
    const y = useTransform(time, (v) => ready ? shiftOf(v, g, i) : 0);
    // Пузырь въезжает справа с наклоном, распрямляется и тает в строку – как в обычном FAQ варианта
    const x = useTransform(time, (v) => step ? `${(1 - easeOutBack(span(v, step.ask, ASK))) * 45}%` : '0%');
    const rotate = useTransform(time, (v) => step ? (1 - easeOutBack(span(v, step.ask, ASK))) * 4 : 0);
    const shown = useTransform(time, (v) => step ? span(v, step.ask, ASK * .3) : 1);
    const bubble = useTransform(time, (v) => step ? 1 - easeOut(span(v, step.melt, MELT)) : 0);
    const color = useTransform(bubble, (b) => b > .5 ? 'var(--color-bg)' : 'var(--color-text-100)');
    // Остальные вопросы – когда под них ляжет линия веера
    const from = FAN[0] + Math.max(0, i - 2) / Math.max(1, g.rows.length - 2) * FAN[1] * .4 + FAN[1] * .5;
    // «+»: у отвеченных – когда пузырь растаял, у первого – из шарика, повёрнут в крестик
    const icon = useTransform(time, (v) => i === 0 ? span(v, PLUS[0] + PLUS[1] * .8, .03) : step ? span(v, step.melt + MELT * .5, .05) : span(v, from + .04, .06));
    const turn = useTransform(time, (v) => i === 0 ? 45 * easeOut(span(v, PLUS[0] + PLUS[1] * .85, .06)) : 0);
    // Второй ответ виден, пока раскрыт
    const answerOn = useTransform(time, (v) => i === 1 ? 1 - span(v, COLLAPSE[0], COLLAPSE[1] * .5) : 1);
    const words = answer.split(' ');

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
                    {words.map((w, j) => <Word key={j} time={time} at={step.type + TYPE * j / words.length}>{w}</Word>)}
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
    const time = useSpring(raw, SMOOTH);
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
        setG({
            rows: rows.current.map((el, i) => ({ y: el?.offsetTop ?? 0, head: heads.current[i]?.offsetHeight ?? 0 })),
            answer: answers.current[1]?.offsetHeight ?? 0,
            w: ls.offsetWidth,
            bottom: ls.offsetHeight - 1.5,
            end: {
                ball: { x: end.ball.x - at.x, y: end.ball.y - at.y },
                left: end.left - at.x, right: end.right - at.x, bottom: end.bottom - at.y
            },
            at
        });
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
        const k = span(v, RISE[0], RISE[1]);
        termsWipe.set(v < DRAW[0] ? -1 : v >= RISE[0] + RISE[1] ? 0 : g.at.y + lerp(under(g), g.rows[0].y, k < .8 ? riseOf(v) : 1.04));
        termsGone.set(span(v, TITLE - .03, .1));
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
                style={{ '--scene-h': `calc(var(--screen-h) + ${FAQ_PATH * 100}vh)` } as CSSProperties}
                aria-hidden="true"
            >
                <motion.div ref={screen} className={sc.screen} style={{ opacity: copy }}>
                    <div className={`${ralewayRegular.className} ${f.faq} ${fs.frame}`}>
                        <h2 className={`${ralewayBold.className} ${f.title}`}>
                            <Rise progress={time} from={TITLE} dur={.14}>{sections.faq.title}</Rise>
                        </h2>
                        <p className={f.description}>
                            <Rise progress={time} from={TITLE + .04} dur={.14}>{sections.faq.text}</Rise>
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
                                    g={g ?? { rows: [], answer: 0, w: 0, bottom: 0, end, at: { x: 0, y: 0 } }}
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
