"use client";

import { FC, ReactNode, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useScroll, useSpring, useTransform } from "framer-motion";

import s from './TierDeck.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { IServiceTier } from "@/interfaces/offer";
import TierCard from "../TierCard";
import { easeOut, easeOutBack, span, SMOOTH } from "../scene";
import { sections, tierText } from "../../placeholders";

interface ITierDeck {
    tiers: IServiceTier[],
    note: string
}

// Колода: нижняя карта наклонена и чуть меньше; на телефоне она лежит под верхней, выглядывая на DEAL_UP
const TILT = 6;
const LOWER_SCALE = .94;
const DEAL_UP = 72;

// Карта в колоде: сдвиг к месту колоды, наклон, масштаб, слой
interface IStack { x: number, y: number, rotate: number, scale: number, z: number }

// Окно раздачи по прогрессу блока: верхняя карта уходит сразу, нижняя – чуть позже. Текст верхней уже на месте
// (как у верхней карты колоды на главной), у нижней – выезжает, пока она едет
const DEAL = [[0, .62], [.08, .72]];
const TEXT_FROM = [-.4, .4];

interface IDealt {
    progress: MotionValue<number>,
    stack?: IStack,
    window: number[],
    children: ReactNode
}

// Карта едет из колоды на место; к концу окна чуть проскакивает его, наклон уходит в другую сторону и выпрямляется
const Dealt: FC<IDealt> = ({ progress, stack, window: [from, to], children }) => {
    const reduceMotion = usePrefersReducedMotion();
    const k = (v: number) => span(v, from, to - from);
    const x = useTransform(progress, (v) => (stack?.x ?? 0) * (1 - easeOutBack(k(v))));
    const y = useTransform(progress, (v) => (stack?.y ?? 0) * (1 - easeOutBack(k(v))));
    const rotate = useTransform(progress, (v) => (stack?.rotate ?? 0) * (1 - easeOutBack(k(v))));
    const scale = useTransform(progress, (v) => {
        const sc = stack?.scale ?? 1;
        return sc + (1 - sc) * easeOut(k(v));
    });

    return (
        <motion.article
            className={s.card}
            style={reduceMotion ? undefined : { x, y, rotate, scale, zIndex: stack?.z }}
        >
            {children}
        </motion.article>
    );
};

// Вариант A, ступени ИИ после чата: две карты лежат колодой и раздаются по местам скроллом –
// как «Избранные кейсы» на главной (ANIMATION_PLAN 2Г), только без остановки страницы
const TierDeck: FC<ITierDeck> = ({ tiers, note }) => {
    const grid = useRef<HTMLDivElement>(null);
    const cards = useRef<(HTMLDivElement | null)[]>([]);
    const [boxes, setBoxes] = useState<{ x: number, y: number }[]>([]);
    const column = useMediaQuery('(max-width: 899px)');

    const { scrollYProgress } = useScroll({ target: grid, offset: ['start 0.95', 'start 0.2'] });
    const progress = useSpring(scrollYProgress, SMOOTH);

    // Центры ячеек без transform
    useLayoutEffect(() => {
        if (!grid.current) return;
        const measure = () => setBoxes(cards.current.map((el) => el
            ? { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 }
            : { x: 0, y: 0 }));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(grid.current);
        return () => observer.disconnect();
    }, []);

    // Компьютер: колода посередине между ячейками, сверху – первая ступень. Телефон: вторая лежит под первой
    const stackOf = (i: number): IStack | undefined => {
        if (boxes.length < 2) return undefined;
        const [a, b] = boxes;
        if (column) {
            if (i === 0) return { x: 0, y: 0, rotate: 0, scale: 1, z: 2 };
            return { x: 0, y: a.y - b.y + DEAL_UP, rotate: TILT / 2, scale: LOWER_SCALE, z: 1 };
        }
        const mx = (a.x + b.x) / 2;
        if (i === 0) return { x: mx - a.x, y: 0, rotate: 0, scale: 1, z: 2 };
        return { x: mx - b.x, y: 0, rotate: TILT, scale: LOWER_SCALE, z: 1 };
    };

    return (
        <section className={s.tiers} aria-labelledby="tiers-title">
            <h2 id="tiers-title" className={`${ralewayBold.className} ${s.title}`}>{sections.tiers.title}</h2>
            <p className={s.description}>{sections.tiers.text}</p>

            <div ref={grid} className={s.grid}>
                {tiers.map((tier, i) => (
                    <div key={tier.title} ref={(el) => { cards.current[i] = el }} className={s.slot}>
                        <Dealt progress={progress} stack={stackOf(i)} window={DEAL[i]}>
                            <TierCard
                                tier={tier}
                                text={tierText[i]?.text ?? ''}
                                examples={tierText[i]?.examples ?? []}
                                progress={progress}
                                textFrom={TEXT_FROM[i] ?? 0}
                            />
                        </Dealt>
                    </div>
                ))}
            </div>
            <p className={s.note}>{note}</p>
        </section>
    );
};

export default TierDeck;
