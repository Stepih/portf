"use client"

import ActionButton from "@/components/ui/buttons/button-action/ActionButton";
import { FC, FormEventHandler, Suspense, useEffect, useRef, useState } from "react";
import ListInput from "./input/ListInput";
import { IInputKeyValue } from "@/interfaces/input";

import s from './LeadForm.module.scss'
import TextAreaInput from "./input/TextAreaInput";
import ErrorMessage from "@/components/ui/errorMessage/ErrorMessage";
import { HONEYPOT_FIELD, isNameInput, isPhoneComplete, isPhoneInput } from "@/lib/validation/feedback";
import { leadSourceFromSearch } from "@/scripts/leadSource";
import { reachGoal } from "@/scripts/metrika";
import { GOALS } from "@/constants/analytics";
import { formButton, formSuccessText, formSuccessTitle, nameFormatError, phoneTooShort } from "@/data/inputsFeedBack";
import { ralewayBold } from "@/app/fonts/fonts";
import { ServiceId } from "@/interfaces/offer";
import ServiceChoice from "./service-choice/ServiceChoice";

const errorByStatus: Record<number, string> = {
    400: 'Проверьте, пожалуйста, заполненные поля',
    429: 'Слишком много заявок, попробуйте позже',
};

// Форма заявки (SALES_PLAN 4.1): на /popup и в финальном блоке главной.
// Отступы снаружи задаёт страница через className. serviceLines – строки услуг из offer.ts (serviceLines в scripts/services):
// форма показывает ту, что в адресе (DESIGN_FIXES_3_PLAN Д13)
interface ILeadForm {
    className?: string;
    serviceLines?: Partial<Record<ServiceId, string>>;
}

const LeadForm: FC<ILeadForm> = ({ className, serviceLines }) => {
    const [inputValue, setInputValue] = useState<IInputKeyValue>({name: '', contact: ''});
    const [focusInput, setFocusInput] = useState<keyof IInputKeyValue | undefined>(undefined)
    const [textAreaValue, setTextAreaValue] = useState('');
    const [error, setError] = useState('');

    // Имя из отправленной заявки: после успеха вместо формы – плашка (DESIGN_FIXES_2_PLAN Д6)
    const [sentName, setSentName] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const successTitleRef = useRef<HTMLHeadingElement>(null);

    // Форма исчезает вместе с кнопкой, фокус переносим на заголовок плашки
    useEffect(() => {
        if (sentName !== null) successTitleRef.current?.focus();
    }, [sentName]);

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (isSending) return;

        const name = inputValue.name.trim();
        if (!inputValue.contact.trim() || !name) {
            return setError('Заполните, пожалуйста, имя и телефон');
        }
        if (!isPhoneComplete(inputValue.contact)) return setError(phoneTooShort);

        const honeypot = new FormData(e.currentTarget).get(HONEYPOT_FIELD);
        // Услуга, кейс или отрасль из ссылки «Обсудить» (SALES_PLAN 4.8) уходят с заявкой; видна в форме только услуга (Д13)
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
            setError('');
            setSentName(name);
        } catch (err) {
            // fetch падает с TypeError, если нет сети
            reachGoal(GOALS.leadError, { page: window.location.pathname });
            setError(err instanceof Error && !(err instanceof TypeError) ? err.message : 'Не удалось отправить заявку, проверьте соединение');
        } finally {
            setIsSending(false);
        }
    };

    const handleSetInputValue = (value:IInputKeyValue) => {
        if (focusInput === 'contact' && !isPhoneInput(value.contact)) return setError('Формат: цифры, +, скобки и дефис, не больше 25 символов')
        if (focusInput === 'name' && !isNameInput(value.name)) return setError(nameFormatError)
        if (error) setError('');
        setInputValue(value)
    }

    const handleSetTextAreaValue = (message: string) => {
        setTextAreaValue(message)
    }

    const handleSetFocusInput = (inputName: keyof IInputKeyValue) => {
        setFocusInput(inputName)
    }

    const classes = `${s.form}${className ? ` ${className}` : ''}`;

    if (sentName !== null) {
        return (
            // В заголовке имя клиента – Вебвизор его тоже не записывает
            <div className={`${classes} ${s.success} ym-hide-content`} role="status">
                <h3 ref={successTitleRef} tabIndex={-1} className={`${ralewayBold.className} ${s.successTitle}`}>
                    {formSuccessTitle(sentName)}
                </h3>
                <p className={s.successText}>{formSuccessText}</p>
            </div>
        )
    }

    return (
        // ym-hide-content: Вебвизор не записывает, что ввели в поля заявки (SALES_PLAN 6.2)
        <form className={`${classes} ym-hide-content`} onSubmit={onSubmit}>
            <ErrorMessage error={error} />
            {serviceLines && (
                <Suspense fallback={null}>
                    <ServiceChoice lines={serviceLines} />
                </Suspense>
            )}
            <ListInput handleSetFocusInput={handleSetFocusInput} value={inputValue} handleSetValue={handleSetInputValue} />
            <TextAreaInput setValue={handleSetTextAreaValue} value={textAreaValue} />
            {/* Обёртка задаёт жирный Raleway, как у остальных кнопок-действий: ActionButton общий (design-sync) */}
            <div className={`${ralewayBold.className} ${s.submit}`}>
                <ActionButton type='submit' disabled={isSending} text={isSending ? "Отправляется..." : formButton}/>
            </div>
        </form>
    )
}

export default LeadForm
