"use client";

import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

import s from './HeroChat.module.scss'
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { ralewayBold } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import InlineChat from "../InlineChat";
import { easeOut, offsetIn, span } from "../scene";
import { ph } from "../../placeholders";

// Появление чата по времени, с: шар в шапке проступает точкой, из него кругом раскрывается панель, потом приветствие,
// капли готовых вопросов и поле. Задержка – пока страница въезжает (template.tsx)
const DELAY = .5;
const DURATION = 2.6;
const POP = [0, .08];
const UNFOLD = [.12, .42];
const SHADOW = [.3, .45];
const CHAT = [.3, 1];

const k = (v: number, [from, to]: number[]) => span(v, from, to - from);

interface IHeroChat {
    tgHref: string
}

// Вариант B, первый экран: слева заголовок и действие, справа живой демо-чат – его можно спросить, не листая.
// Панель раскрывается кругом из шара в своей шапке (тот же шар, что в углу), готовые вопросы вылетают из него каплями
const HeroChat: FC<IHeroChat> = ({ tgHref }) => {
    const reduceMotion = usePrefersReducedMotion();
    const frame = useRef<HTMLDivElement>(null);
    const headOrb = useRef<HTMLSpanElement>(null);
    const [geom, setGeom] = useState({ x: 0, y: 0, r: 0, max: 0 });

    const t = useMotionValue(0);
    useEffect(() => {
        if (reduceMotion) {
            t.set(1);
            return;
        }
        const controls = animate(t, 1, { duration: DURATION, delay: DELAY, ease: 'linear' });
        return () => controls.stop();
    }, [reduceMotion, t]);

    // Центр шара шапки в панели и радиус до дальнего угла
    useLayoutEffect(() => {
        const measure = () => {
            const f = frame.current;
            const o = headOrb.current;
            if (!f || !o) return;
            const p = offsetIn(o, f);
            const x = p.x + o.offsetWidth / 2;
            const y = p.y + o.offsetHeight / 2;
            setGeom({ x, y, r: o.offsetWidth / 2 + 6, max: Math.hypot(Math.max(x, f.offsetWidth - x), Math.max(y, f.offsetHeight - y)) + 2 });
        };
        measure();
        const observer = new ResizeObserver(measure);
        if (frame.current) observer.observe(frame.current);
        return () => observer.disconnect();
    }, []);

    const clipPath = useTransform(t, (v) => {
        if (v >= 1) return 'none';
        const pop = easeOut(k(v, POP));
        const unfold = easeOut(k(v, UNFOLD));
        const r = geom.r * pop + (geom.max - geom.r) * unfold;
        return `circle(${r}px at ${geom.x}px ${geom.y}px)`;
    });
    const shadowOpacity = useTransform(t, (v) => k(v, SHADOW));
    const intro = useTransform(t, (v) => k(v, CHAT));

    return (
        <section className={s.hero} aria-labelledby="ai-title">
            <div className={s.text}>
                <p className={s.crumbs}>{ph.crumbs}</p>
                <h1 id="ai-title" className={`${ralewayBold.className} ${s.title}`}>{ph.title}</h1>
                <p className={s.lead}>{ph.lead}</p>
                <div className={s.actions}>
                    <ContactLink className={`${ralewayBold.className} ${s.primary}`}>{ph.cta}</ContactLink>
                    <a className={`${ralewayBold.className} ${s.secondary}`} href={tgHref} target="_blank" rel="noopener noreferrer">{ph.tg}</a>
                </div>
                <p className={s.trust}>{ph.trust}</p>
            </div>

            <div className={s.chat}>
                <p className={s.caption}>{ph.chatCaption}</p>
                <div ref={frame} className={s.frame}>
                    <motion.span className={s.shadow} style={{ opacity: shadowOpacity }} aria-hidden="true" />
                    <motion.div className={s.clip} style={{ clipPath }}>
                        <InlineChat bare intro={intro} orbRef={headOrb} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroChat;
