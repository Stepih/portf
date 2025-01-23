"use client";

import { FC, useEffect,  useState } from "react";
import {  motion } from "framer-motion";
import Link from "next/link";
import { ralewayBold } from "../../../../styles/fonts/fonts";
import { IMedia } from "@/interfaces/mediaImages";

import s from "./MediaItem.module.scss";
import ActionButton from "@/components/ui/buttons/button-action/ActionButton";
import ImageMediaSlider from "../../../../components/slider/Slider";
import MediaDescription from "./MediaDescription";

import Open from '@/assets/_img/icons/open.svg'
import Prompt from "@/components/ui/prompt/Prompt";

interface MediaItemProps {
    item: IMedia;
    id: number;
    opacity: number;
    contentRef: (el: HTMLDivElement | null) => void;
    popup: boolean,
    handleSetPopup?: (id: number | undefined) => void
}

const MediaItem: FC<MediaItemProps> = ({ item, id, opacity, contentRef, popup, handleSetPopup }) => {
   
    const [prompt, setPrompt] = useState(false);
    
    const content = item.images ? item.images : item.imagesComparison;
    const checkPopup = popup !== undefined && popup;

    const [pageHeight, setPageHeight] = useState(0);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setPageHeight(window.innerHeight);
        }
    }, []);

    console.log(pageHeight)
    return (
        <>
            <motion.div
                // animate={checkPopup ? { scale: 0.7, y: windowHeight } : { scale: 1, y: 0 }}
                transition={{
                    scale: { duration: 0.8, delay: checkPopup ? 0 : 0.4, ease: "easeInOut" }, // Без задержки для изменения масштаба
                    y: { duration: 0.8, delay: 0.2, ease: "easeInOut" }, // Задержка для смещения
                    type: "spring",
                    stiffness: 150,
                    damping: 25,
                }}
                className={s.mainWrapper}
                ref={contentRef}
                style={{
                    opacity,
                    pointerEvents: opacity === 0 ? "none" : "auto",
                    position: pageHeight && pageHeight > 800 ? 'sticky' : 'relative'
                }}
            >
                <h2 className={`${s.titleW} ${ralewayBold.className}`}>{item.title}</h2>
                <motion.div
                    style={{
                        flexDirection: id % 2 === 0 ? "row-reverse" : "row",
                    }}
                    className={s.wrapper}
                >
                    <div className={s.text} style={{ textAlign: id % 2 !== 0 ? "end" : "start" }}>
                        
                        <MediaDescription title={item.title} description={item.description} />
                        <Link href="/popup">
                            <ActionButton type='button' text="Оставить заявку" />
                        </Link>
                    </div>
                    <div className={s.wrapperSlider}>
                        <ImageMediaSlider objectFit='cover' slideNotesPosition="bottom" anim={true} content={content} />
                        {handleSetPopup && (
                            <motion.div 
                                onHoverStart={()=> setPrompt(true)} 
                                onHoverEnd={() => setPrompt(false)}
                                className={s.open}
                            >
                                <Prompt screen="auto" title="Полноэкранный режим" show={prompt} type="active">
                                    <Open onClick={() => handleSetPopup(id)} />
                                </Prompt>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
};

export default MediaItem;
