"use client";

import { FC, useEffect, useRef, useState } from "react";
import { IMedia } from "@/interfaces/mediaImages";
import debounce from "lodash/debounce";

import MediaItem from "./mediaContent/MediaItem";
import MediaItemPopup from "./mediaContent/MediaItemPopup";
import { AnimatePresence, useScroll } from "framer-motion";
import { IBlockBounds } from "./fadeOpacity";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useIsTouchDevice } from "@/hooks/useIstouchDevice";

const ImageMediaContent: FC<{ content: IMedia[] }> = ({ content }) => {
    const touchDevice = useIsTouchDevice();
    // Прокрутка живёт в MotionValue: блоки гаснут без ре-рендеров
    const { scrollY } = useScroll();
    const [positions, setPositions] = useState<IBlockBounds[]>([]);
    
    const [popup, setPopup] = useState<boolean>(false);
    useBodyScrollLock(popup);
    const [step, setStep] = useState(0);
    
    const nextStep = (num: number) => {
        setStep(step + num);
    }
    
    const handleSetPopup = (id: number | undefined) => {
        setPopup(true);
        id !== undefined && id >= 0 ? setStep(id) : setPopup(false);
    };

    const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Ниже этой высоты экрана анимация выключена
    const minAnimatedHeight = 800
    
    // Инициализируем состояние windowHeight с undefined
    const [windowHeight, setWindowHeight] = useState<number | undefined>(undefined);
    const prevHeight = useRef<number>(windowHeight || 0); // Инициализируем с 0 (или любым значением по умолчанию)

    useEffect(() => {
        // Обновляем высоту окна только в клиентской части
        if (typeof window !== "undefined") {
            setWindowHeight(window.innerHeight);
        }
    }, []); // Этот useEffect сработает только на клиенте

    useEffect(() => {
        if (windowHeight !== undefined) {
            updatePositions();

            const onResize = debounce(() => {
                if (typeof window !== "undefined" && Math.abs(prevHeight.current - window.innerHeight) > 100) {
                    setWindowHeight(window.innerHeight);
                    prevHeight.current = window.innerHeight;
                    updatePositions();
                }
            }, 500);

            if (typeof window !== "undefined" && minAnimatedHeight < windowHeight) {
                window.addEventListener('resize', onResize, { passive: true });
            }

            return () => {
                window.removeEventListener("resize", onResize);
            };
        }
    }, [windowHeight]);

    const updatePositions = () => {
        if (typeof window !== "undefined") {
            // Блоки липкие (sticky): прилипший блок вернёт позицию на экране, а не в потоке.
            // На время замера снимаем sticky, чтобы не прокручивать страницу наверх.
            const els = contentRefs.current;
            const prevPositions = els.map((el) => el?.style.position ?? "");
            els.forEach((el) => {
                if (el) el.style.position = "static";
            });
            const pos = els.map((el) => {
                if (el) {
                    const rect = el.getBoundingClientRect();
                    return {
                        top: rect.top + window.scrollY,
                        bottom: rect.bottom + window.scrollY,
                    };
                }
                return { top: 0, bottom: 0 };
            });
            els.forEach((el, i) => {
                if (el) el.style.position = prevPositions[i];
            });
            setPositions(pos);
        }
    };

    // На низком экране анимация выключена, последний блок не гаснет никогда
    const fadeEnabled = (id: number) =>
        windowHeight !== undefined && minAnimatedHeight < windowHeight && id !== positions.length - 1;

    return (
        <>
        <AnimatePresence>
            {popup && <MediaItemPopup key={step} nextStep={nextStep} content={content} id={step} handlePopup={handleSetPopup} />}
        </AnimatePresence>
        
        {content.map((item, id) => (
            <MediaItem
                key={item.id}
                popup={popup}
                handleSetPopup={!touchDevice ? handleSetPopup : undefined}
                id={id}
                item={item}
                scrollY={scrollY}
                bounds={fadeEnabled(id) ? positions[id] : undefined}
                contentRef={(el) => {
                    contentRefs.current[id] = el;
                }}
            />
        ))}
        
        </>
    );
};

export default ImageMediaContent;
