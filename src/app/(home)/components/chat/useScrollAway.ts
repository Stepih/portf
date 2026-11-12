import { RefObject, useEffect, useState } from "react";

// Сколько шар ждёт после остановки прокрутки, прежде чем вернуться
export const SCROLL_AWAY_IDLE = 600;

// Шар чата на телефоне уходит, пока страницу листают вниз (DESIGN_FIXES_8_PLAN Д44, выбор владельца 12.11.2026):
// шар 54px шире поля страницы, и текст проезжал под ним. Листают вверх – шар сразу на месте,
// остановились – возвращается через SCROLL_AWAY_IDLE. Шар в фокусе не уходит: с клавиатуры он должен быть виден
export const useScrollAway = (enabled: boolean, keep: RefObject<HTMLElement | null>): boolean => {
    const [away, setAway] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setAway(false);
            return;
        }
        let lastY = window.scrollY;
        let timer: number | undefined;

        const onScroll = () => {
            const y = window.scrollY;
            const dy = y - lastY;
            lastY = y;
            window.clearTimeout(timer);
            // Пружина у края страницы на iOS даёт сдвиги в 1–2px – их не считаем
            if (dy < 0 || (keep.current && keep.current === document.activeElement)) {
                setAway(false);
                return;
            }
            if (dy > 2) setAway(true);
            timer = window.setTimeout(() => setAway(false), SCROLL_AWAY_IDLE);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.clearTimeout(timer);
        };
    }, [enabled, keep]);

    return away;
};
