"use client"

import { motion } from "framer-motion";

import Arrow from '@/assets/_img/icons/arrow.svg'

import s from './ButtonMore.module.scss'

interface IBtn<T> {
    // down — под рядом (мобильная раскладка), right — в конце ряда, растягивается по высоте контейнера
    direction?: 'down' | 'right',
    action?: () => void,
    paramAction?: (param: T) => void,
    param: T
}

// generic по типу param, поэтому не FC: FC не умеет параметры типа
const ButtonMore = <T,>({direction = 'down', action, paramAction, param}: IBtn<T>) => {
    return (
        <motion.button 
            type="button"
            onClick={() => {
                action && action(); 
                paramAction && paramAction(param)
            }} 
            whileHover="hover" 
            className={`${s.btn} ${s[direction]}`}
        >
            <motion.div initial={{transform: 'translateY(0px)'}} variants={{hover: {transform: 'translateY(90px)'}}} className={s.img}>
                <Arrow />
            </motion.div>
            <motion.span initial={{transform: 'translateY(-90px)'}} variants={{hover: {transform: 'translateY(0px)'}}} className={s.title}>Еще</motion.span>
        </motion.button>
    )
}

export default ButtonMore
