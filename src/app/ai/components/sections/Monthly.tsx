"use client";

import { FC, useEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import s from './Sections.module.scss'
import m from './Monthly.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { easeOut, easeOutBack, span, SMOOTH } from "../scene";
import { howJoin, howTrackEl } from "../scenes/handoff";
import MonthlyScene, { scalePos as pos } from "../scenes/MonthlyScene";
import { monthlyHeads, monthlyNotes, monthlyPer, monthlyRanges, monthlyRows, monthlyScale, sections } from "@/data/aiPage";

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
            style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%`, ...(reduceMotion ? { x: '0%', scaleX: 1, opacity: 1 } : { x, scaleX, opacity }) }}
            aria-hidden="true"
        />
    );
};

// Пояснение въезжает справа, когда его капсула доехала
const Note: FC<{ progress: MotionValue<number>, i: number, text: string }> = ({ progress, i, text }) => {
    const reduceMotion = usePrefersReducedMotion();
    const k = (v: number) => span(v, .35 + i * .12, .35);
    const x = useTransform(progress, (v) => 60 * (1 - easeOut(k(v))));
    const opacity = useTransform(progress, (v) => k(v));
    return <motion.li className={m.note} style={reduceMotion ? { x: 0, opacity: 1 } : { x, opacity }}>{text}</motion.li>;
};

// Каждый месяц: модель и сервер (макет page_C_ai). У каждой строки – капсула диапазона на общей шкале:
// капсулы выезжают от нуля и растягиваются до своих сумм, пояснения въезжают справа.
// Десктоп варианта C – сцена на весь экран (MonthlyScene): шарик с конца линии шагов падает в крупную шкалу
const Monthly: FC = () => {
    const reduceMotion = usePrefersReducedMotion();
    const table = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: table, offset: ['start 0.9', 'start 0.3'] });
    const progress = useSpring(scrollYProgress, SMOOTH);

    // Сцена – только на десктопе варианта C: там у шагов HowWeWork тела и он отдаёт свою дорожку
    const [rider, setRider] = useState<HTMLElement | null>(null);
    useEffect(() => { setRider(howJoin.get()?.steps ? howTrackEl.get() : null) }, []);
    useMotionValueEvent(howTrackEl, 'change', (el) => setRider(howJoin.get()?.steps ? el : null));
    useMotionValueEvent(howJoin, 'change', (j) => setRider(j?.steps ? howTrackEl.get() : null));

    if (rider && !reduceMotion) return <MonthlyScene rider={rider} />;

    return (
        <section className={s.section} aria-labelledby="monthly-title">
            <h2 id="monthly-title" className={`${ralewayBold.className} ${s.title}`}>{sections.monthly.title}</h2>
            <p className={s.description}>{sections.monthly.text}</p>

            <div ref={table} className={m.layout}>
                <div role="table" aria-labelledby="monthly-title" className={m.table}>
                    <div className={`${m.row} ${m.head}`} role="row">
                        <span role="columnheader">{monthlyHeads[0]}</span>
                        <span className={m.scale} role="columnheader">
                            {monthlyScale.map((v) => (
                                <span key={v} className={m.tick} style={{ left: `${pos(v) * 100}%` }}>{v.toLocaleString('ru-RU')} ₽</span>
                            ))}
                        </span>
                        <span role="columnheader">{monthlyHeads[2]}</span>
                    </div>
                    {monthlyRows.map((row, i) => (
                        <div key={i} className={m.row} role="row">
                            <span role="cell">{row[0]}<span className={s.muted}> · {row[1]}</span></span>
                            <span className={m.track} role="presentation">
                                <Capsule progress={progress} i={i} range={monthlyRanges[i]} />
                            </span>
                            <b className={`${ralewayBold.className} ${m.value}`} role="cell">
                                {row[2]}<span className={`${ralewayRegular.className} ${m.unit}`} aria-hidden="true">{monthlyPer}</span>
                            </b>
                        </div>
                    ))}
                </div>
                <ul className={m.notes}>
                    {monthlyNotes.map((note, i) => <Note key={i} progress={progress} i={i} text={note} />)}
                </ul>
            </div>
        </section>
    );
};

export default Monthly;
