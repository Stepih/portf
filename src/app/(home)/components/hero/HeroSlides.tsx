"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";

import s from './HeroSlides.module.scss'
import { allerta } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { IHeroSlide } from "@/interfaces/offer";

interface HeroSlidesProps {
    slides: IHeroSlide[],
    // Подпись этого слайда рендерится как h1
    titleSlide: number,
    // Сколько показывается слайд, мс
    interval: number
}

// Сменяющиеся надпись и подпись первого экрана (SALES_PLAN 3.1.1): старый слайд уходит вверх,
// новый въезжает снизу. Все слайды лежат в одной ячейке grid, поэтому блок не прыгает по высоте.
// Показ начинается со слайда с h1, чтобы оффер был виден сразу (CONVERSION_PLAN К1.1).
// Наведение и фокус ставят паузу. При «уменьшить движение» смены нет, виден слайд с h1
const HeroSlides: FC<HeroSlidesProps> = ({ slides, titleSlide, interval }) => {
    const reduceMotion = usePrefersReducedMotion();
    const [active, setActive] = useState(titleSlide);
    const [leaving, setLeaving] = useState<number | null>(null);

    const activeRef = useRef(titleSlide);
    const elapsed = useRef(0);
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
        if (reduceMotion) go(titleSlide);
    }, [reduceMotion, titleSlide, go]);

    // Таймер на requestAnimationFrame: он же двигает полоску в активной черте без ре-рендеров
    useEffect(() => {
        if (reduceMotion) return;
        let raf = 0;
        let last = performance.now();
        const tick = (now: number) => {
            // Скрытая вкладка не крутит кадры, после возврата не перескакиваем
            const dt = Math.min(now - last, 100);
            last = now;
            if (!paused.current) {
                elapsed.current += dt;
                if (elapsed.current >= interval) go((activeRef.current + 1) % slides.length);
            }
            fills.current.forEach((fill, i) => {
                if (fill) fill.style.transform = `scaleX(${i === activeRef.current ? Math.min(elapsed.current / interval, 1) : 0})`;
            });
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [reduceMotion, interval, slides.length, go]);

    const stateClass = (i: number) => i === active ? s.active : i === leaving ? s.leaving : '';
    const pause = () => { paused.current = true };
    const resume = () => { paused.current = false };

    return (
        <div className={s.slides} onMouseEnter={pause} onMouseLeave={resume} onFocus={pause} onBlur={resume}>
            {/* Надписи на английском – оформление, скринридеру хватает h1 */}
            <div className={`${s.stack} ${s.headlines}`} aria-hidden="true">
                {slides.map((slide, i) => (
                    <p key={slide.headline} className={`${allerta.className} ${s.item} ${s.headline} ${stateClass(i)}`} lang="en">
                        {slide.headline}
                    </p>
                ))}
            </div>

            <div className={`${s.stack} ${s.captions}`}>
                {slides.map((slide, i) => i === titleSlide
                    ? <h1 key={slide.caption} id="hero-title" className={`${s.item} ${s.caption} ${stateClass(i)}`}>{slide.caption}</h1>
                    : <p key={slide.caption} className={`${s.item} ${s.caption} ${stateClass(i)}`} aria-hidden="true">{slide.caption}</p>
                )}
            </div>

            <div className={s.dots}>
                {slides.map((slide, i) => (
                    <button
                        key={slide.headline}
                        type="button"
                        className={s.dot}
                        aria-label={`Слайд ${i + 1}`}
                        aria-current={i === active}
                        onClick={() => go(i)}
                    >
                        <span
                            className={s.fill}
                            ref={(el) => { fills.current[i] = el }}
                            style={reduceMotion ? { transform: `scaleX(${i === active ? 1 : 0})` } : undefined}
                        />
                    </button>
                ))}
            </div>
        </div>
    )
}

export default HeroSlides
