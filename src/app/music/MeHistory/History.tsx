"use client"
import { FC, useEffect, useState } from "react";

import s from './History.module.scss'
import CheckPoints from "./checpoints/CheckPoints";
import ScrollToArrow from "@/components/ui/scrollToArrow/ScrollToArrow";
import Steps from "./steps/Steps";
import { IMusicHistory } from "@/interfaces/musicHistory";
import { scrollToElementById } from "@/scripts/scrollTo";

const History:FC<{musicHistory: IMusicHistory[]}> = ({musicHistory}) => {
    const [step, setStep] = useState(0)

    const handleSetStep = (id:number) => {
        setStep(id)
    }
    
    return (
        <>
            <ScrollToArrow forid="title-history"/>
            <div className={s.wrapper}>
                
                <h3 id="title-history" className={s.title}>Чем я занимался</h3>
                <CheckPoints step={step} handleSetStep={handleSetStep}/>

                <Steps musicHistory={musicHistory} handleSetStep={handleSetStep} step={step}/>
            </div>
        </>
        
    )
}

export default History