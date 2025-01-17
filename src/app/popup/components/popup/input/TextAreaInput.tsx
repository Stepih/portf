"use client"

import { FC } from "react";

import s from './Input.module.scss'


const TextAreaInput:FC<{value: string, setValue: (message:string) => void}> = ({value, setValue}) => {

    return (
        <textarea
            className={s.textArea}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Комментарий"
            
        >
        </textarea>
    )
}

export default TextAreaInput