"use client";

import { FC, useEffect, useRef, useState } from "react";
import { IMedia } from "@/interfaces/mediaImages";
import { debounce } from "lodash";

import MediaItem from "./mediaContent/MediaItem";
import MediaItemPopup from "./mediaContent/MediaItemPopup";
import { AnimatePresence } from "framer-motion";
import { isTouchDevice } from "@/scripts/typeDevice";
import { bodyLock, bodyUnLock } from "@/scripts/scrollTo";


const ImageMediaContent: FC<{ content: IMedia[] }> = ({ content }) => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [positions, setPositions] = useState<{ top: number; bottom: number }[]>([]);
    
    const [popup, setPopup] = useState<boolean>(false);
    const [step, setStep] = useState(0)
    
    const nextStep = (num: number) => {
        setStep(step + num) 
    }
    
    const handleSetPopup = (id: number | undefined) => {
        setPopup(true);
        id !== undefined && id >= 0 ? setStep(id) : setPopup(false)
    };
    
    const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    useEffect(() => {
        updatePositions();

        const onScroll = () => {
            requestAnimationFrame(handleScroll);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener('resize', debounce(updatePositions, 500), { passive: true })

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", updatePositions);
        };
    }, []);

    const updatePositions = () => {
        console.log(1)
        window.scrollTo({
            top: 0,
            behavior: "instant",
        });
        const pos = contentRefs.current.map((el) => {
            if (el) {
                const rect = el.getBoundingClientRect();
                return {
                    top: rect.top + window.scrollY,
                    bottom: rect.bottom + window.scrollY,
                };
            }
            return { top: 0, bottom: 0 };
        });
        setPositions(pos);
    };

    const handleScroll = () => {
        setScrollPosition(window.scrollY);
    };

    const calculateOpacity = (id: number) => {
        if (id === positions.length - 1) return 1
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

   
    popup ? bodyLock() : bodyUnLock()


    return (
        <>
        <AnimatePresence>
            {popup && <MediaItemPopup key={step} nextStep={nextStep} content={content} id={step} handlePopup={handleSetPopup} />}
        </AnimatePresence>
        
        {content.map((item, id) => (
            <MediaItem
                key={item.id}
                popup={popup}
                handleSetPopup={!isTouchDevice() ? handleSetPopup : undefined}
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
