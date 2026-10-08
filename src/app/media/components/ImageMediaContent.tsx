"use client";

import { FC, useEffect, useRef, useState } from "react";
import { IMedia } from "@/interfaces/mediaImages";
import { debounce } from "lodash";

import MediaItem from "./mediaContent/MediaItem";
import MediaItemPopup from "./mediaContent/MediaItemPopup";
import { AnimatePresence } from "framer-motion";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useIsTouchDevice } from "@/hooks/useIstouchDevice";

const ImageMediaContent: FC<{ content: IMedia[] }> = ({ content }) => {
    const touchDevice = useIsTouchDevice();
    const [scrollPosition, setScrollPosition] = useState(0);
    const [positions, setPositions] = useState<{ top: number; bottom: number }[]>([]);
    
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

    const rabota = 800 //Ограничить, при какой высоте экрана вырубать анимацию
    
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

            const onScroll = () => {
                requestAnimationFrame(handleScroll);
            };
            
            const onResize = debounce(() => {
                if (typeof window !== "undefined" && Math.abs(prevHeight.current - window.innerHeight) > 100) {
                    setWindowHeight(window.innerHeight);
                    prevHeight.current = window.innerHeight;
                    updatePositions();
                }
            }, 500);

            if (typeof window !== "undefined" && rabota < windowHeight) {
                window.addEventListener("scroll", onScroll, { passive: true });
                window.addEventListener('resize', onResize, { passive: true });
            }

            return () => {
                window.removeEventListener("scroll", onScroll);
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

    const handleScroll = () => {
        if (typeof window !== "undefined") {
            setScrollPosition(window.scrollY);
        }
    };

    const calculateOpacity = (id: number) => {
        if (windowHeight !== undefined && windowHeight < rabota) return 1
        if (id === positions.length - 1) return 1;
        const elemTop = positions[id]?.top ?? 0;
        const elemBottom = positions[id]?.bottom ?? 0;
        const elemHeight = elemBottom - elemTop;

        if (elemHeight === 0) return 1;

        if (scrollPosition < elemTop) {
            return 1;
        }

        if (scrollPosition >= elemTop && scrollPosition <= elemBottom) {
            const scrollRelativeToElem = scrollPosition - elemTop;
            const speed = 3;
            const opacity = 1 - (scrollRelativeToElem / elemHeight) * speed;

            return Math.max(opacity, 0);
        }

        return 0;
    };

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
                opacity={calculateOpacity(id)}
                contentRef={(el) => {
                    contentRefs.current[id] = el;
                }}
            />
        ))}
        
        </>
    );
};

export default ImageMediaContent;
