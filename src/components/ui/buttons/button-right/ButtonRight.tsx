"use client"

import { useState } from "react";
import { motion } from "framer-motion";

import Arrow from '@/assets/_img/icons/arrow.svg'

import s from './ButtonRight.module.scss'

interface IBtn<T> {
    action?: () => void,
    paramAction?: (param: T) => void,
    param: T
}

// generic по типу param, поэтому не FC: FC не умеет параметры типа
const ButtonRight = <T,>({action, paramAction, param}: IBtn<T>) => {
    const [act, setAct] = useState(false)

    return (
        <motion.button 
            onClick={() => {
                action && action(); 
                paramAction && paramAction(param)
            }} 
            whileHover="hover" 
            className={s.btn}
        >
            <motion.div initial={{transform: 'translateY(0px)'}} variants={{hover: {transform: 'translateY(90px)'}}} className={`${s.img} ${act ? s.active : ''}`}>
                <Arrow />
            </motion.div>
            <motion.span initial={{transform: 'translateY(-90px)'}} variants={{hover: {transform: 'translateY(0px)'}}} className={s.title}>{act ? 'Скрыть' : 'Еще'}</motion.span>
        </motion.button>
    )
}

export default ButtonRight