"use client"

import { FC } from "react";

import s from './Chat.module.scss'
import { useOpenChat } from "./ChatProvider";
import { ralewayBold } from "@/app/fonts/fonts";
import { chatButtonText, chatButtonTitle } from "@/data/chat";

// Кнопка демо-чата в карточке ИИ-услуги (CONVERSION_PLAN К3.2). Открывает тот же чат, что и шар в углу (ChatProvider)
interface IChatButton {
    className?: string;
}

const ChatButton: FC<IChatButton> = ({ className }) => {
    const openChat = useOpenChat();

    return (
        <button
            type="button"
            className={`${s.trigger} ${className ?? ''}`}
            onClick={openChat}
            aria-haspopup="dialog"
        >
            <span className={s.orb} aria-hidden="true" />
            <span className={s.triggerText}>
                <span className={`${ralewayBold.className} ${s.triggerTitle}`}>{chatButtonTitle}</span>
                <span className={s.triggerNote}>{chatButtonText}</span>
            </span>
        </button>
    )
}

export default ChatButton
