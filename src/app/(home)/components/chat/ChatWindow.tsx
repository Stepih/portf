import { FC, FormEventHandler, KeyboardEventHandler, useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";

import s from './Chat.module.scss'
import ChatLeadForm from "./ChatLeadForm";
import type { useChat } from "./useChat";
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { chatClose, chatGreeting, chatLeadOpen, chatLeadSuccess, chatLimitText, chatPlaceholder, chatSend, chatSubtitle, chatTitle } from "@/data/chat";
import { formButton } from "@/data/inputsFeedBack";
import { CHAT_LIMITS } from "@/lib/chat/request";
import { HONEYPOT_FIELD } from "@/lib/validation/feedback";
import { IOfferButton } from "@/interfaces/offer";
import { chatQuestions } from "@/scripts/chat";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

// Окно демо-чата (CONVERSION_PLAN К3.2): на компьютере – панель в правом нижнем углу, на телефоне – на весь экран.
// Под последним ответом – кнопки «Обсудить проект» (форма прямо в чате) и Telegram.
// Форму открывает и кнопка в шапке – она видна с первого открытия, ещё до вопросов (DESIGN_FIXES_2_PLAN, Д7)
interface IChatWindow {
    chat: ReturnType<typeof useChat>;
    tgButton: IOfferButton;
    onClose: () => void;
}

const ChatWindow: FC<IChatWindow> = ({ chat, tgButton, onClose }) => {
    const { items, loading, limit, ask, addNote } = chat;
    const [question, setQuestion] = useState('');
    const [leadOpen, setLeadOpen] = useState(false);
    const [leadSent, setLeadSent] = useState(false);
    const titleId = useId();
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const honeypotRef = useRef<HTMLInputElement>(null);

    useBodyScrollLock(true);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // На компьютере сразу в поле вопроса; на телефоне – нет, иначе клавиатура закроет приветствие
    useEffect(() => {
        if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
    }, []);

    // Новая реплика или кусок ответа – прокрутка вниз
    useEffect(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [items, loading, limit, leadOpen]);

    const send = () => {
        if (!question.trim() || loading) return;
        ask(question, honeypotRef.current?.value);
        setQuestion('');
    };

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        send();
    };

    // Enter – отправить, Shift+Enter – новая строка
    const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    };

    const questions = chatQuestions(items);
    const waiting = loading && items[items.length - 1]?.role === 'user';
    const showActions = !loading && !leadOpen && (questions.length > 0 || limit !== null);

    return (
        <motion.div
            className={s.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            {/* ym-hide-content: Вебвизор не записывает вопросы и контакты (SALES_PLAN 6.2) */}
            <motion.div
                className={`${ralewayRegular.className} ${s.window} ym-hide-content`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                data-goal-place="chat"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={s.head}>
                    <span className={s.orb} aria-hidden="true" />
                    <div className={s.headText}>
                        <h2 id={titleId} className={`${ralewayBold.className} ${s.title}`}>{chatTitle}</h2>
                        <p className={s.subtitle}>{chatSubtitle}</p>
                    </div>
                    {/* Пока форма открыта, кнопка держит место: шапка не прыгает по высоте */}
                    {!leadSent && (
                        <button
                            type="button"
                            className={`${ralewayBold.className} ${s.headLead} ${leadOpen ? s.headLeadIdle : ''}`}
                            onClick={() => setLeadOpen(true)}
                        >
                            {chatLeadOpen}
                        </button>
                    )}
                    <button type="button" className={s.close} onClick={onClose} aria-label={chatClose}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {/* aria-busy: пока ответ дописывается, скринридер не читает его по кускам */}
                <div className={s.messages} ref={listRef} aria-live="polite" aria-busy={loading}>
                    <p className={`${s.bubble} ${s.assistant}`}>{chatGreeting}</p>
                    {items.map((item) => (
                        <p
                            key={item.id}
                            className={`${s.bubble} ${item.role === 'user' ? s.user : s.assistant} ${item.note ? s.note : ''} ${item.failed ? s.failed : ''}`}
                        >
                            {item.content}
                        </p>
                    ))}
                    {waiting && (
                        <p className={`${s.bubble} ${s.assistant} ${s.typing}`} aria-label="Ассистент печатает">
                            <span /><span /><span />
                        </p>
                    )}
                    {limit && <p className={`${s.bubble} ${s.assistant} ${s.note}`}>{chatLimitText[limit]}</p>}

                    {showActions && (
                        <div className={s.actions}>
                            {!leadSent && (
                                <button type="button" className={`${ralewayBold.className} ${s.primary}`} onClick={() => setLeadOpen(true)}>
                                    {formButton}
                                </button>
                            )}
                            <a className={s.secondary} href={tgButton.href} target="_blank" rel="noopener noreferrer">
                                {tgButton.title}
                            </a>
                        </div>
                    )}
                </div>

                {leadOpen ? (
                    <ChatLeadForm
                        questions={questions}
                        onBack={() => setLeadOpen(false)}
                        onSent={() => {
                            setLeadOpen(false);
                            setLeadSent(true);
                            addNote(chatLeadSuccess);
                        }}
                    />
                ) : !limit && (
                    <form className={s.input} onSubmit={onSubmit}>
                        <textarea
                            ref={inputRef}
                            className={s.textarea}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder={chatPlaceholder}
                            maxLength={CHAT_LIMITS.question}
                            rows={1}
                            aria-label={chatPlaceholder}
                        />
                        {/* Ловушка для ботов: человек поле не видит */}
                        <input ref={honeypotRef} className={s.honeypot} name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true" />
                        <button type="submit" className={s.send} disabled={loading || !question.trim()} aria-label={chatSend}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                        </button>
                    </form>
                )}
            </motion.div>
        </motion.div>
    )
}

export default ChatWindow
