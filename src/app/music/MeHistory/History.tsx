"use client"
import { FC, useRef, useState } from "react";

import s from './History.module.scss'
import CheckPoints from "./checpoints/CheckPoints";
import ScrollToArrow from "@/components/ui/scrollToArrow/ScrollToArrow";
import Steps from "./steps/Steps";
import { IMusicHistory } from "@/interfaces/musicHistory";
import { scrollToElementById } from "@/scripts/scrollTo";
import { ralewayBold } from "@/app/fonts/fonts";


const History:FC<{musicHistory: IMusicHistory[]}> = ({musicHistory}) => {
    const [step, setStep] = useState(0)
    // Блок истории: стрелки ↑/↓ листают шаги, только когда фокус внутри него
    const wrapperRef = useRef<HTMLDivElement>(null)

    const handleSetStep = (id:number, block: boolean) => {
        setStep(id)
        scrollToElementById("title-history", block)
    }
    
    return (
        <>
            <ScrollToArrow forid="title-history"/>
            <div ref={wrapperRef} tabIndex={-1} className={s.wrapper}>
                <h3 id="title-history" className={`${s.title} ${ralewayBold.className}`}>Чем я занимался</h3>
                <CheckPoints steps={musicHistory} step={step} handleSetStep={handleSetStep}/>
                <Steps musicHistory={musicHistory} handleSetStep={handleSetStep} step={step} keyScopeRef={wrapperRef}/>
            </div>
        </>
        
    )
}

export default History