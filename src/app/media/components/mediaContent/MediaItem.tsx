"use client";

import { FC, useEffect,  useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import { ralewayBold } from "@/app/fonts/fonts";
import { IMedia } from "@/interfaces/mediaImages";
import { fadeOpacity, IBlockBounds } from "../fadeOpacity";

import s from "./MediaItem.module.scss";
import ActionButton from "@/components/ui/buttons/button-action/ActionButton";
import ImageMediaSlider from "../../../../components/slider/Slider";
import MediaDescription from "./MediaDescription";

import Open from '@/assets/_img/icons/open.svg'
import Prompt from "@/components/ui/prompt/Prompt";

interface MediaItemProps {
    item: IMedia;
    id: number;
    scrollY: MotionValue<number>;
    // Границы блока в потоке страницы; без них блок не гаснет
    bounds?: IBlockBounds;
    contentRef: (el: HTMLDivElement | null) => void;
    popup: boolean,
    handleSetPopup?: (id: number | undefined) => void
}

const MediaItem: FC<MediaItemProps> = ({ item, id, scrollY, bounds, contentRef, popup, handleSetPopup }) => {
   
    const [prompt, setPrompt] = useState(false);
    
    const content = item.images ? item.images : item.imagesComparison;
    const checkPopup = popup !== undefined && popup;

    const opacity = useTransform(scrollY, (y) => (bounds ? fadeOpacity(y, bounds) : 1));
    const pointerEvents = useTransform(opacity, (o) => (o === 0 ? "none" : "auto"));

    const [pageHeight, setPageHeight] = useState(0);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setPageHeight(window.innerHeight);
        }
    }, []);

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
                    pointerEvents,
                    position: pageHeight && pageHeight > 800 ? 'sticky' : 'relative'
                }}
            >
                {/* Копия заголовка из MediaDescription для узкого экрана: в разметке заголовок один */}
                <p className={`${s.titleW} ${ralewayBold.className}`} aria-hidden="true">{item.title}</p>
                <motion.div
                    style={{
                        flexDirection: id % 2 === 0 ? "row-reverse" : "row",
                    }}
                    className={s.wrapper}
                >
                    <div className={s.text} style={{ textAlign: id % 2 !== 0 ? "end" : "start" }} data-goal-place="media">
                        
                        <MediaDescription title={item.title} description={item.description} />
                        <ActionButton href="/popup" text="Оставить заявку" />
                    </div>
                    <div className={s.wrapperSlider}>
                        {/* Слайдер до 750×400 с cover: на узком экране картинка 16:9 растягивается по высоте до ~711px, поэтому ширина почти постоянная */}
                        <ImageMediaSlider objectFit='cover' slideNotesPosition="bottom" anim={true} content={content} sizes="750px" alt={item.title} />
                        {handleSetPopup && (
                            <motion.div 
                                onHoverStart={()=> setPrompt(true)} 
                                onHoverEnd={() => setPrompt(false)}
                                className={s.open}
                            >
                                <Prompt screen="auto" title="Полноэкранный режим" show={prompt} type="active">
                                    <button type="button" className={s.openBtn} onClick={() => handleSetPopup(id)} aria-label="Полноэкранный режим">
                                        <Open />
                                    </button>
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
