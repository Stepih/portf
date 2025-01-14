"use client"

import { FC } from "react";

import Arrow from '@/assets/_img/icons/arrow.svg'

import s from './ScrollToArrow.module.scss'
import { scrollToElementById } from "@/scripts/scrollTo";

const ScrollToArrow:FC<{forid: string}> = ({forid}) => {
    return (
        <button className={s.arrow}>
            <Arrow  onClick={() => scrollToElementById(forid, true)}/>
        </button>
    )
}
export default ScrollToArrow
