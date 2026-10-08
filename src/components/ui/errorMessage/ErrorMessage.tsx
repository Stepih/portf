import { FC } from "react";

import { AnimatePresence, motion } from "framer-motion";

import s from './ErrorMessage.module.scss'

const ErrorMesage:FC<{error: string}> = ({error}) => {
    return (
        
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
        
    )
}

export default ErrorMesage
