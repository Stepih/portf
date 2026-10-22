import { describe, expect, it } from "vitest";
import { chatErrorText } from "@/data/chat";
import { FEEDBACK_LIMITS } from "@/lib/validation/feedback";
import { chatFailure, chatLeadMessage, chatQuestions, chatRequestMessages, IChatItem } from "./chat";

const items: IChatItem[] = [
    { id: 1, role: 'user', content: 'Сколько стоит лендинг?' },
    { id: 2, role: 'assistant', content: 'От 8 000 ₽.' },
    { id: 3, role: 'user', content: '!!!', failed: true },
    { id: 4, role: 'assistant', content: chatErrorText.invalid, note: true },
    { id: 5, role: 'user', content: 'А бот?' },
    { id: 6, role: 'assistant', content: '' },
];

describe("chatRequestMessages", () => {
    it("без заметок, вопросов без ответа и пустых реплик", () => {
        expect(chatRequestMessages(items)).toEqual([
            { role: 'user', content: 'Сколько стоит лендинг?' },
            { role: 'assistant', content: 'От 8 000 ₽.' },
            { role: 'user', content: 'А бот?' },
        ]);
    });
});

describe("chatQuestions", () => {
    it("только принятые вопросы клиента", () => {
        expect(chatQuestions(items)).toEqual(['Сколько стоит лендинг?', 'А бот?']);
    });
});

describe("chatFailure", () => {
    it("429 с известной причиной – лимит", () => {
        expect(chatFailure(429, { error: 'limit', reason: 'budget' })).toEqual({ kind: 'limit', reason: 'budget' });
        expect(chatFailure(429, { error: 'limit', reason: 'dialog' })).toEqual({ kind: 'limit', reason: 'dialog' });
    });

    it("400 – вопрос не принят, остальное – чат недоступен", () => {
        expect(chatFailure(400, { error: 'Invalid message' })).toEqual({ kind: 'error', text: chatErrorText.invalid });
        expect(chatFailure(429, { reason: 'other' })).toEqual({ kind: 'error', text: chatErrorText.unavailable });
        expect(chatFailure(502, null)).toEqual({ kind: 'error', text: chatErrorText.unavailable });
    });
});

describe("chatLeadMessage", () => {
    it("вопросы списком, пробелы схлопнуты", () => {
        expect(chatLeadMessage(['Сколько стоит\n лендинг?', 'А бот?'])).toBe('Вопросы в чате:\n– Сколько стоит лендинг?\n– А бот?');
    });

    it("без вопросов – пусто, длинное обрезается до поля комментария", () => {
        expect(chatLeadMessage([])).toBe('');
        const long = chatLeadMessage(Array.from({ length: 10 }, () => 'а'.repeat(500)));
        expect(long).toHaveLength(FEEDBACK_LIMITS.message);
        expect(long.endsWith('…')).toBe(true);
    });
});
