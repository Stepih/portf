import { FC } from "react";
import { motion } from "framer-motion";

import s from './LayoutAnimateImage.module.scss'

const LayoutSlider:FC<{children: React.ReactNode, step: number}> = ({children, step}) => {

    return (
        <motion.div
            key={step}
            className={s.wrapper}
            initial={{y: step % 2 === 0 ? -40 : 40, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{
                type: "spring",  // Пружинная анимация для плавного перехода
                stiffness: 150,  // Жёсткость пружины
                damping: 25,  // Торможение
                duration: 0.8,  // Время анимации
            }}>
            {children}
        </motion.div>
    )
}


export default LayoutSlider