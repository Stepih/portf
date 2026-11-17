"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";

import s from './HeroSlides.module.scss'
import { allerta } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface HeroSlidesProps {
    // Крупные надписи латиницей, сменяют друг друга
    headlines: string[],
    // С какой надписи показ начинается и на какой останавливается
    first: number,
    // h1 под надписями – не сменяется
    title: string,
    // Сколько показывается надпись, мс
    interval: number
}

// Первый экран (SALES_PLAN 3.1.1): крупная надпись уходит вверх, новая въезжает снизу; h1 под ними стоит
// постоянно (Д50). Все надписи лежат в одной ячейке grid, поэтому блок не прыгает по высоте.
// Показ – один круг: надписи проходят по разу и останавливаются на первой (Д50, WCAG 2.2.2), дальше –
// только по клику на черту. Наведение и фокус ставят паузу. При «уменьшить движение» смены нет
const HeroSlides: FC<HeroSlidesProps> = ({ headlines, first, title, interval }) => {
    const reduceMotion = usePrefersReducedMotion();
    const [active, setActive] = useState(first);
    const [leaving, setLeaving] = useState<number | null>(null);
    // Круг пройден (или движение отключено): таймера нет, активная черта залита целиком
    const [stopped, setStopped] = useState(false);

    const activeRef = useRef(first);
    const elapsed = useRef(0);
    const steps = useRef(0);
    const paused = useRef(false);
    const fills = useRef<(HTMLSpanElement | null)[]>([]);

    const go = useCallback((n: number) => {
        if (n === activeRef.current) return;
        setLeaving(activeRef.current);
        setActive(n);
        activeRef.current = n;
        elapsed.current = 0;
    }, []);

    useEffect(() => {
        if (reduceMotion) go(first);
    }, [reduceMotion, first, go]);

    // Таймер на requestAnimationFrame: он же двигает полоску в активной черте без ре-рендеров
    useEffect(() => {
        if (reduceMotion || stopped) return;
        let raf = 0;
        let last = performance.now();
        const tick = (now: number) => {
            // Скрытая вкладка не крутит кадры, после возврата не перескакиваем
            const dt = Math.min(now - last, 100);
            last = now;
            if (!paused.current) {
                elapsed.current += dt;
                if (elapsed.current >= interval) {
                    steps.current += 1;
                    go((activeRef.current + 1) % headlines.length);
                    if (steps.current >= headlines.length) {
                        setStopped(true);
                        return;
                    }
                }
            }
            fills.current.forEach((fill, i) => {
                if (fill) fill.style.transform = `scaleX(${i === activeRef.current ? Math.min(elapsed.current / interval, 1) : 0})`;
            });
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [reduceMotion, stopped, interval, headlines.length, go]);

    // Клик по черте останавливает показ: дальше листает только посетитель
    const pick = (n: number) => {
        setStopped(true);
        go(n);
    };

    const still = reduceMotion || stopped;
    const stateClass = (i: number) => i === active ? s.active : i === leaving ? s.leaving : '';
    const pause = () => { paused.current = true };
    const resume = () => { paused.current = false };

    return (
        <div className={s.slides} onMouseEnter={pause} onMouseLeave={resume}>
            {/* Надписи на английском – оформление, скринридеру хватает h1 */}
            <div className={`${s.stack} ${s.headlines}`} aria-hidden="true">
                {headlines.map((headline, i) => (
                    <p key={headline} className={`${allerta.className} ${s.item} ${s.headline} ${stateClass(i)}`} lang="en">
                        {headline}
                    </p>
                ))}
            </div>

            <h1 id="hero-title" className={s.caption}>{title}</h1>

            {/* Черты листают только оформление: с клавиатуры и скринридеру они не нужны (Д50) */}
            <div className={s.dots} aria-hidden="true">
                {headlines.map((headline, i) => (
                    <button
                        key={headline}
                        type="button"
                        tabIndex={-1}
                        className={s.dot}
                        onClick={() => pick(i)}
                    >
                        <span
                            className={s.fill}
                            ref={(el) => { fills.current[i] = el }}
                            style={still ? { transform: `scaleX(${i === active ? 1 : 0})` } : undefined}
                        />
                    </button>
                ))}
            </div>
        </div>
    )
}

export default HeroSlides
