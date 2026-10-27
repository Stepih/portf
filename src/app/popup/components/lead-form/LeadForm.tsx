"use client"

import ActionButton from "@/components/ui/buttons/button-action/ActionButton";
import { FC, FormEventHandler, useEffect, useRef, useState } from "react";
import ListInput, { FieldErrors } from "./input/ListInput";
import { IInputKeyValue } from "@/interfaces/input";

import s from './LeadForm.module.scss'
import TextAreaInput from "./input/TextAreaInput";
import ErrorMessage from "@/components/ui/errorMessage/ErrorMessage";
import { HONEYPOT_FIELD, isContactComplete, isContactInput, isNameInput } from "@/lib/validation/feedback";
import { LeadSource, leadSourceFromSearch } from "@/scripts/leadSource";
import { reachGoal } from "@/scripts/metrika";
import { GOALS } from "@/constants/analytics";
import { contactEmptyError, contactFormatError, contactIncomplete, formButton, formSuccessText, formSuccessTitle, nameEmptyError, nameFormatError } from "@/data/inputsFeedBack";
import { ralewayBold } from "@/app/fonts/fonts";
import { ILeadService, LeadServiceId } from "@/interfaces/offer";
import { SERVICE_PARAM } from "@/scripts/services";
import ServiceChoice from "./service-choice/ServiceChoice";

// Порядок полей на экране: фокус уходит на первое неверное
const inputsOrder: (keyof IInputKeyValue)[] = ['name', 'contact'];

const errorByStatus: Record<number, string> = {
    400: 'Проверьте, пожалуйста, заполненные поля',
    429: 'Слишком много заявок, попробуйте позже',
};

// Форма заявки (SALES_PLAN 4.1): на /popup и в финальном блоке главной.
// Отступы снаружи задаёт страница через className. services – типы проекта для чипов (leadServices в scripts/services):
// услуга из адреса выбрана заранее (SALES_PLAN 4.2)
interface ILeadForm {
    className?: string;
    services?: ILeadService[];
}

const LeadForm: FC<ILeadForm> = ({ className, services }) => {
    const [inputValue, setInputValue] = useState<IInputKeyValue>({name: '', contact: ''});
    const [focusInput, setFocusInput] = useState<keyof IInputKeyValue | undefined>(undefined)
    const [textAreaValue, setTextAreaValue] = useState('');
    const [service, setService] = useState<LeadServiceId | undefined>(undefined);
    // Ошибки полей – под полями (DESIGN_FIXES_6_PLAN Д31); плашка ErrorMessage – только сеть и сервер
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [error, setError] = useState('');
    const inputRefs = useRef<Partial<Record<keyof IInputKeyValue, HTMLInputElement | null>>>({});

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
        const contact = inputValue.contact.trim();
        const errors: FieldErrors = {};
        if (!name) errors.name = nameEmptyError;
        if (!contact) errors.contact = contactEmptyError;
        else if (!isContactComplete(contact)) errors.contact = contactIncomplete;

        const firstInvalid = inputsOrder.find(key => errors[key]);
        if (firstInvalid) {
            setFieldErrors(errors);
            setError('');
            inputRefs.current[firstInvalid]?.focus();
            return;
        }

        const honeypot = new FormData(e.currentTarget).get(HONEYPOT_FIELD);
        // Кейс или отрасль из ссылки «Обсудить» (SALES_PLAN 4.8) уходят с заявкой. Услуга – та, что выбрана в чипах (4.2):
        // снятый выбор убирает и услугу из ссылки
        const source: LeadSource = { ...leadSourceFromSearch(window.location.search), [SERVICE_PARAM]: service };
        if (!service) delete source[SERVICE_PARAM];

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

    // Недопустимый символ не набирается, под полем – формат. Правка поля снимает его ошибку
    const handleSetInputValue = (value:IInputKeyValue) => {
        if (focusInput === 'contact' && !isContactInput(value.contact)) return setFieldError('contact', contactFormatError)
        if (focusInput === 'name' && !isNameInput(value.name)) return setFieldError('name', nameFormatError)
        if (focusInput) setFieldError(focusInput, undefined);
        if (error) setError('');
        setInputValue(value)
    }

    const setFieldError = (key: keyof IInputKeyValue, message: string | undefined) => {
        setFieldErrors(prev => prev[key] === message ? prev : { ...prev, [key]: message });
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
            {services && <ServiceChoice services={services} value={service} onChange={setService} />}
            <ListInput handleSetFocusInput={handleSetFocusInput} value={inputValue} handleSetValue={handleSetInputValue} errors={fieldErrors} inputRefs={inputRefs} />
            <TextAreaInput setValue={handleSetTextAreaValue} value={textAreaValue} />
            {/* Обёртка задаёт жирный Raleway, как у остальных кнопок-действий: ActionButton общий (design-sync) */}
            <div className={`${ralewayBold.className} ${s.submit}`}>
                <ActionButton type='submit' disabled={isSending} text={isSending ? "Отправляется..." : formButton}/>
            </div>
        </form>
    )
}

export default LeadForm
