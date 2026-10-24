"use client"

import { FC } from "react";

import s from './Chat.module.scss'
import { useOpenChat } from "./ChatProvider";
import OrbStar from "./OrbStar";
import { ralewayBold } from "@/app/fonts/fonts";
import { chatButtonText, chatButtonTitle } from "@/data/chat";

// Кнопка демо-чата в карточке ИИ-услуги (CONVERSION_PLAN К3.2). Открывает тот же чат, что и шар в углу (ChatProvider).
// Таблетка, как «Узнать цену», с малым шаром и звездой (DESIGN_FIXES_5_PLAN Д26)
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
            <span className={`${s.orb} ${s.triggerOrb}`} aria-hidden="true">
                <OrbStar className={s.triggerIcon} />
            </span>
            <span className={s.triggerText}>
                <span className={`${ralewayBold.className} ${s.triggerTitle}`}>{chatButtonTitle}</span>
                <span className={s.triggerNote}>{chatButtonText}</span>
            </span>
        </button>
    )
}

export default ChatButton
