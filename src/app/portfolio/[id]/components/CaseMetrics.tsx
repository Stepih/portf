"use client";

import { CSSProperties, FC, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

import s from './CaseMetrics.module.scss'
import { allerta } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { easeOutCubic } from "../../components/easing";
import { formatMetric, parseMetric } from "./caseMath";
import Rise from "./Rise";

const COUNT_MS = 1400;

// Число считается от нуля, когда цифра появляется на экране. В разметке сразу итоговое значение — его видят поисковики и экранные чтецы
const Counter: FC<{ value: string }> = ({ value }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
    const reduceMotion = usePrefersReducedMotion();

    useEffect(() => {
        const el = ref.current;
        const parts = parseMetric(value);
        if (!inView || !el || !parts || reduceMotion) return;

        let raf = 0;
        const t0 = performance.now() + 150;
        const tick = (now: number) => {
            const t = Math.min(1, Math.max(0, (now - t0) / COUNT_MS));
            el.textContent = t < 1 ? formatMetric(parts, easeOutCubic(t)) : value;
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(raf);
            el.textContent = value;
        };
    }, [inView, value, reduceMotion]);

    return <span ref={ref} className={`${allerta.className} ${s.value}`}>{value}</span>
}

// «Цифры»: крупные значения с подписью над тонкой линией
const CaseMetrics: FC<{ metrics: [string, string][] }> = ({ metrics }) => {
    // --len — длина самого длинного значения: по нему считается один размер шрифта для всех цифр
    return (
        <section className={s.metrics} aria-label="Цифры" style={{ '--len': Math.max(...metrics.map(([value]) => value.length)) } as CSSProperties}>
            {metrics.map(([value, label]) => (
                <Rise key={label} className={s.item}>
                    <Counter value={value} />
                    <span className={s.label}>{label}</span>
                </Rise>
            ))}
        </section>
    )
}

export default CaseMetrics
