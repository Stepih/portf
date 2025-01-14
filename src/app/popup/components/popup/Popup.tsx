"use client"

import ActionButton from "@/components/ui/buttons/button-action/ActionButton";
import { FC, FormEventHandler, useState } from "react";
import ListInput from "./input/ListInput";
import { IInputKeyValue } from "@/interfaces/input";

import s from './Popup.module.scss'

const Popup:FC = () => {
    const [value, setValue] = useState<IInputKeyValue>({name: '', contact: ''})

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        console.log(value)
    }

    const handleSetValue = (value:IInputKeyValue) => {
        setValue(value)
    }

    return (
        <form className={s.popup} onSubmit={onSubmit}>
            <ListInput value={value} handleSetValue={handleSetValue} />
            <ActionButton type='submit' text="Отправить"/>
        </form>
    )
}

export default Popup