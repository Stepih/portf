"use client"

import { FC, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";

import s from './Chat.module.scss'
import ChatWindow from "./ChatWindow";
import { useChat } from "./useChat";
import { ralewayBold } from "@/app/fonts/fonts";
import { GOALS } from "@/constants/analytics";
import { chatButtonText, chatButtonTitle } from "@/data/chat";
import { IOfferButton } from "@/interfaces/offer";
import { reachGoal } from "@/scripts/metrika";

// Кнопка демо-чата в карточке ИИ-услуги (CONVERSION_PLAN К3.2). Окно – через портал в body:
// template.tsx двигает страницу transform-ом, и position: fixed внутри него считался бы от страницы.
// Кнопка Telegram приходит пропсом: offer.ts тянет за собой портфолио, в клиентский бандл его не берём
interface IChatButton {
    tgButton: IOfferButton;
    className?: string;
}

const ChatButton: FC<IChatButton> = ({ tgButton, className }) => {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const chat = useChat();
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => setMounted(true), []);

    const onOpen = () => {
        setOpen(true);
        reachGoal(GOALS.chatOpen, { page: window.location.pathname });
    };

    const onClose = useCallback(() => {
        setOpen(false);
        buttonRef.current?.focus();
    }, []);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className={`${s.trigger} ${className ?? ''}`}
                onClick={onOpen}
                aria-haspopup="dialog"
            >
                <span className={s.orb} aria-hidden="true" />
                <span className={s.triggerText}>
                    <span className={`${ralewayBold.className} ${s.triggerTitle}`}>{chatButtonTitle}</span>
                    <span className={s.triggerNote}>{chatButtonText}</span>
                </span>
            </button>

            {mounted && createPortal(
                <AnimatePresence>
                    {open && <ChatWindow chat={chat} tgButton={tgButton} onClose={onClose} />}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}

export default ChatButton
