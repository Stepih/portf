"use client"

import { IInput, IInputKeyValue } from "@/interfaces/input";
import { FC, Ref } from "react";
import { FEEDBACK_LIMITS } from "@/lib/validation/feedback";

import s from './Input.module.scss'
import FieldLabel from "./FieldLabel";

interface IInputSetValue extends IInput {
    value: IInputKeyValue;
    handleSetValue: (value: IInputKeyValue) => void;
    handleSetFocusInput: (inputName: keyof IInputKeyValue) => void;
    // Ошибка поля – текстом под ним (DESIGN_FIXES_6_PLAN Д31)
    error?: string;
    // Префикс id: подпись связана с полем, ошибка – с описанием поля
    fieldId: string;
    inputRef?: Ref<HTMLInputElement>;
}

const Input:FC<IInputSetValue> = ({value, handleSetValue, handleSetFocusInput, inputKey, label, required, type, error, fieldId, inputRef}) => {
    const errorId = `${fieldId}-error`;

    return (
        <div className={s.field}>
            <FieldLabel htmlFor={fieldId} text={label} required={required} />
            <input
                ref={inputRef}
                id={fieldId}
                className={`${s.input}${error ? ` ${s.invalid}` : ''}`}
                type={type}
                inputMode={type === 'tel' ? 'tel' : 'text'}
                // В контакт можно и ник Telegram (SALES_PLAN 4.2), но браузер подставит номер – это тоже подходит
                autoComplete={inputKey === 'contact' ? 'tel' : 'name'}
                maxLength={FEEDBACK_LIMITS[inputKey]}
                value={value[inputKey]}
                onFocus={() => handleSetFocusInput(inputKey)}
                onChange={(e) => {handleSetValue({...value, [inputKey]: e.target.value}); }}
                // Не атрибут required: проверку ведёт форма, ошибки – под полями, а не всплывашкой браузера
                aria-required={required || undefined}
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
