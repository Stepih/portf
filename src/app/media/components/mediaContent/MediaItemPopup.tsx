"use client"


import { FC, useState } from "react";
import { motion } from "framer-motion";

import s from "./MediaItemPopup.module.scss";
import { IMedia } from "@/interfaces/mediaImages";
import ImageMediaSlider from "../slider/Slider";
import MediaDescription from "./MediaDescription";
import FormButton from "@/components/ui/buttons/button-form/FormButton";


interface IPopup {
    handlePopup: (id?: number) => void;
    content: IMedia[];
    id?: number;
    nextStep: (num: number) => void;
}

const MediaItemPopup: FC<IPopup> = ({ handlePopup, content, nextStep, id }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const windowHeight = window.innerHeight;

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
                    <ImageMediaSlider slideNotesPosition='right' anim={false} images={content[id].images} gifs={content[id].gifs} bits={content[id].bits} />
                </div>
                
                <div className={s.rightBlock}>
                    <MediaDescription title={content[id].title} description={content[id].description}/>
                    <div className={s.btns}>
                        <FormButton action={() => handlePopup(undefined)} text="Выйти" />
                        {id > 0 && <FormButton action={()=> nextStep(-1)} text="Назад"/>}
                        {id !== undefined && content.length - 1 > id && <FormButton action={() => nextStep(1)} text="Далее"/>}
                    </div>
                </div>
                </>
            )}
        </motion.div>
        
        </>
    );
};

export default MediaItemPopup;
