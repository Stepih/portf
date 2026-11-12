"use client"

import { FC, useId } from "react";
import { FEEDBACK_LIMITS } from "@/lib/validation/feedback";
import { formMessageLabel } from "@/data/inputsFeedBack";

import s from './Input.module.scss'
import FieldLabel from "./FieldLabel";


const TextAreaInput:FC<{value: string, setValue: (message:string) => void}> = ({value, setValue}) => {
    const id = useId();

    return (
        <div className={s.field}>
            <FieldLabel htmlFor={id} text={formMessageLabel} />
            <textarea
                id={id}
                className={s.textArea}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={FEEDBACK_LIMITS.message}
            >
            </textarea>
        </div>
    )
}

export default TextAreaInput
