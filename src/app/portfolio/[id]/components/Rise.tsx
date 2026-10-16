"use client";

import { FC, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

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

// Блок всплывает снизу, когда его верх доходит до 92% высоты экрана
const Rise: FC<IProps> = ({ children, as = 'div', ...rest }) => {
    const reduceMotion = useReducedMotion();
    const Tag = TAGS[as];

    if (reduceMotion) return <Tag {...rest}>{children}</Tag>;

    return (
        <Tag
            {...rest}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        >
            {children}
        </Tag>
    )
}

export default Rise
