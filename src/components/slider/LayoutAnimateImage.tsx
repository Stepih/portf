import { FC } from "react";
import { motion } from "framer-motion";

import s from './LayoutAnimateImage.module.scss'

const LayoutSlider:FC<{handleNext: (e: React.MouseEvent<HTMLDivElement>) => void ,children: React.ReactNode, step: number, anim: boolean}> = ({handleNext, children, step, anim}) => {

    return (
        anim ? (
        <motion.div
            onClick={handleNext}
            onContextMenu={handleNext}
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
        ) : (
        <div 
            key={step}
            onClick={handleNext}
            onContextMenu={handleNext}
            className={s.wrapper}
        >
            {children}
        </div> 
        )
    )
}


export default LayoutSlider