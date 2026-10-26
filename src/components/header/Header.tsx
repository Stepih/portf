"use client"

import { FC, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import Link from "next/link";

import Arrow from '@/assets/_img/icons/arrow-s-right.svg'
import Tg from '@/assets/_img/icons/tg-white.svg'

import s from './Header.module.scss'

import { myTg } from "@/constants/urls";
import SelectThemeButton from "./SelectThemeButton";
import BgFocus from "../bg-page/BgFocus";

const Header:FC = () => {

    const [hover, setHover] = useState(false)
    const headerRef = useRef<HTMLElement>(null)

    // Касание вне открытой шапки закрывает её: на тач-экране наведения нет
    useEffect(() => {
        if (!hover) return
        const close = (e: PointerEvent) => {
            if (!headerRef.current?.contains(e.target as Node)) setHover(false)
        }
        document.addEventListener("pointerdown", close)
        return () => document.removeEventListener("pointerdown", close)
    }, [hover])

    return (
        <>
        <motion.header
            ref={headerRef}
            onHoverStart={() => setHover(true)} 
            onHoverEnd={()=> setHover(false)}
            // С клавиатуры шапка выезжает, пока фокус внутри неё
            onFocus={() => setHover(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(false) }}
            animate={{left: !hover ? -100 : 0, willChange: 'unset'}} 
            className={s.header}
            data-goal-place="header">
            
            {/* Кнопка, а не div: на тач-экране шире 1200px шапка открывается касанием */}
            <motion.button
                type="button"
                aria-label="Открыть панель"
                aria-expanded={hover}
                onClick={() => setHover(true)}
                animate={{opacity: !hover ? 1 : 0}}
                className={s.headerTouch}>
                <Arrow />
            </motion.button>
            <SelectThemeButton />
            <div className={s.contacts}>
                <span className={s.contactsTitle}>Контакты</span>
                <div className={s.contactsLink}>
                    <Link href={myTg} aria-label="Telegram">
                        <Tg className={s.contactImg}/>
                    </Link>
                </div>
            </div>
        </motion.header>
        <BgFocus status={hover}/>
        <motion.div 
            animate={{opacity: hover ? .8 : 0, }} 
            className={s.bg}
        >
        </motion.div>
        </>
        
    )
}

export default Header