"use client";

import { FC, ReactNode } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import s from './Rise.module.scss'
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { rise, span } from "./scene";

interface IRise {
    progress: MotionValue<number>,
    from: number,
    dur: number,
    // span – строка внутри текста, div – вокруг блока
    tag?: 'span' | 'div',
    className?: string,
    children: ReactNode
}

// Строка выезжает снизу из-под своей маски по прогрессу – как текст карточек «Избранных кейсов» (CaseCard, Rise).
// Кривая rise – с ограниченным наклоном (единая скорость, speed.ts)
const Rise: FC<IRise> = ({ progress, from, dur, tag = 'span', className, children }) => {
    const reduceMotion = usePrefersReducedMotion();
    const y = useTransform(progress, (v) => `${((1 - rise(span(v, from, dur))) * 110).toFixed(2)}%`);
    const Mask = tag;
    const Inner = tag === 'span' ? motion.span : motion.div;

    return (
        <Mask className={`${s.mask} ${className ?? ''}`}>
            <Inner className={s.rise} style={{ y: reduceMotion ? 0 : y }}>{children}</Inner>
        </Mask>
    );
};

export default Rise;
