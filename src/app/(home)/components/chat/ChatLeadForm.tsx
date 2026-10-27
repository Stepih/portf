import { FC, FormEventHandler, useState } from "react";

import s from './Chat.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { GOALS } from "@/constants/analytics";
import { chatLeadBack, chatLeadError, chatLeadRequired, chatLeadSending, chatLeadSubmit, chatLeadTitle } from "@/data/chat";
import { contactIncomplete, inputsListFeedback } from "@/data/inputsFeedBack";
import { FEEDBACK_LIMITS, HONEYPOT_FIELD, isContactComplete, isContactInput, isNameInput } from "@/lib/validation/feedback";
import { chatLeadMessage } from "@/scripts/chat";
import { LEAD_FROM_CHAT, LEAD_FROM_FIELD } from "@/scripts/leadSource";
import { reachGoal } from "@/scripts/metrika";

// Заявка прямо в чате (CONVERSION_PLAN К3.2): имя и телефон или Telegram (SALES_PLAN 4.2), комментарий – вопросы из диалога.
// Уходит через /api/sendMessage, как форма на /popup, с пометкой «демо-чат»
interface IChatLeadForm {
    questions: string[];
    onSent: () => void;
    onBack: () => void;
}

const placeholder = (key: 'name' | 'contact') => inputsListFeedback.find((input) => input.inputKey === key)?.placeholder;

const ChatLeadForm: FC<IChatLeadForm> = ({ questions, onSent, onBack }) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (sending) return;
        if (!name.trim() || !contact.trim()) return setError(chatLeadRequired);
        if (!isContactComplete(contact)) return setError(contactIncomplete);

        const honeypot = new FormData(e.currentTarget).get(HONEYPOT_FIELD);
        const page = window.location.pathname;
        setSending(true);
        try {
            const response = await fetch('/api/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    contact,
                    message: chatLeadMessage(questions),
                    [LEAD_FROM_FIELD]: LEAD_FROM_CHAT,
                    [HONEYPOT_FIELD]: honeypot,
                }),
            });
            if (!response.ok) throw new Error();

            // lead_submit – все заявки сайта, chat_lead – только из чата
            reachGoal(GOALS.leadSubmit, { page, [LEAD_FROM_FIELD]: LEAD_FROM_CHAT });
            reachGoal(GOALS.chatLead, { page });
            onSent();
        } catch {
            reachGoal(GOALS.leadError, { page, [LEAD_FROM_FIELD]: LEAD_FROM_CHAT });
            setError(chatLeadError);
            setSending(false);
        }
    };

    return (
        <form className={s.lead} onSubmit={onSubmit} aria-label={chatLeadTitle}>
            <p className={`${ralewayBold.className} ${s.leadTitle}`}>{chatLeadTitle}</p>
            <input
                className={s.field}
                value={name}
                onChange={(e) => {
                    if (!isNameInput(e.target.value)) return;
                    setName(e.target.value);
                    setError('');
                }}
                placeholder={placeholder('name')}
                maxLength={FEEDBACK_LIMITS.name}
                autoComplete="name"
                aria-label="Имя"
            />
            <input
                className={s.field}
                value={contact}
                onChange={(e) => {
                    if (!isContactInput(e.target.value)) return;
                    setContact(e.target.value);
                    setError('');
                }}
                placeholder={placeholder('contact')}
                maxLength={FEEDBACK_LIMITS.contact}
                autoComplete="tel"
                aria-label="Телефон или Telegram"
            />
            {/* Ловушка для ботов: человек поле не видит */}
            <input className={s.honeypot} name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true" />
            {error && <p className={s.leadError} role="alert">{error}</p>}
            <div className={s.leadButtons}>
                <button type="submit" className={`${ralewayBold.className} ${s.primary}`} disabled={sending}>
                    {sending ? chatLeadSending : chatLeadSubmit}
                </button>
                <button type="button" className={s.secondary} onClick={onBack}>{chatLeadBack}</button>
            </div>
        </form>
    )
}

export default ChatLeadForm
