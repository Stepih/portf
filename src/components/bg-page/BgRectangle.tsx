

import { FC } from 'react'
import s from './BgRectangle.module.scss'
import { motion, MotionValue } from "framer-motion";

import Nota from '@/assets/_img/icons/nota.svg'

interface BgRectangleProps {
    currentUrl: string;
    // Сдвиг по вертикали: MotionValue двигает фигуру без ре-рендеров
    parallax: number | MotionValue<number>;
}

export const BgRectangle1:FC<BgRectangleProps> = ({currentUrl, parallax}) => {
    

    return (
        <motion.div style={{y: parallax}} className={s.BgRectangle1}>
            <div className={s.circle}>
                
            </div>
            <Nota style={{opacity: currentUrl === "/music" ? 1 : 0}} className={s.img} />
        </motion.div>
        
    )
}

export const BgRectangle2:FC<BgRectangleProps> = ({currentUrl, parallax}) => {
    return (
        <motion.div style={{y: parallax}} className={s.BgRectangle2}>
            <div className={s.circle}>
                
            </div>
            <Nota style={{opacity: currentUrl === "/music" ? 1 : 0}} className={s.img} />
        </motion.div>
    )
}

