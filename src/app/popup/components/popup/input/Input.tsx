"use client"

import { IInput, IInputKeyValue } from "@/interfaces/input";
import { FC } from "react";

import s from './Input.module.scss'

interface IInputSetValue extends IInput {
    value: IInputKeyValue;
    handleSetValue: (value: IInputKeyValue) => void;
    handleSetFocusInput: (inputName: keyof IInputKeyValue) => void;
}

const Input:FC<IInputSetValue> = ({value, handleSetValue, handleSetFocusInput, inputKey, placeholder}) => {

    return (
        <input 
            className={s.input} 
            value={value[inputKey]}
            onFocus={() => handleSetFocusInput(inputKey)} 
            onChange={(e) => {handleSetValue({...value, [inputKey]: e.target.value}); }} 
            placeholder={placeholder}
        />
    )
}

export default Input