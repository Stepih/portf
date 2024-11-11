"use client"

import { FC } from "react";
import { motion } from "framer-motion";

import s from './FormButton.module.scss'

const FormButton: FC<{action?: () => void, text: string}> = ({action, text}) => {
    
    return (
        <motion.button  onClick={action && action} className={s.btn}>
            {text}
        </motion.button>
    )
}

export default FormButton