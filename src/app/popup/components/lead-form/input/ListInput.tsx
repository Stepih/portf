"use client"

import { IInputKeyValue } from "@/interfaces/input";
import { FC, RefObject, useId } from "react";
import Input from "./Input";
import { inputsListFeedback } from "@/data/inputsFeedBack";
import { HONEYPOT_FIELD } from "@/lib/validation/feedback";

import s from './ListInput.module.scss'

export type FieldErrors = Partial<Record<keyof IInputKeyValue, string>>;

interface IListInput {
    handleSetFocusInput: (inputName: keyof IInputKeyValue) => void;
    value: IInputKeyValue;
    handleSetValue: (value: IInputKeyValue) => void;
    errors: FieldErrors;
    // Поля по ключу: форма ставит фокус на первое неверное (DESIGN_FIXES_6_PLAN Д31)
    inputRefs: RefObject<Partial<Record<keyof IInputKeyValue, HTMLInputElement | null>>>;
}


const ListInput:FC<IListInput> = ({value, handleSetValue, handleSetFocusInput, errors, inputRefs}) => {
    const id = useId();

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
                    error={errors[input.inputKey]}
                    errorId={`${id}-${input.inputKey}-error`}
                    inputRef={(el) => { inputRefs.current[input.inputKey] = el; }}
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
