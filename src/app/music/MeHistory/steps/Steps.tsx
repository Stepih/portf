import { IMusicHistory } from "@/interfaces/musicHistory";
import { FC, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import s from './Steps.module.scss';
import MediaList from "./media-content/MediaContentList";
import { bodyLock, bodyUnLock } from "@/scripts/scrollTo";
import { isTouchDevice } from "@/scripts/typeDevice";

const Steps: FC<{ 
    musicHistory: IMusicHistory[], 
    step: number, 
    handleSetStep: (id: number, block: boolean) => void 
}> = ({ handleSetStep, musicHistory, step }) => {
    const refs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrolling = useRef(false);
    const isBlockScroll = useRef(false);
    const popupActiveRef = useRef(false);

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
            bodyLock();
            if (direction === 'up' && step === 0) {
                bodyUnLock();
            }
            if (direction === 'down' && step === 2) {
                bodyUnLock();
            }
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
