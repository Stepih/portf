"use client";

import { FC, useRef } from "react";
import { motion, MotionValue, useScroll, useSpring, useTransform } from "framer-motion";

import s from './TierSplit.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { IServiceTier } from "@/interfaces/offer";
import TierCard from "../TierCard";
import { easeOut, easeOutBack, span, SMOOTH } from "../scene";
import { sections, tierText } from "@/data/aiPage";

interface ITierSplit {
    tiers: IServiceTier[],
    note: string
}

// По прогрессу блока: шов прорисовывается по середине одной карточки, она расходится на две,
// цены прокручиваются, как счётчик, от нуля до своей суммы (ANIMATION_PLAN 3А)
const SEAM = [0, .25];
const SPLIT = [.22, .7];
const ROLL = [.15, .75];
const GAP = 24;

const k = (v: number, [from, to]: number[]) => span(v, from, to - from);

// Разряд цены: лента 0–9 дважды, едет от нуля через полный круг к своей цифре; правые разряды докатываются позже
const Digit: FC<{ progress: MotionValue<number>, digit: number, order: number }> = ({ progress, digit, order }) => {
    const y = useTransform(progress, (v) => {
        const e = easeOut(span(v, ROLL[0] + order * .03, ROLL[1] - ROLL[0] - .12));
        return `${-((10 + digit) * e) * 5}%`;
    });
    return (
        <span className={s.digit}>
            <motion.span className={s.strip} style={{ y }}>
                {Array.from({ length: 20 }, (_, n) => <span key={n}>{n % 10}</span>)}
            </motion.span>
        </span>
    );
};

const PriceRoll: FC<{ progress: MotionValue<number>, price: string }> = ({ progress, price }) => {
    const reduceMotion = usePrefersReducedMotion();
    if (reduceMotion) return <>{price}</>;
    let order = 0;
    return (
        <span className={s.price} aria-label={price}>
            {price.split('').map((char, i) => /\d/.test(char)
                ? <Digit key={i} progress={progress} digit={+char} order={order++} />
                : <span key={i} aria-hidden="true">{char}</span>)}
        </span>
    );
};

// Вариант B, ступени после сцены: сначала одна карточка с двумя ступенями, как на главной; скролл делит её по шву на две
const TierSplit: FC<ITierSplit> = ({ tiers, note }) => {
    const reduceMotion = usePrefersReducedMotion();
    const column = useMediaQuery('(max-width: 899px)');
    const grid = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: grid, offset: ['start 0.9', 'start 0.25'] });
    const progress = useSpring(scrollYProgress, SMOOTH);

    const split = useTransform(progress, (v) => easeOutBack(k(v, SPLIT)));
    const toSeam = useTransform(split, (e) => GAP / 2 * (1 - e));
    const fromSeam = useTransform(toSeam, (d) => -d);
    const inner = useTransform(progress, (v) => 13 * easeOut(k(v, SPLIT)));
    const seam = useTransform(progress, (v) => easeOut(k(v, SEAM)));
    const seamOpacity = useTransform(progress, (v) => 1 - k(v, [SPLIT[0] + .05, SPLIT[0] + .2]));
    const merged = useTransform(progress, (v) => 1 - k(v, [SPLIT[0], SPLIT[0] + .25]));
    const own = useTransform(merged, (m) => 1 - m);

    // Первая карточка сдвинута к шву вправо (на телефоне – вниз), вторая – навстречу; у шва углы прямые, пока не разошлись
    // При reduced-motion – явные нули, а не undefined: хук включается после монтирования, и framer-motion оставил бы
    // сдвиг и прямые углы первого рендера (карточки слипались бы)
    const shift = (i: number) => reduceMotion ? { x: 0, y: 0 } : column
        ? { y: i === 0 ? toSeam : fromSeam }
        : { x: i === 0 ? toSeam : fromSeam };
    const corners = (i: number) => reduceMotion
        ? { borderTopLeftRadius: 13, borderTopRightRadius: 13, borderBottomLeftRadius: 13, borderBottomRightRadius: 13 }
        : column
        ? (i === 0 ? { borderBottomLeftRadius: inner, borderBottomRightRadius: inner } : { borderTopLeftRadius: inner, borderTopRightRadius: inner })
        : (i === 0 ? { borderTopRightRadius: inner, borderBottomRightRadius: inner } : { borderTopLeftRadius: inner, borderBottomLeftRadius: inner });

    return (
        <section className={s.tiers} aria-labelledby="tiers-title">
            <h2 id="tiers-title" className={`${ralewayBold.className} ${s.title}`}>{sections.tiers.title}</h2>
            <p className={s.description}>{sections.tiers.text}</p>

            <div ref={grid} className={s.grid}>
                {/* Тень одной карточки до раздела – иначе тень второй ложится на первую у шва */}
                {!reduceMotion && <motion.span className={s.merged} style={{ opacity: merged }} aria-hidden="true" />}
                {tiers.map((tier, i) => (
                    <motion.div key={tier.title} className={s.slot} style={shift(i)}>
                        <motion.span className={s.shadow} style={{ opacity: reduceMotion ? 1 : own, ...corners(i) }} aria-hidden="true" />
                        <motion.article className={s.card} style={corners(i)}>
                            <TierCard
                                tier={tier}
                                text={tierText[i]?.text ?? ''}
                                examples={tierText[i]?.examples ?? []}
                                progress={progress}
                                textFrom={.05 + i * .08}
                                price={<PriceRoll progress={progress} price={tier.price} />}
                            />
                        </motion.article>
                    </motion.div>
                ))}
                {!reduceMotion && (
                    <motion.span
                        className={s.seam}
                        style={column ? { scaleX: seam, opacity: seamOpacity } : { scaleY: seam, opacity: seamOpacity }}
                        aria-hidden="true"
                    />
                )}
            </div>
            <p className={s.note}>{note}</p>
        </section>
    );
};

export default TierSplit;
