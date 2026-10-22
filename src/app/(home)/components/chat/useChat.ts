import { useCallback, useEffect, useRef, useState } from "react";

import { GOALS } from "@/constants/analytics";
import { chatErrorText } from "@/data/chat";
import type { ChatLimitReason } from "@/lib/chat/guard";
import { CHAT_LIMITS } from "@/lib/chat/request";
import { HONEYPOT_FIELD } from "@/lib/validation/feedback";
import { chatFailure, chatQuestions, chatRequestMessages, IChatItem } from "@/scripts/chat";
import { reachGoal } from "@/scripts/metrika";

// Диалог демо-чата (CONVERSION_PLAN К3.2). Живёт в ChatProvider, а не в окне: закрыли и открыли окно или перешли на другую страницу – диалог на месте.
// Ответ приходит обычным текстом по кускам и дописывается в последнюю реплику
export const useChat = () => {
    const [items, setItems] = useState<IChatItem[]>([]);
    const [loading, setLoading] = useState(false);
    // Лимит – дальше вопросы не принимаются, только форма и Telegram
    const [limit, setLimit] = useState<ChatLimitReason | null>(null);
    const nextId = useRef(1);
    const abortRef = useRef<AbortController | null>(null);

    // Ушли со страницы – запрос обрывается, недописанный ответ не оплачивается
    useEffect(() => () => abortRef.current?.abort(), []);

    const addNote = useCallback((content: string) => {
        setItems((prev) => [...prev, { id: nextId.current++, role: 'assistant', content, note: true }]);
    }, []);

    const ask = useCallback(async (question: string, honeypot = '') => {
        const text = question.trim();
        if (!text || loading || limit) return;

        const userId = nextId.current++;
        const answerId = nextId.current++;
        const history: IChatItem[] = [...items, { id: userId, role: 'user', content: text }];
        const count = chatQuestions(history).length;
        setItems(history);
        setLoading(true);
        reachGoal(GOALS.chatMessage, { page: window.location.pathname, n: String(count) });

        // Вопрос без ответа модели не уходит в следующие запросы
        const dropQuestion = () => setItems((prev) => prev
            .filter((item) => item.id !== answerId)
            .map((item) => item.id === userId ? { ...item, failed: true } : item));

        const controller = new AbortController();
        abortRef.current = controller;
        let answer = '';
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatRequestMessages(history), [HONEYPOT_FIELD]: honeypot }),
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                const failure = chatFailure(response.status, await response.json().catch(() => null));
                dropQuestion();
                if (failure.kind === 'limit') setLimit(failure.reason);
                else addNote(failure.text);
                return;
            }

            setItems((prev) => [...prev, { id: answerId, role: 'assistant', content: '' }]);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                answer += decoder.decode(value, { stream: true });
                const content = answer;
                setItems((prev) => prev.map((item) => item.id === answerId ? { ...item, content } : item));
            }

            if (!answer.trim()) {
                dropQuestion();
                addNote(chatErrorText.unavailable);
            } else if (count >= CHAT_LIMITS.dialog) {
                setLimit('dialog');
            }
        } catch {
            if (controller.signal.aborted) return;
            // Часть ответа уже показана – оставляем её. Нет ничего – вопрос не принят
            if (!answer.trim()) dropQuestion();
            // fetch падает с TypeError, если нет сети; оборванный поток – с другой ошибкой
            addNote(answer ? chatErrorText.broken : chatErrorText.network);
        } finally {
            if (abortRef.current === controller) abortRef.current = null;
            setLoading(false);
        }
    }, [items, loading, limit, addNote]);

    return { items, loading, limit, ask, addNote };
};
