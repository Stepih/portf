import { FC } from "react";
import { motion } from "framer-motion";

import s from "./MediaItemPopup.module.scss";
import { IMedia } from "@/interfaces/mediaImages";
import ImageMediaSlider from "../slider/Slider";
import MediaDescription from "./MediaDescription";


interface IPopup {
    handlePopup: (id: number | undefined) => void;
    content: IMedia | undefined;
}

const MediaItemPopup: FC<IPopup> = ({ handlePopup, content }) => {
    const windowHeight = window.innerHeight;

    return (
        <motion.div
            initial={{ y: windowHeight, scale: 0.8 }} // Начальное состояние
            animate={{ y: 0, scale: 1 }} // Финальное состояние
            exit={{ y: windowHeight, scale: 0.8, zIndex: 10 }} // Состояние при удалении
            transition={{
                scale: { duration: 0.8, ease: "easeInOut" }, // Без задержки
                y: { duration: 0.8, delay: 0.2, ease: "easeInOut" }, // С задержкой
                type: "spring",
                stiffness: 150,
                damping: 25,
            }}
            className={s.wrapper}
        >
            {content && (
                <>
                <ImageMediaSlider images={content.images} gifs={content.gifs} bits={content.bits} />
                <div className={s.rightBlock}>
                    <MediaDescription title={content.title} description={content.description}/>
                </div>
                </>
            )}
            <button style={{position: 'absolute', top: 500, left: 1200}} onClick={() => handlePopup(undefined)}>fflflf</button>
        </motion.div>
    );
};

export default MediaItemPopup;
