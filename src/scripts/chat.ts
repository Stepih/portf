import { chatErrorText, chatLeadQuestions } from "@/data/chat";
import type { ChatLimitReason } from "@/lib/chat/guard";
import type { IChatMessage } from "@/lib/chat/request";
import { FEEDBACK_LIMITS } from "@/lib/validation/feedback";

// Логика окна демо-чата без React (CONVERSION_PLAN К3.2)

// Реплика в окне. failed – вопрос без ответа, note – текст сайта (ошибка, лимит, «контакт отправлен»):
// ни то ни другое модели не уходит
export interface IChatItem {
    id: number;
    role: IChatMessage['role'];
    content: string;
    failed?: boolean;
    note?: boolean;
}

// Что отправить в /api/chat: весь диалог без заметок, вопросов без ответа и пустых реплик.
// Роут сам обрежет историю, но лимит на диалог считает по всем вопросам – поэтому шлём всё
export const chatRequestMessages = (items: IChatItem[]): IChatMessage[] =>
    items
        .filter((item) => !item.failed && !item.note && item.content.trim())
        .map(({ role, content }) => ({ role, content }));

export const chatQuestions = (items: IChatItem[]): string[] =>
    items.filter((item) => item.role === 'user' && !item.failed).map((item) => item.content);

const LIMIT_REASONS: readonly string[] = ['ip', 'dialog', 'budget'] satisfies ChatLimitReason[];

export type ChatFailure =
    | { kind: 'limit'; reason: ChatLimitReason }
    | { kind: 'error'; text: string };

// Неуспешный ответ роута: 429 с reason – лимит (дальше только форма и Telegram), 400 – вопрос не принят,
// остальное – чат недоступен
export const chatFailure = (status: number, body: unknown): ChatFailure => {
    const reason = (body as Record<string, unknown> | null)?.reason;
    if (status === 429 && typeof reason === 'string' && LIMIT_REASONS.includes(reason)) {
        return { kind: 'limit', reason: reason as ChatLimitReason };
    }
    return { kind: 'error', text: status === 400 ? chatErrorText.invalid : chatErrorText.unavailable };
};

// Комментарий к заявке из чата: вопросы клиента, чтобы Степан знал, о чём шла речь.
// Не длиннее поля комментария формы: лишнее обрезается с «…»
export const chatLeadMessage = (questions: string[]): string => {
    if (!questions.length) return '';
    const text = [chatLeadQuestions, ...questions.map((q) => `– ${q.replace(/\s+/g, ' ').trim()}`)].join('\n');
    return text.length > FEEDBACK_LIMITS.message ? `${text.slice(0, FEEDBACK_LIMITS.message - 1)}…` : text;
};
