import { FC } from "react";
import { motion } from "framer-motion";

import s from './CheckPoints.module.scss'
import { checpointsData } from "@/data/checkpoints";

const CheckPoints:FC<{step: number, handleSetStep: (id:number, block: boolean) => void}> = ({step, handleSetStep}) => {

    return (
        <div className={s.wrapper}>
            {checpointsData.map((block, idx) => (
                <div key={idx} style={{display: 'contents'}}>
                    <motion.div 
                        animate={{opacity: step === 0 ? (idx === step ? 1 : .5) : step === 1 ? (idx !== step + 1 ? 1 : .5) : 1}} 
                        onClick={handleSetStep.bind(null, idx, false)} 
                        className={`${s.checkBlock} ${idx !== step ? s.noActiveMobile : ''}`}
                    >
                        
                        <block.Img id={`check-${idx}`} className={s.img} />
                        <motion.p className={`${s.title} ${idx === step ? s.active : ''}`}>{block.title}</motion.p>
                    </motion.div>
                    {idx < 2 && (
                        <div className={`${s.line} ${s.noActiveMobile}`}>
                            <motion.div 
                                animate={{width: step === 1 ? (idx + 1 === step ? '100%' : 0) : step === 0 ? 0 : "100%"}} 
                                className={`${s.subline} `}
                            >
                        </motion.div>
                    </div>)}
                </div>
            ))}
        </div>
    )
}

export default CheckPoints