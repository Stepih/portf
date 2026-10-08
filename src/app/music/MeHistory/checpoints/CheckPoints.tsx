import { FC } from "react";
import { motion } from "framer-motion";

import s from './CheckPoints.module.scss'
import { IMusicHistory } from "@/interfaces/musicHistory";
import { historyIcons } from "./icons";

interface ICheckPoints {
    steps: Pick<IMusicHistory, 'id' | 'title' | 'icon'>[],
    step: number,
    onSelect: (idx: number) => void
}

const CheckPoints:FC<ICheckPoints> = ({steps, step, onSelect}) => {

    return (
        <div className={s.wrapper}>
            {steps.map((block, idx) => {
                const Icon = historyIcons[block.icon]
                return (
                <div key={block.id} style={{display: 'contents'}}>
                    <motion.button
                        type="button"
                        aria-current={idx === step ? 'step' : undefined}
                        // Пройденные и текущий шаг яркие, следующие приглушены
                        animate={{opacity: idx <= step ? 1 : .5}}
                        onClick={() => onSelect(idx)}
                        className={`${s.checkBlock} ${idx !== step ? s.noActiveMobile : ''}`}
                    >

                        <Icon id={`check-${idx}`} className={s.img} />
                        <motion.span className={`${s.title} ${idx === step ? s.active : ''}`}>{block.title}</motion.span>
                    </motion.button>
                    {idx < steps.length - 1 && (
                        <div className={`${s.line} ${s.noActiveMobile}`}>
                            {/* Линия до текущего шага заполнена */}
                            <motion.div
                                animate={{width: idx < step ? '100%' : 0}}
                                className={`${s.subline} `}
                            >
                        </motion.div>
                    </div>)}
                </div>
                )
            })}
        </div>
    )
}

export default CheckPoints
