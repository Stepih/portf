"use client";

import { FC, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import FormButton from "@/components/ui/buttons/button-form/FormButton";
import { ralewayBold } from "@/fonts/fonts";
import s from "./MediaItem.module.scss";
import { IMedia } from "@/interfaces/mediaImages";
import ImageMediaSlider from "../slider/Slider";
import MediaDescription from "./MediaDescription";

interface MediaItemProps {
    item: IMedia;
    id: number;
    opacity: number;
    contentRef: (el: HTMLDivElement | null) => void;
    popup: boolean,
    handleSetPopup: (id: number | undefined) => void
}

const MediaItem: FC<MediaItemProps> = ({ item, id, opacity, contentRef, popup, handleSetPopup }) => {
    
    const windowHeight = window.innerHeight;

    return (
        <>
            
            <motion.div
                // Анимация компонента
                animate={popup ? { scale: 0.7, y: windowHeight } : { scale: 1, y: 0 }}
                transition={{
                    scale: { duration: 0.8, ease: "easeInOut" }, // Без задержки для изменения масштаба
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
                        <Link className={s.btnLink} href="/popup">
                            <FormButton text="Оставить заявку" />
                        </Link>
                    </div>
                    <div className={s.wrapperSlider}>
                        <ImageMediaSlider images={item.images} gifs={item.gifs} bits={item.bits} />
                        <button onClick={() => handleSetPopup(id)}>Open Popup</button>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
};

export default MediaItem;
