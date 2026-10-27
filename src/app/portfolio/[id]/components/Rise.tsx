"use client";

import { FC, ReactNode } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const TAGS = {
    div: motion.div,
    section: motion.section,
    article: motion.article,
    figure: motion.figure
}

interface IProps {
    children: ReactNode,
    className?: string,
    as?: keyof typeof TAGS,
    id?: string,
    'aria-labelledby'?: string
}

// Блок всплывает снизу, когда его верх доходит до 92% высоты экрана.
// Ветка одна: «Уменьшить движение» узнаём только после монтирования, а initial к этому моменту уже скрыл блок,
// поэтому при reduceMotion блок сразу показывается без анимации, а не теряет анимационные пропсы
const Rise: FC<IProps> = ({ children, as = 'div', ...rest }) => {
    const reduceMotion = usePrefersReducedMotion();
    const Tag = TAGS[as];

    return (
        <Tag
            {...rest}
            initial={{ opacity: 0, y: 36 }}
            animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        >
            {children}
        </Tag>
    )
}

export default Rise
