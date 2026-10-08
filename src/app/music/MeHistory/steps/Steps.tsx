import { IMusicHistory } from "@/interfaces/musicHistory";
import { FC, RefObject, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import s from './Steps.module.scss';
import MediaList from "./media-content/MediaContentList";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { isTouchDevice } from "@/scripts/typeDevice";

const Steps: FC<{ 
    musicHistory: IMusicHistory[], 
    step: number, 
    handleSetStep: (id: number, block: boolean) => void,
    // Стрелки перехватываются, только когда фокус внутри этого элемента
    keyScopeRef: RefObject<HTMLElement | null>
}> = ({ handleSetStep, musicHistory, step, keyScopeRef }) => {
    const refs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrolling = useRef(false);
    const isBlockScroll = useRef(false);
    const popupActiveRef = useRef(false);
    // Пошаговый режим: пока листаем шаги, обычная прокрутка заблокирована
    const [stepLock, setStepLock] = useState(false);
    useBodyScrollLock(stepLock);

    const updatePopupActive = (isActive: boolean) => {
        popupActiveRef.current = isActive; // Синхронное обновление рефа
    };

    const isElementVisible = (el: HTMLDivElement | null, direction: "up" | "down"): boolean => {
        if (!el) return false;
        const headerHeight = document.querySelector("header")?.offsetHeight || 0;
        const headerHeightScrollDown = headerHeight > 100 ? 0 : headerHeight;

        const rect = el.getBoundingClientRect();

        if (window.innerHeight > rect.height + 400) {
            isBlockScroll.current = true;
        }

        const bottomListener = isTouchDevice() ? 100 : 0;

        if (direction === "down") {
            return rect.bottom - headerHeightScrollDown + bottomListener <= window.innerHeight && rect.top < window.innerHeight;
        } else {
            return rect.top >= 200 && rect.top <= window.innerHeight;
        }
    };

    const handleScroll = (direction: "up" | "down") => {
        if (isScrolling.current || popupActiveRef.current) return;

        const currentElement = refs.current[step];

        if (!isElementVisible(currentElement, direction)) {
            return;
        }

        if (isBlockScroll.current) {
            // На крайних шагах отпускаем прокрутку, чтобы уйти из истории
            const isEdge = (direction === 'up' && step === 0) || (direction === 'down' && step === 2);
            setStepLock(!isEdge);
        }

        const newStep = direction === "down" ? step + 1 : step - 1;

        if (newStep >= 0 && newStep < musicHistory.length) {
            isScrolling.current = true;
            handleSetStep(newStep, !isBlockScroll.current);

            setTimeout(() => {
                requestAnimationFrame(() => {
                    isScrolling.current = false;
                });
            }, 1500);
        }
    };

    const handleWheel = (event: WheelEvent) => {
        if (event.deltaY > 0) {
            handleScroll("down");
        } else if (event.deltaY < 0) {
            handleScroll("up");
        }
    };

    let touchStartY = 0;

    const handleTouchStart = (event: TouchEvent) => {
        touchStartY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
        const touchEndY = event.changedTouches[0].clientY;
        const direction = touchEndY < touchStartY ? "down" : "up";
        handleScroll(direction);
    };

    const handleKeyScroll = (event: KeyboardEvent) => {
        if (!keyScopeRef.current?.contains(document.activeElement)) return;
        switch (event.key) {
            case 'ArrowDown':
                handleScroll('down');
                break;
            case 'ArrowUp':
                handleScroll('up');
                break;
            default:
                return;
        }
    };

    useEffect(() => {
        window.addEventListener("wheel", handleWheel, { passive: true });
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });
        window.addEventListener("keydown", handleKeyScroll, { passive: true });

        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
            window.removeEventListener("keydown", handleKeyScroll);
        };
    }, [step]);

    return (
        <>
            {musicHistory.map((history, idx) =>
                <motion.div
                    ref={(el) => { refs.current[idx] = el; }}
                    style={{ display: step === idx ? 'block' : 'none' }}
                    key={history.id}
                    className={s.wrapper}
                >
                    <p className={s.description}>{history.description}</p>
                    <MediaList 
                        updatePopupActive={updatePopupActive} // Передаём функцию с обновлением рефа
                        step={step} 
                        videos={history.videos || []} 
                        images={history.images || []} 
                    />
                </motion.div>
            )}
        </>
    );
};

export default Steps;
