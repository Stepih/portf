"use client"

import { FC, FormEventHandler } from "react";
import { motion } from "framer-motion";

import s from './ActionButton.module.scss'

const ActionButton: FC<{action?: () => void, text: string, type: 'submit' | 'button'}> = ({action, text, type}) => {
    
    return (
        <motion.button whileTap={{scale: .9}} type={type} onClick={action && action} className={s.btn}>
            {text}
        </motion.button>
    )
}

export default ActionButton