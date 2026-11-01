"use client";

import { CSSProperties, FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import x from './Scenes.module.scss'
import s from './ProjectFlow.module.scss'
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import Rise from "@/app/ai/components/Rise";
import { easeOut, move, span } from "@/app/ai/components/scene";
import { projectPath } from "@/data/sitesPage";
import Scene, { ISceneMode } from "./Scene";
import { end, flowTimes, IFlowTimes, TEXT, W } from "./times";

const steps = projectPath.steps;
const freeCount = steps.filter((step) => step.free).length;
// Кружки на горизонтальной линии – через равные доли
const even = steps.map((_, i) => i / (steps.length - 1));
const k = (v: number, [a, d]: W) => span(v, a, d);

interface IStep {
    time: MotionValue<number>,
    t: IFlowTimes,
    i: number
}

// Шаг: кружок с номером заливается, когда до него доехал шарик; под ним выезжают название и текст
const Step: FC<IStep> = ({ time, t, i }) => {
    const step = steps[i];
    const at = t.lit[i];
    const on = useTransform(time, (v) => span(v, at - .02, .05));
    const color = useTransform(on, (o) => o > .5 ? 'var(--color-bg)' : 'var(--color-text-100)');
    return (
        <li className={s.step}>
            <span className={`${allerta.className} ${s.num}`} aria-hidden="true">
                <motion.span className={s.numFill} style={{ opacity: on }} />
                <motion.span className={s.digit} style={{ color }}>{i + 1}</motion.span>
            </span>
            <div className={s.body}>
                <h3 className={`${ralewayBold.className} ${s.label}`}>
                    <Rise progress={time} from={at + .02} dur={TEXT}>
                        {step.title}
                        {step.free && <span className={s.freeInline}> · {projectPath.free}</span>}
                    </Rise>
                </h3>
                <p className={s.text}>
                    <Rise progress={time} from={at + .06} dur={TEXT}>{step.text}</Rise>
                </p>
            </div>
        </li>
    );
};

const FlowBody: FC<{ time: MotionValue<number>, mode: ISceneMode, onLen: (len: number) => void }> = ({ time, mode, onLen }) => {
    const flow = useRef<HTMLDivElement>(null);
    const track = useRef<HTMLSpanElement>(null);
    const list = useRef<HTMLOListElement>(null);
    const [size, setSize] = useState({ len: 900, vertical: false, h: 900, at: even });

    // Линия – от кружка первого шага до кружка последнего, без transform. На телефоне и планшете шаги – строками
    // разной высоты, линия вертикальная: её низ и места кружков – по замеру
    useLayoutEffect(() => {
        const el = track.current;
        const ol = list.current;
        const box = flow.current;
        if (!el || !ol || !box) return;
        const measure = () => {
            const items = [...ol.children] as HTMLElement[];
            const vertical = items.length > 1 && items[1].offsetTop > items[0].offsetTop + 4;
            if (vertical) {
                const last = items[items.length - 1];
                box.style.setProperty('--last-h', `${last.offsetHeight}px`);
                const first = items[0].offsetTop;
                const len = Math.max(1, last.offsetTop - first);
                setSize({ len, vertical, h: window.innerHeight, at: items.map((li) => (li.offsetTop - first) / len) });
            } else {
                box.style.removeProperty('--last-h');
                setSize({ len: el.offsetWidth, vertical, h: window.innerHeight, at: even });
            }
        };
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        observer.observe(box);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);

    const t = useMemo(() => flowTimes(size.at, freeCount, size.len, size.h), [size]);
    useEffect(() => onLen(t.path), [onLen, t.path]);

    const animated = mode.sticky;
    const base = useTransform(time, (v) => move(k(v, t.base)));
    const fill = useTransform(time, (v) => move(k(v, t.ride)));
    const riderPos = useTransform(fill, (f) => f * size.len);
    const riderOn = useTransform(time, (v) => span(v, t.ride[0], .04) * (1 - span(v, end(t.ride), .08)));
    const bracket = useTransform(time, (v) => move(k(v, t.free)));
    const headOn = useTransform(time, (v) => easeOut(span(v, t.head, .1)));

    return (
        <>
            <motion.div className={s.head} style={animated ? { opacity: headOn } : undefined}>
                <h2 id="flow-title" className={`${ralewayBold.className} ${x.title}`}>{projectPath.title}</h2>
                <p className={x.description}>{projectPath.text}</p>
            </motion.div>

            <div ref={flow} className={s.flow} style={{ '--count': steps.length, '--free': freeCount } as CSSProperties}>
                {/* Скобка «0 ₽» над бесплатными шагами */}
                <div className={s.bracket} aria-hidden="true">
                    <motion.span className={s.bracketLine} style={animated ? { scaleX: bracket } : undefined} />
                    <span className={`${ralewayBold.className} ${s.bracketLabel}`}>
                        <Rise progress={time} from={t.free[0] + .04} dur={TEXT}>{projectPath.free}</Rise>
                    </span>
                </div>
                <span ref={track} className={s.track} aria-hidden="true">
                    <motion.span className={s.trackBase} style={animated ? (size.vertical ? { scaleY: base } : { scaleX: base }) : undefined} />
                    {animated && (
                        <>
                            <motion.span className={s.trackFill} style={size.vertical ? { scaleY: fill } : { scaleX: fill }} />
                            <motion.span className={s.rider} style={{ x: size.vertical ? 0 : riderPos, y: size.vertical ? riderPos : 0, opacity: riderOn }} />
                        </>
                    )}
                </span>
                <ol ref={list} className={s.list}>
                    {steps.map((step, i) => <Step key={step.title} time={time} t={t} i={i} />)}
                </ol>
            </div>
        </>
    );
};

// «Как идёт проект» (SERVICES_PLAN У5б, этап 2) – как «Как работаем» на /ai (HowWeWork): шесть шагов на линии,
// малый шарик едет по ней за скроллом и зажигает шаги, под каждым выезжают название и текст. Над созвоном и
// макетом – скобка «0 ₽» (как в «Как работаем» главной). На телефоне и планшете линия вертикальная, «0 ₽» – у шага
const ProjectFlow: FC = () => {
    const [len, setLen] = useState(1.6);
    return (
        <Scene labelledBy="flow-title" len={len}>
            {(time, mode) => <FlowBody time={time} mode={mode} onLen={setLen} />}
        </Scene>
    );
};

export default ProjectFlow;
