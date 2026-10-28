"use client";

import { FC, Ref, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionStyle, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import s from './Sections.module.scss'
import h from './HowWeWork.module.scss'
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import Rise from "../Rise";
import { clamp01, ease, easeOut, easeOutBack, span, SMOOTH } from "../scene";
import { howJoin, howTook, IHowJoin } from "../c/handoff";
import { flow, howTopics, sections } from "../../placeholders";

interface IStep {
    progress: MotionValue<number>,
    // Появление в сцене AgentDeck, 0–1: кружок вырастает из точки, подпись – следом. Без него шаг виден сразу
    intro?: MotionValue<number>,
    i: number,
    count: number,
    label: string
}

// Шаг загорается, когда к нему подъехал шар
const Step: FC<IStep> = ({ progress, intro, i, count, label }) => {
    const reduceMotion = usePrefersReducedMotion();
    const at = i / (count - 1);
    const on = useTransform(progress, (v) => clamp01((v - at + .04) / .06));
    // Без intro – постоянные 1: источник тот же прогресс, чтобы хуки не зависели от пропа
    const from = i * .12;
    const pop = useTransform(intro ?? progress, (v) => intro ? easeOutBack(span(v, from, .45)) : 1);
    const popOpacity = useTransform(intro ?? progress, (v) => intro ? span(v, from, .15) : 1);
    const labelIn = useTransform(intro ?? progress, (v) => intro ? easeOut(span(v, from + .2, .4)) : 1);
    const opacity = useTransform([on, labelIn], ([k, l]: number[]) => (.45 + .55 * k) * l);
    // Цифра на заливке – цветом фона, как текст залитой кнопки
    const color = useTransform(on, (k) => k > .5 ? 'var(--color-bg)' : 'var(--color-text-100)');

    return (
        <li className={s.step}>
            <motion.span className={`${allerta.className} ${s.stepNum}`} style={intro ? { scale: pop, opacity: popOpacity } : undefined}>
                <motion.span className={s.stepFill} style={{ opacity: reduceMotion ? 1 : on }} aria-hidden="true" />
                <motion.span className={s.stepDigit} style={{ color: reduceMotion ? undefined : color }}>{i + 1}</motion.span>
            </motion.span>
            <motion.span className={`${ralewayBold.className} ${s.stepLabel}`} style={{ opacity: reduceMotion ? 1 : opacity }}>{label}</motion.span>
        </li>
    );
};

interface IHowFlow {
    // Где шар на линии, 0–1: зажигает шаги и заливает линию
    progress: MotionValue<number>,
    // Только в копии AgentDeck: появление шагов, линия-основа (из слившихся точек) и шарик (из большого шара)
    intro?: MotionValue<number>,
    base?: MotionValue<number>,
    rider?: MotionValue<number>,
    // Залитая линия гаснет, когда от неё оторвались куски
    fade?: MotionValue<number>,
    style?: MotionStyle,
    lineRef?: Ref<HTMLOListElement>,
    trackRef?: RefObject<HTMLSpanElement | null>
}

// Линия шагов с малым шаром. Её же рисует сцена AgentDeck в конце (копия верха раздела): разметка и стили – одни
export const HowFlow: FC<IHowFlow> = ({ progress, intro, base, rider, fade, style, lineRef, trackRef }) => {
    const reduceMotion = usePrefersReducedMotion();
    const own = useRef<HTMLSpanElement>(null);
    const track = trackRef ?? own;
    const [size, setSize] = useState({ w: 0, h: 0 });

    // Длина линии без transform; на телефоне линия вертикальная
    useLayoutEffect(() => {
        const el = track.current;
        if (!el) return;
        const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [track]);

    const vertical = size.h > size.w;
    // Прогресс копии чуть уходит ниже нуля (шаг 1 ещё не горит) – линия и шар не выходят за край
    const fillX = useTransform(progress, (v) => vertical ? 1 : clamp01(v));
    const fillY = useTransform(progress, (v) => vertical ? clamp01(v) : 1);
    const riderX = useTransform(progress, (v) => vertical ? 0 : clamp01(v) * size.w);
    const riderY = useTransform(progress, (v) => vertical ? clamp01(v) * size.h : 0);

    return (
        <motion.ol ref={lineRef} className={s.flow} style={{ ...style, '--count': flow.length } as MotionStyle}>
            <span ref={track} className={s.track} aria-hidden="true">
                <motion.span className={s.trackBase} style={base ? { opacity: base } : undefined} />
                {!reduceMotion && (
                    <>
                        <motion.span className={s.trackFill} style={{ scaleX: fillX, scaleY: fillY, opacity: fade }} />
                        <motion.span className={s.rider} style={{ x: riderX, y: riderY, opacity: rider }} />
                    </>
                )}
            </span>
            {flow.map((label, i) => (
                <Step key={label} progress={progress} intro={intro} i={i} count={flow.length} label={label} />
            ))}
        </motion.ol>
    );
};

// Обрывок линии шагов: от своего куска линии падает, качнувшись, и ложится линией над темой
interface IPiece { dx: number, dy: number, scale: number }

const Topic: FC<{ fall: MotionValue<number>, i: number, piece: IPiece, title: string, items: string[], topicRef: (el: HTMLDivElement | null) => void }> = ({ fall, i, piece, title, items, topicRef }) => {
    const reduceMotion = usePrefersReducedMotion();
    const from = i * .08;
    const f = (v: number) => span(v, from, .5);
    const x = useTransform(fall, (v) => piece.dx * (1 - ease(f(v))));
    // Падение с ускорением и маленьким отскоком в конце
    const y = useTransform(fall, (v) => {
        const k = f(v);
        const drop = k < .8 ? (k / .8) ** 2 : 1 - Math.sin(Math.PI * (k - .8) / .2) * .04;
        return piece.dy * (1 - drop);
    });
    const scaleX = useTransform(fall, (v) => piece.scale + (1 - piece.scale) * easeOut(f(v)));
    const rotate = useTransform(fall, (v) => Math.sin(Math.PI * f(v)) * (i - 1 || .6) * 7);
    // Пока летит – чернилами, как залитая линия шагов; легла – волосяной линией
    const ink = useTransform(fall, (v) => 1 - span(v, from + .45, .15));
    // До падения кусков нет: дорожку шагов закрашивает её собственная заливка
    const shown = useTransform(fall, (v) => v > .002 ? 1 : 0);
    const land = from + .5;

    return (
        <div ref={topicRef} className={`${s.topic} ${h.topic}`}>
            <motion.span className={h.piece} style={reduceMotion ? undefined : { x, y, scaleX, rotate, opacity: shown }} aria-hidden="true">
                <motion.span className={h.ink} style={{ opacity: reduceMotion ? 0 : ink }} />
            </motion.span>
            <h3 className={`${ralewayBold.className} ${s.topicTitle}`}>
                <Rise progress={fall} from={land} dur={.18}>{title}</Rise>
            </h3>
            <ul className={`${s.list} ${s.plain}`}>
                {items.map((item, j) => (
                    <li key={j}><Rise progress={fall} from={land + .05 + j * .04} dur={.18}><span className={s.bulleted}>{item}</span></Rise></li>
                ))}
            </ul>
        </div>
    );
};

interface IHowWeWork {
    // Вариант C: верх раздела продолжает сцену AgentDeck (handoff.ts – howJoin, howTook)
    joined?: boolean
}

// Как работаем: пять шагов на линии, малый шар едет по ней за скроллом и зажигает шаги (ANIMATION_PLAN 4А).
// Доехал – линия рвётся на три куска, они падают, качнувшись, и ложатся линиями над темами «до оплаты», «пилот»,
// «как платим», из-под линий выезжает текст. На телефоне линия вертикальная, куски падают из её места.
// joined (вариант C): линию собирает и проезжает шаром сцена AgentDeck на своём экране, раздел стоит под ней
// точь-в-точь и показывает свой верх (уже с горящими шагами) с кадра, где экран сцены отпускает скролл
const HowWeWork: FC<IHowWeWork> = ({ joined = false }) => {
    const section = useRef<HTMLElement>(null);
    const line = useRef<HTMLOListElement>(null);
    const track = useRef<HTMLSpanElement>(null);
    const grid = useRef<HTMLDivElement>(null);
    const topics = useRef<(HTMLDivElement | null)[]>([]);
    const [pieces, setPieces] = useState<IPiece[]>([]);
    // Середина линии от верха раздела: по ней раздел встаёт под копию сцены AgentDeck
    const [anchor, setAnchor] = useState(0);
    const [join, setJoin] = useState<IHowJoin | null>(null);

    useEffect(() => { setJoin(joined ? howJoin.get() : null) }, [joined]);
    useMotionValueEvent(howJoin, 'change', (j) => setJoin(joined ? j : null));
    const linked = join !== null;

    const { scrollYProgress } = useScroll({ target: line, offset: ['start 0.85', 'end 0.55'] });
    const progress = useSpring(scrollYProgress, SMOOTH);
    // В стыке шар уже проехал линию в сцене AgentDeck
    const done = useMotionValue(1);
    const { scrollYProgress: fallRaw } = useScroll({ target: grid, offset: ['start 0.6', 'start 0.15'] });
    // В стыке куски не падают, пока верх раздела прячется под копией сцены
    const fallFrom = useTransform([fallRaw, howTook], ([v, took]: number[]) => linked ? v * took : v);
    const fall = useSpring(fallFrom, SMOOTH);

    // Где куски линии относительно тем и середина линии – без transform
    useLayoutEffect(() => {
        const el = track.current;
        const sec = section.current;
        if (!el || !sec) return;
        const offset = (node: HTMLElement) => {
            let x = 0;
            let y = 0;
            let n: HTMLElement | null = node;
            while (n && n !== sec) {
                x += n.offsetLeft;
                y += n.offsetTop;
                n = n.offsetParent as HTMLElement | null;
            }
            return { x, y };
        };
        const measure = () => {
            const tr = offset(el);
            setAnchor(tr.y + el.offsetHeight / 2);
            const vertical = el.offsetHeight > el.offsetWidth;
            const n = topics.current.length;
            setPieces(topics.current.map((topic, i) => {
                if (!topic) return { dx: 0, dy: 0, scale: 1 };
                const tp = offset(topic);
                // Кусок i: треть линии – по горизонтали, на телефоне – треть по вертикали (лежит у её левого края)
                const segW = vertical ? 40 : el.offsetWidth / n - 16;
                const segX = vertical ? tr.x : tr.x + el.offsetWidth / n * (i + .5) - segW / 2;
                const segY = vertical ? tr.y + el.offsetHeight / n * (i + .5) : tr.y;
                return { dx: segX - tp.x + (segW - topic.offsetWidth) / 2, dy: segY - tp.y, scale: segW / topic.offsetWidth };
            }));
        };
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        observer.observe(sec);
        return () => observer.disconnect();
    }, []);

    // Залитая линия гаснет, когда от неё оторвались куски
    const trackOpacity = useTransform(fall, (v) => 1 - span(v, .02, .2) * .7);
    const top = linked ? { opacity: howTook } : undefined;

    return (
        <section
            ref={section}
            className={`${s.section} ${h.section}`}
            // Раздел идёт сразу за AgentDeck: его верх = низ сцены + отступ, линия встаёт на высоту шара в последнем кадре
            style={linked ? { marginTop: join.orbY - join.h - anchor } : undefined}
            data-how-join={joined ? '' : undefined}
            aria-labelledby="how-title"
        >
            <motion.h2 id="how-title" className={`${ralewayBold.className} ${s.title}`} style={top}>{sections.how.title}</motion.h2>
            <motion.p className={s.description} style={top}>{sections.how.text}</motion.p>

            <HowFlow progress={linked ? done : progress} fade={trackOpacity} style={top} lineRef={line} trackRef={track} />

            <div ref={grid} className={s.topics}>
                {howTopics.map((topic, i) => (
                    <Topic
                        key={topic.title}
                        fall={fall}
                        i={i}
                        piece={pieces[i] ?? { dx: 0, dy: 0, scale: 1 }}
                        title={topic.title}
                        items={topic.items}
                        topicRef={(el) => { topics.current[i] = el }}
                    />
                ))}
            </div>
        </section>
    );
};

export default HowWeWork;
