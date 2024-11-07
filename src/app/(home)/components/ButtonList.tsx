"use client"

import { FC } from "react";

import s from './ButtonList.module.scss'

import ButtonStandartSize from "./buttons/ButtonStandartSize";
import ButtonSmallSize from "./buttons/ButtonSmallSize";
import { smallHomebuttons, standartHomeButtons } from "@/data/homeButtons";


const ButtonList:FC = () => {
    
    return (
        <div className={s.wrapper}>
            {standartHomeButtons && standartHomeButtons.map((btn) => (
                <div key={btn.key} className={`${s[btn.key]}`}>
                    <ButtonStandartSize Icon={btn.Icon} title={btn.title} srcStandart={btn.srcStandart}/>
                </div>
            ))}
            {smallHomebuttons && smallHomebuttons.map((btn) => (
                <div key={btn.key} className={`${s[btn.key]}`}>
                    <ButtonSmallSize Icon={btn.Icon} title={btn.title} srcSmall={btn.srcSmall}/>
                </div>
            ))}
        </div>
    )
}

export default ButtonList