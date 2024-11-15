"use client"

import { FC, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IMedia } from "@/interfaces/mediaImages";

import s from './ImageMediaContent.module.scss';
import Slider from "./slider/Slider";
import FormButton from "@/components/ui/buttons/button-form/FormButton";
import Link from "next/link";

import { ralewayBold } from "@/fonts/fonts";
import BgFocus from "@/components/bg-page/BgFocus";

const ImageMediaContent: FC<{ content: IMedia[] }> = ({ content }) => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [positions, setPositions] = useState<{ top: number, bottom: number }[]>([]);
    const [accent, setAccent] = useState(false);
    const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Установка позиций при рендере и обновление при изменении размеров окна
        updatePositions();
        
        const onScroll = () => {
            requestAnimationFrame(handleScroll);
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', updatePositions);
        };
    }, []);

    const updatePositions = () => {
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
        const elemTop = positions[id]?.top ?? 0; // Если top undefined, то 0
        const elemBottom = positions[id]?.bottom ?? 0; // Если bottom undefined, то 0
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

    const renderDescription = (item:IMedia) => {
        const parts = item.description.split('{link}')

        return (
            <>
            {parts.length > 1 ? (
                <>
                {parts[0]}
                <Link className={s.link} href="/music">этой странице</Link>
                {parts[1]}
                </>
            ) : (
                item.description
            )}
            </>
        );
    };
    

    return (
        <>
        {<BgFocus status={accent}/>}
            {content.map((item, id) => (
                <motion.div
                    onHoverEnd={() => setAccent(false)} onHoverStart={() => setAccent(true)} 
                    className={s.mainWrapper} 
                    ref={(el) => { contentRefs.current[id] = el }}
                    style={{ 
                        opacity: calculateOpacity(id),
                        pointerEvents: calculateOpacity(id) === 0 ? 'none' : 'auto',
                    }}
                    key={item.id}
                    >
                    <h2 className={`${s.titleW} ${ralewayBold.className}`}>{item.title}</h2>
                    <motion.div
                    style={{
                        flexDirection: item.id % 2 === 0 ? 'row-reverse' : 'row',
                    }}
                    className={s.wrapper}
                >
                    <div className={s.text} style={{ textAlign: item.id % 2 !== 0 ? 'end' : 'start' }}>
                        <h2 className={`${s.title} ${ralewayBold.className}`}>{item.title}</h2>
                        <p className={s.description}>{renderDescription(item)}</p>
                        <Link className={s.btnLink} href="/popup">
                            <FormButton text="Оставить заявку" />
                        </Link>
                    </div>
                    <div className={s.wrapperSlider}>
                        <Slider images={item.images} gifs={item.gifs} bits={item.bits} />
                    </div>
                </motion.div>
                </motion.div>
            ))}
        </>
    );
};

export default ImageMediaContent;
