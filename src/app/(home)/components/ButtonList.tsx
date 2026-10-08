"use client"

import { FC } from "react";

import s from './ButtonList.module.scss'

import ButtonStandardSize from "./buttons/ButtonStandardSize";
import ButtonSmallSize from "./buttons/ButtonSmallSize";
import { smallHomebuttons, standardHomeButtons } from "@/data/homeButtons";
import { ralewayRegular } from "@/app/fonts/fonts";


const ButtonList:FC = () => {
    
    return (
        <div className={`${s.wrapper} ${ralewayRegular.className}`}>
            {standardHomeButtons && standardHomeButtons.map((btn) => (
                <div key={btn.key} className={`${s[btn.key]}`}>
                    <ButtonStandardSize Icon={btn.Icon} title={btn.title} srcStandard={btn.srcStandard}/>
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