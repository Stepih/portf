"use client"

import { IInput, IInputKeyValue } from "@/interfaces/input";
import { FC } from "react";

import s from './Input.module.scss'

interface IInputSetValue extends IInput {
    value: IInputKeyValue,
    handleSetValue: (value: IInputKeyValue) => void
}

const Input:FC<IInputSetValue> = ({value, handleSetValue, inputKey, placeholder}) => {

    return (
        <input 
            className={s.input} 
            value={value[inputKey]} 
            onChange={(e) => handleSetValue({...value, [inputKey]: e.target.value})} 
            placeholder={placeholder}
        />
    )
}

export default Input