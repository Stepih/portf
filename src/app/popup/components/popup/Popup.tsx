"use client"

import ActionButton from "@/components/ui/buttons/button-action/ActionButton";
import { FC, FormEventHandler, useState } from "react";
import ListInput from "./input/ListInput";
import { IInputKeyValue } from "@/interfaces/input";

import s from './Popup.module.scss'
import TextAreaInput from "./input/TextAreaInput";
import ErrorMesage from "@/components/ui/errorMessage/ErrorMessage";

const checkNameReg = (text: string) => /^[A-Za-zА-Яа-яё]{0,25}$/.test(text.replace(/\s+/g, ''));

const checkPhoneReg = (text: string) => {
    const re = /^[0-9]{0,25}$/;
    const test = re.test(text);
    console.log(test);
    return test;
}

const Popup:FC = () => {
    const [inputValue, setInputValue] = useState<IInputKeyValue>({name: '', contact: ''});
    const [focusInput, setFocusInput] = useState<keyof IInputKeyValue | undefined>(undefined)
    const [textAreaValue, setTextAreaValue] = useState('');
    const [error, setError] = useState('');

    const [success, setSuccess] = useState('');

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
    
        if (!inputValue.contact.length || !inputValue.name.length) {
          return setError('Заполни, пожалуйста, важные поля');
        }
    
        try {
          const response = await fetch('http://localhost:3000/api/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inputValue, message: textAreaValue }),
          });
    
          if (!response.ok) {
            throw new Error('Не удалось отправить данные');
          }
    
          const data = await response.json();
          
          if (data?.error) {
            throw new Error(data.error);
          }
    
          // Успех
          setSuccess('Сообщение успешно отправлено');
          setError(''); // Сброс ошибки
          setInputValue({ name: '', contact: '' }); // Очистка полей
          setTextAreaValue(''); // Очистка textarea
        } catch (err: any) {
          setError(err.message || 'Что-то пошло не так');
          setSuccess('');
        }
      };

    const handleSetInputValue = (value:IInputKeyValue) => {
        if (focusInput === 'contact' && !checkPhoneReg(value.contact)) return setError('Формат: только цифры, не больше 25 символов')
        if (focusInput === 'name' && !checkNameReg(value.name)) return setError('Формат: только буквы, не больше 25 символов')
        error.length > 0 && setError('');
        success.length > 0 && setSuccess('');
        setInputValue(value)
    }

    const handleSetTextAreaValue = (message: string) => {
        setTextAreaValue(message)
    }

    const handleSetFocusInput = (inputName: keyof IInputKeyValue) => {
        setFocusInput(inputName)
    }

    return (
        <form className={s.popup} onSubmit={onSubmit}>
            {!success && <ErrorMesage error={error} />}
            <ListInput handleSetFocusInput={handleSetFocusInput} value={inputValue} handleSetValue={handleSetInputValue} />
            <TextAreaInput setValue={handleSetTextAreaValue} value={textAreaValue} />
            <ActionButton type='submit' text={!success ? "Отправить" : "Отправлено!"}/>
        </form>
    )
}

export default Popup