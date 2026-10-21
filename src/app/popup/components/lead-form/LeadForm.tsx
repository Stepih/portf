"use client"

import ActionButton from "@/components/ui/buttons/button-action/ActionButton";
import { FC, FormEventHandler, useState } from "react";
import ListInput from "./input/ListInput";
import { IInputKeyValue } from "@/interfaces/input";

import s from './LeadForm.module.scss'
import TextAreaInput from "./input/TextAreaInput";
import ErrorMessage from "@/components/ui/errorMessage/ErrorMessage";
import { HONEYPOT_FIELD } from "@/lib/validation/feedback";
import { leadSourceFromSearch } from "@/scripts/leadSource";
import { reachGoal } from "@/scripts/metrika";
import { GOALS } from "@/constants/analytics";

const checkNameReg = (text: string) => /^[A-Za-zА-Яа-яё]{0,25}$/.test(text.replace(/\s+/g, ''));

const checkPhoneReg = (text: string) => /^[0-9]{0,25}$/.test(text);

const errorByStatus: Record<number, string> = {
    400: 'Проверьте, пожалуйста, заполненные поля',
    429: 'Слишком много заявок, попробуйте позже',
};

// Форма заявки (SALES_PLAN 4.1): на /popup и в финальном блоке главной.
// Отступы снаружи задаёт страница через className
interface ILeadForm {
    className?: string;
}

const LeadForm: FC<ILeadForm> = ({ className }) => {
    const [inputValue, setInputValue] = useState<IInputKeyValue>({name: '', contact: ''});
    const [focusInput, setFocusInput] = useState<keyof IInputKeyValue | undefined>(undefined)
    const [textAreaValue, setTextAreaValue] = useState('');
    const [error, setError] = useState('');

    const [success, setSuccess] = useState('');
    const [isSending, setIsSending] = useState(false);

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (isSending) return;

        if (!inputValue.contact.trim() || !inputValue.name.trim()) {
            return setError('Заполните, пожалуйста, имя и телефон');
        }

        const honeypot = new FormData(e.currentTarget).get(HONEYPOT_FIELD);
        // Услуга, кейс или отрасль из ссылки «Обсудить» (SALES_PLAN 4.8): в форме не видны, уходят с заявкой
        const source = leadSourceFromSearch(window.location.search);

        setIsSending(true);
        try {
            const response = await fetch('/api/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...inputValue, message: textAreaValue, ...source, [HONEYPOT_FIELD]: honeypot }),
            });

            if (!response.ok) {
                throw new Error(errorByStatus[response.status] ?? 'Не удалось отправить заявку, попробуйте позже');
            }

            // Успех; в цели – страница и откуда пришёл клиент (6.1)
            reachGoal(GOALS.leadSubmit, { page: window.location.pathname, ...source });
            setSuccess('Сообщение успешно отправлено');
            setError(''); // Сброс ошибки
            setInputValue({ name: '', contact: '' }); // Очистка полей
            setTextAreaValue(''); // Очистка textarea
        } catch (err) {
            // fetch падает с TypeError, если нет сети
            reachGoal(GOALS.leadError, { page: window.location.pathname });
            setError(err instanceof Error && !(err instanceof TypeError) ? err.message : 'Не удалось отправить заявку, проверьте соединение');
            setSuccess('');
        } finally {
            setIsSending(false);
        }
    };

    const handleSetInputValue = (value:IInputKeyValue) => {
        if (focusInput === 'contact' && !checkPhoneReg(value.contact)) return setError('Формат: только цифры, не больше 25 символов')
        if (focusInput === 'name' && !checkNameReg(value.name)) return setError('Формат: только буквы, не больше 25 символов')
        if (error) setError('');
        if (success) setSuccess('');
        setInputValue(value)
    }

    const handleSetTextAreaValue = (message: string) => {
        setTextAreaValue(message)
    }

    const handleSetFocusInput = (inputName: keyof IInputKeyValue) => {
        setFocusInput(inputName)
    }

    return (
        // ym-hide-content: Вебвизор не записывает, что ввели в поля заявки (SALES_PLAN 6.2)
        <form className={`${s.form} ym-hide-content${className ? ` ${className}` : ''}`} onSubmit={onSubmit}>
            {!success && <ErrorMessage error={error} />}
            <ListInput handleSetFocusInput={handleSetFocusInput} value={inputValue} handleSetValue={handleSetInputValue} />
            <TextAreaInput setValue={handleSetTextAreaValue} value={textAreaValue} />
            <ActionButton type='submit' disabled={isSending} text={isSending ? "Отправляется..." : !success ? "Отправить" : "Отправлено!"}/>
        </form>
    )
}

export default LeadForm