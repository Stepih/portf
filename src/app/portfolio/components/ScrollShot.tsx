"use client";

import { FC } from "react";
import Image from "next/image";
import { motion, MotionValue, useReducedMotion, useTransform } from "framer-motion";

import s from './ScrollShot.module.scss'
import { easeInOutQuad } from "./easing";

const MotionImage = motion.create(Image);

interface IProps {
    src: string,
    alt: string,
    // 0 — видна верхняя часть скриншота, 1 — нижняя
    progress: MotionValue<number>,
    sizes: string,
    priority?: boolean
}

// Длинный скриншот в рамке: при скролле страницы листается сверху вниз.
// object-fit: cover + object-position сдвигают картинку без замера её высоты
const ScrollShot: FC<IProps> = ({ src, alt, progress, sizes, priority }) => {
    const reduceMotion = useReducedMotion();
    const objectPosition = useTransform(progress, (t) => `50% ${(easeInOutQuad(t) * 100).toFixed(2)}%`);

    return (
        <MotionImage
            className={s.shot}
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            style={{ objectPosition: reduceMotion ? '50% 0%' : objectPosition }}
        />
    )
}

export default ScrollShot
