"use client"

import { IInput, IInputKeyValue } from "@/interfaces/input";
import { FC, Ref } from "react";
import { FEEDBACK_LIMITS } from "@/lib/validation/feedback";

import s from './Input.module.scss'

interface IInputSetValue extends IInput {
    value: IInputKeyValue;
    handleSetValue: (value: IInputKeyValue) => void;
    handleSetFocusInput: (inputName: keyof IInputKeyValue) => void;
    // Ошибка поля – текстом под ним (DESIGN_FIXES_6_PLAN Д31)
    error?: string;
    errorId: string;
    inputRef?: Ref<HTMLInputElement>;
}

const Input:FC<IInputSetValue> = ({value, handleSetValue, handleSetFocusInput, inputKey, placeholder, type, error, errorId, inputRef}) => {

    return (
        <div className={s.field}>
            <input
                ref={inputRef}
                className={`${s.input}${error ? ` ${s.invalid}` : ''}`}
                type={type}
                inputMode={type === 'tel' ? 'tel' : 'text'}
                autoComplete={type === 'tel' ? 'tel' : 'name'}
                maxLength={FEEDBACK_LIMITS[inputKey]}
                value={value[inputKey]}
                onFocus={() => handleSetFocusInput(inputKey)}
                onChange={(e) => {handleSetValue({...value, [inputKey]: e.target.value}); }}
                placeholder={placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
            />
            {/* Живая область стоит всегда: скринридер объявляет появление ошибки, пока фокус в поле (как в ErrorMessage, Д14) */}
            <div role="alert">
                {error && <p id={errorId} className={s.error}>{error}</p>}
            </div>
        </div>
    )
}

export default Input
