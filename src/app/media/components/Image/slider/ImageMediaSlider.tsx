"use client"

import { FC, useState } from "react";
import ImageComparisonSlider from "./ImageComparisonSlider";
import { IMediaImage } from "@/interfaces/mediaImages";
import s from './ImageMediaSlider.module.scss'


const ImageMediaSlider: FC<{images: IMediaImage[]}> = ({images}) => {
    
    const [step, setStep] = useState(0)

    const handlePlus = (id: number) => {
        setStep(id)
    }

    return (
        <div className={s.wrapper}>
            <ImageComparisonSlider key={images[step].id} step={step} lowQualitySrc={images[step].low} highQualitySrc={images[step].high} />
            <div className={s.slideNotes}>
                {images.map((btn, idx) => (
                    <button key={btn.id} className={`${s.btn} ${step === idx ? s.active : ''}`} onClick={() => handlePlus(idx)}></button>
                ))}
            </div>
        </div>
        
    )
}

export default ImageMediaSlider