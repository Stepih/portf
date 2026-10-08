import Prompt from "@/components/ui/prompt/Prompt";
import { motion } from "framer-motion";
import { FC, useState } from "react";

import Krest from '@/assets/_img/icons/krest.svg';

import s from './ClosePlayer.module.scss'

const ClosePlayer:FC<{onClose: () => void}> = ({onClose}) => {
    const [hov, setHov] = useState(false)

    return (
        <motion.div onHoverStart={()=>setHov(true)} onHoverEnd={()=>setHov(false)}>
            <Prompt screen="auto" show={hov} type="active" title="Закрыть плеер">
                <button type="button" className={s.btn} onClick={onClose} aria-label="Закрыть плеер">
                    <Krest />
                </button>
            </Prompt>
        </motion.div>
        
    )
}

export default ClosePlayer