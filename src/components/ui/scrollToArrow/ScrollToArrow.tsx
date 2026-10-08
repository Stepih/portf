"use client"

import { FC } from "react";

import Arrow from '@/assets/_img/icons/arrow.svg'

import s from './ScrollToArrow.module.scss'
import { scrollToElementById } from "@/scripts/scrollTo";

const ScrollToArrow:FC<{forid: string}> = ({forid}) => {
    return (
        <button
            type="button"
            className={s.arrow}
            onClick={() => scrollToElementById(forid, true)}
            aria-label="Прокрутить вниз"
        >
            <Arrow />
        </button>
    )
}
export default ScrollToArrow
