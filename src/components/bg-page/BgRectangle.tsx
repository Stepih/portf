

import { FC } from 'react'
import s from './BgRectangle.module.scss'
import { motion } from "framer-motion";

import Nota from '@/assets/_img/icons/nota.svg'

export const BgRectangle1:FC<{currentUrl: string, parallax: number}> = ({currentUrl, parallax}) => {
    

    return (
        <motion.div animate={{y: parallax}} transition={{damping: 1}} className={s.BgRectangle1}>
            <div className={s.circle}>
                
            </div>
            <Nota style={{opacity: currentUrl === "/music" ? 1 : 0}} className={s.img} />
        </motion.div>
        
    )
}

export const BgRectangle2:FC<{currentUrl: string, parallax: number}> = ({currentUrl, parallax}) => {
    return (
        <motion.div animate={{y: parallax}} transition={{damping: 1}} className={s.BgRectangle2}>
            <div className={s.circle}>
                
            </div>
            <Nota style={{opacity: currentUrl === "/music" ? 1 : 0}} className={s.img} />
        </motion.div>
    )
}

