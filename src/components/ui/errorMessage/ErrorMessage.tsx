import { FC } from "react";

import { AnimatePresence, motion } from "framer-motion";

import s from './ErrorMessage.module.scss'

// Тост ошибки. Обёртка role="alert" стоит всегда, даже без ошибки: скринридер объявляет
// появление и смену текста внутри уже существующей живой области (DESIGN_FIXES_3_PLAN Д14)
const ErrorMessage:FC<{error: string}> = ({error}) => {
    return (
        <div role="alert">
            <AnimatePresence>
                {error.length > 0 &&
                <motion.div
                    initial={{y: 0, x: 0, translateX: '-50%'}}
                    animate={{y: 40}}
                    exit={{y: -150}}
                    className={s.wrapper}
                >
                    <p>{error}</p>
                </motion.div>
            }
            </AnimatePresence>
        </div>
    )
}

export default ErrorMessage
