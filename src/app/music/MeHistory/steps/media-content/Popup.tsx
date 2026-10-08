import { FC } from "react";
import { motion } from "framer-motion";

import { IImageMedia } from "@/interfaces/musicHistory";

import { IMediaVideo } from "@/interfaces/slider";
import ImageMediaSlider from "@/components/slider/Slider";
import BgFocus from "@/components/bg-page/BgFocus";

import Krest from '@/assets/_img/icons/krest.svg'

import s from './Popup.module.scss'

interface IPopup {
    handleOpenPopup: (content: undefined) => void,
    content: IMediaVideo[] | IImageMedia[],
}


const Popup: FC<IPopup> = ({handleOpenPopup, content}) => {
            
    return (
        <motion.div 
            initial={{opacity: 0}} 
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className={s.popup}>
            <div onClick={handleOpenPopup.bind(null, undefined)} className={s.bg}>
                <BgFocus status={true} />
            </div>
            <div onClick={handleOpenPopup.bind(null, undefined)} className={s.closePopup}>
                <Krest  />
            </div>
            <div className={s.content}>
                <ImageMediaSlider objectFit='contain' anim={true} slideNotesPosition="bottom" content={content} sizes="(max-width: 900px) 100vw, 900px"/>
            </div>
        </motion.div>
    )
}

export default Popup