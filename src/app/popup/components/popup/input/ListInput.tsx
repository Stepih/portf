"use client"

import { IInputKeyValue } from "@/interfaces/input";
import { FC } from "react";
import Input from "./Input";
import { inputsListFeedback } from "@/data/inputsFeedBack";

import s from './ListInput.module.scss'


const ListInput:FC<{value: IInputKeyValue, handleSetValue: (value: IInputKeyValue) => void}> = ({value, handleSetValue}) => {
    
    return (
        <div className={s.inputList}>
            {inputsListFeedback.map(input => (
                <Input 
                    key={input.id} 
                    inputKey={input.inputKey} 
                    placeholder={input.placeholder} 
                    type={input.type}
                    value={value}
                    handleSetValue={handleSetValue}
                />
            ))}
        </div>
    )
}

export default ListInput