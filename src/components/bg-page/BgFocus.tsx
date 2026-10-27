import { FC } from "react";
import { motion } from "framer-motion";

import s from './BgFocus.module.scss'
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export const BgFocus: FC<{status: boolean}> = ({status}) => {
    // При «Уменьшить движение» пелена появляется и исчезает сразу
    const reduceMotion = usePrefersReducedMotion()
    return <motion.div
    initial={{opacity: 0}}
    animate={{opacity: status ? .7 : 0}}
    exit={{opacity: 0}}
    transition={reduceMotion ? { duration: 0 } : undefined}
    className={s.bg}></motion.div>
}

export default BgFocus