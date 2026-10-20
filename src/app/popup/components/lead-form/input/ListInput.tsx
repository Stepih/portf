"use client"

import { IInputKeyValue } from "@/interfaces/input";
import { FC } from "react";
import Input from "./Input";
import { inputsListFeedback } from "@/data/inputsFeedBack";
import { HONEYPOT_FIELD } from "@/lib/validation/feedback";

import s from './ListInput.module.scss'



interface IListInput {
    handleSetFocusInput: (inputName: keyof IInputKeyValue) => void;
    value: IInputKeyValue;
    handleSetValue: (value: IInputKeyValue) => void;
}


const ListInput:FC<IListInput> = ({value, handleSetValue, handleSetFocusInput}) => {
    
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
                    handleSetFocusInput={handleSetFocusInput}
                />
            ))}
            {/* Ловушка для ботов: скрыта от людей и скринридеров, читается из FormData при отправке */}
            <input
                className={s.honeypot}
                name={HONEYPOT_FIELD}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
            />
        </div>
    )
}

export default ListInput