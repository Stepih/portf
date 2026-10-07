"use client"

import { FC } from "react";
import { motion } from "framer-motion";

import s from './ActionButton.module.scss'

const ActionButton: FC<{action?: () => void, text: string, type: 'submit' | 'button', disabled?: boolean}> = ({action, text, type, disabled}) => {
    
    return (
        <motion.button whileTap={disabled ? undefined : {scale: .9}} type={type} disabled={disabled} onClick={action && action} className={s.btn}>
            {text}
        </motion.button>
    )
}

export default ActionButton