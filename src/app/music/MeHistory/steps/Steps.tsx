import { IMusicHistory } from "@/interfaces/musicHistory";
import { FC, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import s from './Steps.module.scss';
import MediaList from "./media-content/MediaContentList";
import { bodyLock, bodyUnLock, scrollToElementById } from "@/scripts/scrollTo";

const Steps: FC<{ musicHistory: IMusicHistory[], step: number, handleSetStep: (id: number, block: boolean) => void }> = ({ handleSetStep, musicHistory, step }) => {
    const refs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrolling = useRef(false);
    const isBlockScroll = useRef(false)


    // Проверка видимости элемента в зависимости от направления прокрутки
const isElementVisible = (el: HTMLDivElement | null, direction: "up" | "down"): boolean => {
    if (!el) return false;
    const headerHeight = document.querySelector("header")?.offsetHeight || 0
    const headerHeightScrollDown = headerHeight > 100 ? 0 : headerHeight;

    const rect = el.getBoundingClientRect();

    if (window.innerHeight > rect.height + 400) {
        isBlockScroll.current = true
    }

    if (direction === "down") {
        return rect.bottom - headerHeightScrollDown <= window.innerHeight && rect.top < window.innerHeight;
    } else {
        return rect.top >= 200 && rect.top <= window.innerHeight;
    }
};

// Функция для обработки направления прокрутки
const handleScroll = (direction: "up" | "down") => {
    if (isScrolling.current) return;

    const currentElement = refs.current[step];

    // Проверяем видимость верхней или нижней границы элемента в зависимости от направления
    if (!isElementVisible(currentElement, direction)) {
        return
    } 

    if (isBlockScroll.current) {
        bodyLock()
        if (direction === 'up' && step === 0) {
            bodyUnLock()
        }
        if (direction === 'down' && step === 2) {
            bodyUnLock()
        }
    }  

    const newStep = direction === "down" ? step + 1 : step - 1;

    if (newStep >= 0 && newStep < musicHistory.length) {
        isScrolling.current = true;

        
        handleSetStep(newStep, !isBlockScroll.current);
        
        // Снимаем флаг скроллинга после завершения прокрутки
        setTimeout(() => {
            requestAnimationFrame(() => {
                isScrolling.current = false;
            });
        }, 2000);
    }
};


    // Обработчики событий мыши и тачпада для управления шагом
    const handleWheel = (event: WheelEvent) => {
        if (event.deltaY > 0) {
            handleScroll("down");
        } else if (event.deltaY < 0) {
            handleScroll("up");
        }
    };

    // Для мобильных устройств отслеживаем начало и конец тача
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
            case 'ArrowDown': handleScroll('down')
            case 'ArrowUp': handleScroll('up')
            default: return
        }
    }

    useEffect(() => {
        // Добавляем обработчики событий
        window.addEventListener("wheel", handleWheel, { passive: true });
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });
        window.addEventListener("keydown", handleKeyScroll, { passive: true});

        // Очищаем обработчики при размонтировании
        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
            window.removeEventListener("keydown", handleKeyScroll)
        };
    }, [step]);

    return (
        <>
            {musicHistory.map((history, idx) => 
                <motion.div
                    ref={(el) => { refs.current[idx] = el; }}
                    style={{ display: step === idx ? 'block' : 'none' }} // Показываем только текущий шаг
                    key={history.id}
                    className={s.wrapper}
                >
                    <p className={s.description}>{history.description}</p>
                    <MediaList step={step} videos={history.videos || []} images={history.images || []} />
                </motion.div>
            )}
        </>
    );
};

export default Steps;
