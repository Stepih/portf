"use client";

import { FC, useLayoutEffect, useRef, useState } from "react";
import { easeIn, motion, MotionValue, useScroll, useSpring, useTransform } from "framer-motion";

import s from './Sections.module.scss'
import t from './Terms.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import Rise from "../Rise";
import { easeOut, flyEase, span, SMOOTH } from "../scene";
import { sections, terms } from "../../placeholders";

// Шкала блока: шар появляется в центре сетки, из него по очереди вылетают капли – по одной на тему,
// капля садится в левый верхний угол темы и растекается в линию, из-под линии выезжают заголовок и пункты
const ORB_IN = [0, .1];
const ORB_OUT = [.7, .85];
const dropFrom = (i: number) => .08 + i * .055;
const FLIGHT = .22;
const LIFT = 70;

const k = (v: number, [from, to]: number[]) => span(v, from, to - from);

// Тема относительно шара: сдвиг от её угла до центра шара
interface IGeom { dx: number, dy: number }

const Topic: FC<{ progress: MotionValue<number>, i: number, geom: IGeom, title: string, items: string[], topicRef: (el: HTMLDivElement | null) => void }> = ({ progress, i, geom, title, items, topicRef }) => {
    const reduceMotion = usePrefersReducedMotion();
    const d = dropFrom(i);
    const land = d + FLIGHT;
    const x = useTransform(progress, (v) => geom.dx * (1 - flyEase(span(v, d, FLIGHT))));
    const y = useTransform(progress, (v) => {
        const f = span(v, d, FLIGHT);
        return f < .35 ? geom.dy - LIFT * easeOut(f / .35) : (geom.dy - LIFT) * (1 - easeIn((f - .35) / .65));
    });
    const dropOpacity = useTransform(progress, (v) => v < d ? 0 : 1 - span(v, land, .04));
    const line = useTransform(progress, (v) => easeOut(span(v, land - .01, .12)));

    return (
        <div ref={topicRef} className={`${s.topic} ${t.topic}`}>
            {!reduceMotion && <motion.span className={t.drop} style={{ x, y, opacity: dropOpacity }} aria-hidden="true" />}
            <motion.span className={t.line} style={reduceMotion ? undefined : { scaleX: line }} aria-hidden="true" />
            <h3 className={`${ralewayBold.className} ${s.topicTitle}`}>
                <Rise progress={progress} from={land + .03} dur={.14}>{title}</Rise>
            </h3>
            <ul className={`${s.list} ${s.plain}`}>
                {items.map((item, j) => (
                    <li key={j}><Rise progress={progress} from={land + .06 + j * .025} dur={.14}><span className={s.bulleted}>{item}</span></Rise></li>
                ))}
            </ul>
        </div>
    );
};

// Что входит и что остаётся вам (макет page_C_ai): шесть тем без плашек. Появляются брызгами из шара – как отрасли
// на первом экране главной, только капля растекается не в таблетку, а в линию над темой
const Terms: FC = () => {
    const reduceMotion = usePrefersReducedMotion();
    const grid = useRef<HTMLDivElement>(null);
    const topics = useRef<(HTMLDivElement | null)[]>([]);
    const [geoms, setGeoms] = useState<IGeom[]>([]);
    const { scrollYProgress } = useScroll({ target: grid, offset: ['start 0.9', 'start 0.15'] });
    const progress = useSpring(scrollYProgress, SMOOTH);

    // Центр сетки и углы тем – без transform
    useLayoutEffect(() => {
        const g = grid.current;
        if (!g) return;
        const measure = () => {
            const cx = g.offsetWidth / 2;
            const cy = g.offsetHeight / 2;
            setGeoms(topics.current.map((el) => el ? { dx: cx - el.offsetLeft, dy: cy - el.offsetTop } : { dx: 0, dy: 0 }));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(g);
        return () => observer.disconnect();
    }, []);

    const orbScale = useTransform(progress, (v) => {
        const pop = easeOut(k(v, ORB_IN));
        // Шар вздрагивает на каждой капле
        let bump = 0;
        for (let i = 0; i < terms.length; i++) {
            const x = (v - dropFrom(i)) / .05;
            if (x >= 0 && x <= 1) bump = Math.max(bump, Math.sin(Math.PI * x));
        }
        return (.4 + .6 * pop) * (1 + .1 * bump) * (1 - .4 * k(v, ORB_OUT));
    });
    const orbOpacity = useTransform(progress, (v) => k(v, ORB_IN) * (1 - k(v, ORB_OUT)));

    return (
        <section className={s.section} aria-labelledby="terms-title">
            <h2 id="terms-title" className={`${ralewayBold.className} ${s.title}`}>{sections.terms.title}</h2>
            <p className={s.description}>{sections.terms.text}</p>

            <div ref={grid} className={`${s.terms} ${t.grid}`}>
                {!reduceMotion && (
                    <motion.span className={t.orb} style={{ scale: orbScale, opacity: orbOpacity }} aria-hidden="true">
                        <span className={t.orbLight} />
                    </motion.span>
                )}
                {terms.map((topic, i) => (
                    <Topic
                        key={topic.title}
                        progress={progress}
                        i={i}
                        geom={geoms[i] ?? { dx: 0, dy: 0 }}
                        title={topic.title}
                        items={topic.items}
                        topicRef={(el) => { topics.current[i] = el }}
                    />
                ))}
            </div>
        </section>
    );
};

export default Terms;
