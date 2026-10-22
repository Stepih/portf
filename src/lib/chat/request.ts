// Проверка запроса к /api/chat (CONVERSION_PLAN К3.2). Общая для окна чата (maxLength поля) и для роута

export const CHAT_LIMITS = {
    // Вопрос клиента, символов
    question: 500,
    // Прошлый ответ модели, символов: ответ ограничен max_tokens, длиннее он быть не может
    answer: 3000,
    // Сколько последних реплик уходит модели вместе с вопросом: старые обрезаются, чтобы не росла цена
    history: 6,
} as const;

export interface IChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

type ChatRequestResult =
    | { ok: true; messages: IChatMessage[] }
    | { ok: false; error: string };

const isRole = (role: unknown): role is IChatMessage['role'] => role === 'user' || role === 'assistant';

// Роль system не принимается: клиент не может подменить системный промпт
export const validateChatRequest = (body: unknown): ChatRequestResult => {
    if (typeof body !== 'object' || body === null) return { ok: false, error: 'Invalid body' };

    const raw = (body as Record<string, unknown>).messages;
    if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: 'No messages' };

    const messages: IChatMessage[] = [];
    for (const item of raw.slice(-CHAT_LIMITS.history)) {
        if (typeof item !== 'object' || item === null) return { ok: false, error: 'Invalid message' };
        const { role, content } = item as Record<string, unknown>;
        if (!isRole(role) || typeof content !== 'string' || !content.trim()) return { ok: false, error: 'Invalid message' };

        const text = content.trim();
        if (text.length > CHAT_LIMITS[role === 'user' ? 'question' : 'answer']) return { ok: false, error: 'Message too long' };
        messages.push({ role, content: text });
    }

    if (messages[messages.length - 1].role !== 'user') return { ok: false, error: 'Last message must be a question' };

    return { ok: true, messages };
};
