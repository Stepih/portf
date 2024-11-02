"use client"

import { FC, useState } from "react";
import { motion } from "framer-motion";

import Link from "next/link";

import Arrow from '@/assets/_img/icons/arrow-s-right.svg'
import Inst from '@/assets/_img/icons/inst.svg'
import Tg from '@/assets/_img/icons/tg-white.svg'

import s from './Header.module.scss'

import { myInst, myTg } from "@/constants/urls";
import SelectThemeButton from "./SelectThemeButton";
import BgFocus from "../bg-page/BgFocus";

const Header:FC = () => {

    const [hover, setHover] = useState(false)
    
    
    return (
        <>
        <motion.header 
            onHoverStart={() => setHover(true)} 
            onHoverEnd={()=> setHover(false)}
            animate={{left: !hover ? -100 : 0}} 
            className={s.header}>
            
            <motion.div  animate={{opacity: !hover ? 1 : 0}}  className={s.headerTouch}>
                <Arrow />
            </motion.div>
            <SelectThemeButton />
            <div className={s.contacts}>
                <span className={s.contactsTitle}>Контакты</span>
                <div className={s.contactsLink}>
                    <Link href={myInst}>
                        <Inst className={s.contactImg}/>
                    </Link>
                    <Link href={myTg}>
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