"use client";

import { FC, ReactNode, Ref, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useScroll, useSpring, useTransform } from "framer-motion";

import s from './Sections.module.scss'
import f from './FinalCta.module.scss'
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import OrbStar from "@/app/(home)/components/chat/OrbStar";
import { ralewayBold } from "@/app/fonts/fonts";
import Rise from "../Rise";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ease, easeOut, easeOutBack, span, SMOOTH } from "../scene";
import { ph, sections } from "@/data/aiPage";

// Шкала финала: шар вырастает, сжимается и делится на два круга, круги разъезжаются и вытягиваются в таблетки-кнопки
const ORB_IN = [0, .22];
const SPLIT = [.32, .42];
const APART = [.38, .66];
const STRETCH = [.6, .85];
const LABEL = [.76, .92];
// На липком экране (CtaScene) заголовок выезжает, пока шар растёт, строка под кнопками – за подписями
const TITLE = [.06, .22];
const NOTE = [.86, 1];
const ORB = 96;

const k = (v: number, [from, to]: number[]) => span(v, from, to - from);

interface IGeom { dx: number, w: number, h: number }

// Кнопка, пока она – круг: сдвинута к центру ряда и обрезана до круга своей высоты
const Morph: FC<{ progress: MotionValue<number>, geom: IGeom, children: ReactNode }> = ({ progress, geom, children }) => {
    const x = useTransform(progress, (v) => geom.dx * (1 - easeOutBack(k(v, APART))));
    const scale = useTransform(progress, (v) => .6 + .4 * easeOut(k(v, SPLIT)));
    const opacity = useTransform(progress, (v) => k(v, SPLIT));
    const clipPath = useTransform(progress, (v) => {
        const o = ease(k(v, STRETCH));
        return `inset(0 ${(geom.w - geom.h) / 2 * (1 - o)}px round 24px)`;
    });
    return (
        <motion.span className={f.morph} style={{ x, scale, opacity, clipPath }}>
            {children}
        </motion.span>
    );
};

interface IFinalCta {
    tgHref: string,
    // Время сцены CtaScene вместо своего скролла: шар до прогресса 0 рисует сцена, заголовок и строка выезжают
    staged?: MotionValue<number>,
    rowRef?: Ref<HTMLDivElement>
}

// Финал страницы: шар демо-чата в последний раз – растёт, делится на два круга, они разъезжаются и вытягиваются
// в кнопки «Обсудить проект» (залитая) и Telegram (контуром). Круг → таблетка, как на первом экране главной
const FinalCta: FC<IFinalCta> = ({ tgHref, staged, rowRef }) => {
    const reduceMotion = usePrefersReducedMotion();
    const row = useRef<HTMLDivElement>(null);
    const buttons = useRef<(HTMLSpanElement | null)[]>([]);
    const [geoms, setGeoms] = useState<IGeom[]>([]);
    const { scrollYProgress } = useScroll({ target: row, offset: ['start 1', 'start 0.72'] });
    const own = useSpring(scrollYProgress, SMOOTH);
    const progress = staged ?? own;

    useLayoutEffect(() => {
        const r = row.current;
        if (!r) return;
        const measure = () => {
            const cx = r.offsetWidth / 2;
            setGeoms(buttons.current.map((el) => el
                ? { dx: cx - (el.offsetLeft + el.offsetWidth / 2), w: el.offsetWidth, h: el.offsetHeight }
                : { dx: 0, w: 0, h: 0 }));
        };
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        observer.observe(r);
        return () => observer.disconnect();
    }, []);

    const orbScale = useTransform(progress, (v) => (.3 + .7 * easeOut(k(v, ORB_IN))) * (1 - .5 * ease(k(v, SPLIT))));
    // На сцене шар сменяет шарик в кадре прогресса 0 – без проявления
    const orbOpacity = useTransform(progress, (v) => (staged ? (v > 0 ? 1 : 0) : k(v, [0, .08])) * (1 - k(v, SPLIT)));
    // Подпись проявляется, когда круг вытянулся в таблетку
    const label = useTransform(progress, (v) => reduceMotion ? 1 : k(v, LABEL));
    const note = useTransform(progress, (v) => k(v, NOTE));

    const items = [
        <ContactLink key="cta" className={`${ralewayBold.className} ${s.primary}`}><motion.span style={{ opacity: label }}>{ph.cta}</motion.span></ContactLink>,
        <a key="tg" className={`${ralewayBold.className} ${s.secondary}`} href={tgHref} target="_blank" rel="noopener noreferrer"><motion.span style={{ opacity: label }}>{ph.tg}</motion.span></a>,
    ];

    return (
        <section className={`${s.section} ${s.final}`} aria-labelledby="final-title">
            <h2 id="final-title" className={`${ralewayBold.className} ${s.title}`}>
                {staged ? <Rise progress={progress} from={TITLE[0]} dur={TITLE[1] - TITLE[0]}>{sections.cta.title}</Rise> : sections.cta.title}
            </h2>
            <div
                ref={(el) => {
                    row.current = el;
                    if (typeof rowRef === 'function') rowRef(el);
                    else if (rowRef) rowRef.current = el;
                }}
                className={`${s.finalRow} ${f.row}`}
            >
                {!reduceMotion && (
                    <motion.span className={f.orb} style={{ scale: orbScale, opacity: orbOpacity, width: ORB, height: ORB }} aria-hidden="true">
                        <span className={f.orbLight} />
                        <OrbStar className={f.orbIcon} />
                    </motion.span>
                )}
                {items.map((item, i) => (
                    <span key={i} ref={(el) => { buttons.current[i] = el }} className={f.slot}>
                        {reduceMotion ? item : <Morph progress={progress} geom={geoms[i] ?? { dx: 0, w: 0, h: 0 }}>{item}</Morph>}
                    </span>
                ))}
            </div>
            {staged
                ? <motion.p className={s.description} style={{ opacity: note }}>{sections.cta.text}</motion.p>
                : <p className={s.description}>{sections.cta.text}</p>}
        </section>
    );
};

export default FinalCta;
