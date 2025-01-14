"use client"


import { FC, useState } from "react";
import { motion } from "framer-motion";

import s from "./MediaItemPopup.module.scss";
import { IMedia } from "@/interfaces/mediaImages";
import ImageMediaSlider from "../../../../components/slider/Slider";
import MediaDescription from "./MediaDescription";
import ActionButton from "@/components/ui/buttons/button-action/ActionButton";


interface IPopup {
    handlePopup: (id?: number) => void;
    content: IMedia[];
    id: number;
    nextStep: (num: number) => void;
}

const MediaItemPopup: FC<IPopup> = ({ handlePopup, content, nextStep, id }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const windowHeight = window.innerHeight;

    const sliderContent = content[id].images || content[id].imagesComparison

    return (
        <>
            <motion.div
                style={{ willChange: isAnimating ? "transform, opacity" : "auto" }}
                initial={{ y: windowHeight + 200 }} // Начальное состояние
                animate={{ y: 0 }} // Финальное состояние
                exit={{ y: windowHeight + 500, scale: 1.2 }} // Состояние при удалении
                onAnimationComplete={() => setIsAnimating(false)}
                transition={{
                    scale: { duration: 0.8, ease: "easeInOut" }, // Без задержки
                    y: { duration: 0.8, delay: 0.2, ease: "easeInOut" }, // С задержкой
                    type: "spring",
                    stiffness: 150,
                    damping: 25,
                }}
                className={s.wrapper}
                
            >
            {id !== undefined && id >= 0 && (
                <>
                <div className={s.slider}>
                    <ImageMediaSlider objectFit='cover' slideNotesPosition='right' anim={false} content={sliderContent} />
                </div>
                
                <div className={s.rightBlock}>
                    <MediaDescription title={content[id].title} description={content[id].description}/>
                    <div className={s.btns}>
                        <ActionButton type='button' action={() => handlePopup(undefined)} text="Выйти" />
                        {id > 0 && <ActionButton type='button' action={()=> nextStep(-1)} text="Назад"/>}
                        {id !== undefined && content.length - 1 > id && <ActionButton type='button' action={() => nextStep(1)} text="Далее"/>}
                    </div>
                </div>
                </>
            )}
        </motion.div>
        
        </>
    );
};

export default MediaItemPopup;
