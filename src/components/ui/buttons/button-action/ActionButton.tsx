"use client"

import { FC } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import s from './ActionButton.module.scss'

const MotionLink = motion.create(Link)

// С href рендерится ссылкой в виде кнопки (без вложенного <button> внутри <Link>)
type IActionButton = {text: string} & (
    | {href: string, type?: never, action?: never, disabled?: never}
    | {href?: never, type: 'submit' | 'button', action?: () => void, disabled?: boolean}
)

const ActionButton: FC<IActionButton> = ({action, text, type, disabled, href}) => {
    if (href) {
        return (
            <MotionLink whileTap={{scale: .9}} href={href} className={s.btn}>
                {text}
            </MotionLink>
        )
    }

    return (
        <motion.button whileTap={disabled ? undefined : {scale: .9}} type={type} disabled={disabled} onClick={action && action} className={s.btn}>
            {text}
        </motion.button>
    )
}

export default ActionButton
