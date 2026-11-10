"use client"

import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import s from './Chat.module.scss'
import ChatWindow from "./ChatWindow";
import OrbStar from "./OrbStar";
import { useChat } from "./useChat";
import { ralewayRegular } from "@/app/fonts/fonts";
import { GOALS } from "@/constants/analytics";
import { musicPageURL, popupPageURL } from "@/constants/urls";
import { chatFabLabel } from "@/data/chat";
import { IOfferButton } from "@/interfaces/offer";
import { reachGoal } from "@/scripts/metrika";

// Демо-чат на весь сайт (CONVERSION_PLAN К3.2): диалог, окно и плавающий шар в правом нижнем углу.
// Живёт в layout.tsx, поэтому диалог переживает переходы между страницами.
// Окно и шар – через портал в body: template.tsx двигает страницу transform-ом, и position: fixed внутри него считался бы от страницы.
// Кнопка Telegram приходит пропсом: offer.ts тянет за собой портфолио, в клиентский бандл его не берём

// Где шара нет: на /music внизу плеер, на /popup человек уже заполняет форму
const FAB_HIDDEN = [musicPageURL, popupPageURL];

// opener – кнопка, которой открыли чат: после закрытия фокус возвращается на неё (DESIGN_FIXES_7_PLAN Д38).
// Передаётся явно: Safari при клике не фокусирует кнопку, и activeElement там – body
type OpenChat = (opener?: HTMLElement | null) => void;

const ChatContext = createContext<OpenChat | null>(null);

// Пока форма заявки на экране, шар в углу скрыт: не закрывает поля и кнопку отправки (Д38, решение владельца 10.11.2026)
const FabHideContext = createContext<((shown: boolean) => void) | null>(null);

// Открыть чат из любого места страницы (кнопка в карточке ИИ-услуги)
export const useOpenChat = (): OpenChat => {
    const open = useContext(ChatContext);
    if (!open) throw new Error('useOpenChat вне ChatProvider');
    return open;
};

// Чат прямо на странице (SERVICES_PLAN У4, страница /ai): тот же диалог, что в окне, и Telegram для кнопки под ответом.
// Пока встроенный чат на экране, шар в углу прячется (setInlineShown)
interface IChatDialog {
    chat: ReturnType<typeof useChat>;
    tgButton: IOfferButton;
    setInlineShown: (shown: boolean) => void;
}

const ChatDialogContext = createContext<IChatDialog | null>(null);

export const useChatDialog = () => {
    const dialog = useContext(ChatDialogContext);
    if (!dialog) throw new Error('useChatDialog вне ChatProvider');
    return dialog;
};

// Callback-ref для формы заявки: пока хоть край формы в окне, шар скрыт. Вне ChatProvider ничего не делает
export const useHideChatFab = () => {
    const setFormShown = useContext(FabHideContext);
    const observer = useRef<IntersectionObserver | null>(null);

    return useCallback((el: HTMLElement | null) => {
        observer.current?.disconnect();
        observer.current = null;
        if (!setFormShown) return;
        if (!el) {
            setFormShown(false);
            return;
        }
        observer.current = new IntersectionObserver(([entry]) => setFormShown(entry.isIntersecting));
        observer.current.observe(el);
    }, [setFormShown]);
};

interface IChatProvider {
    tgButton: IOfferButton;
    children: ReactNode;
}

const ChatProvider: FC<IChatProvider> = ({ tgButton, children }) => {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [inlineShown, setInlineShown] = useState(false);
    const [formShown, setFormShown] = useState(false);
    const chat = useChat();
    const pathname = usePathname();
    // Куда вернуть фокус после закрытия: шар или кнопка в карточке
    const openerRef = useRef<HTMLElement | null>(null);

    useEffect(() => setMounted(true), []);

    const openChat = useCallback<OpenChat>((opener) => {
        openerRef.current = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
        setOpen(true);
        reachGoal(GOALS.chatOpen, { page: window.location.pathname });
    }, []);

    const onClose = useCallback(() => {
        setOpen(false);
        // Шар, скрытый за встроенным чатом или формой, фокус не берёт
        const opener = openerRef.current;
        if (opener?.isConnected && opener.getAttribute('aria-hidden') !== 'true') opener.focus();
    }, []);

    const fabVisible = !FAB_HIDDEN.some((url) => pathname.startsWith(url));
    // Шар на месте, но погашен: на экране встроенный чат (/ai) или форма заявки. Для Tab и скринридера его тоже нет
    const fabMuted = inlineShown || formShown;

    return (
        <ChatContext.Provider value={openChat}>
            <ChatDialogContext.Provider value={{ chat, tgButton, setInlineShown }}>
                <FabHideContext.Provider value={setFormShown}>
                    {children}
                </FabHideContext.Provider>
            </ChatDialogContext.Provider>

            {mounted && createPortal(
                <>
                    <AnimatePresence>
                        {fabVisible && (
                            <motion.button
                                type="button"
                                className={s.fab}
                                onClick={(e) => openChat(e.currentTarget)}
                                aria-haspopup="dialog"
                                // Пока чат или форма на странице, шар в углу гаснет на месте, без сжатия: на странице /ai
                                // в угол прилетает большой шар страницы и передаёт ему место
                                aria-hidden={fabMuted || undefined}
                                tabIndex={fabMuted ? -1 : undefined}
                                style={{ pointerEvents: fabMuted ? 'none' : undefined }}
                                initial={{ opacity: 0, scale: 0 }}
                                // Пока окно открыто, шар прячется под ним
                                animate={open ? { opacity: 0, scale: 0.5 } : fabMuted ? { opacity: 0, scale: 1 } : { opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            >
                                <span className={`${ralewayRegular.className} ${s.fabLabel}`}>{chatFabLabel}</span>
                                <span className={s.fabOrb} aria-hidden="true">
                                    <span className={s.fabLight} />
                                    <OrbStar className={s.fabIcon} />
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {open && <ChatWindow chat={chat} tgButton={tgButton} onClose={onClose} />}
                    </AnimatePresence>
                </>,
                document.body
            )}
        </ChatContext.Provider>
    )
}

export default ChatProvider
