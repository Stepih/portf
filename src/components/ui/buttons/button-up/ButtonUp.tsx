import { FC } from "react";
import { motion } from "framer-motion";

import Arrow from '@/assets/_img/icons/arrow.svg'

import { scrollToElementById } from "@/scripts/scrollTo";

import s from './ButtonUp.module.scss'

const ButtonUp: FC = () => {

    return (
        <motion.button onClick={()=> scrollToElementById("main", true)} whileHover="hover" className={s.btn}>
            <Arrow />
        </motion.button>
    )
}

export default ButtonUp