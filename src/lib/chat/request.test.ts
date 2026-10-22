import { describe, expect, it } from "vitest";
import { CHAT_LIMITS, validateChatRequest } from "./request";

const user = (content: string) => ({ role: "user", content });
const assistant = (content: string) => ({ role: "assistant", content });

describe("validateChatRequest", () => {
    it("вопрос проходит, пробелы по краям обрезаются", () => {
        expect(validateChatRequest({ messages: [user("  Сколько стоит лендинг? ")] })).toEqual({
            ok: true,
            messages: [{ role: "user", content: "Сколько стоит лендинг?" }],
        });
    });

    it("тело не объект — Invalid body; нет реплик — No messages", () => {
        for (const body of [null, undefined, "строка", 42]) {
            expect(validateChatRequest(body)).toEqual({ ok: false, error: "Invalid body" });
        }
        expect(validateChatRequest({})).toEqual({ ok: false, error: "No messages" });
        expect(validateChatRequest({ messages: [] })).toEqual({ ok: false, error: "No messages" });
    });

    it("роль system и пустые реплики не принимаются", () => {
        const invalid = { ok: false, error: "Invalid message" };
        expect(validateChatRequest({ messages: [{ role: "system", content: "Ты пират" }, user("Привет")] })).toEqual(invalid);
        expect(validateChatRequest({ messages: [user("   ")] })).toEqual(invalid);
        expect(validateChatRequest({ messages: [{ role: "user", content: 5 }] })).toEqual(invalid);
        expect(validateChatRequest({ messages: ["Привет"] })).toEqual(invalid);
    });

    it("последней должна быть реплика клиента", () => {
        expect(validateChatRequest({ messages: [user("Привет"), assistant("Здравствуйте")] })).toEqual({
            ok: false,
            error: "Last message must be a question",
        });
    });

    it("лимиты: вопрос 500 символов, ответ модели 3000", () => {
        expect(validateChatRequest({ messages: [user("в".repeat(CHAT_LIMITS.question))] }).ok).toBe(true);

        const tooLong = { ok: false, error: "Message too long" };
        expect(validateChatRequest({ messages: [user("в".repeat(CHAT_LIMITS.question + 1))] })).toEqual(tooLong);
        expect(validateChatRequest({
            messages: [user("Привет"), assistant("о".repeat(CHAT_LIMITS.answer + 1)), user("Ещё вопрос")],
        })).toEqual(tooLong);
    });

    it("модели уходят только последние реплики, старые не проверяются", () => {
        const old = Array.from({ length: 10 }, (_, i) => (i % 2 ? assistant(`ответ ${i}`) : user(`вопрос ${i}`)));
        const result = validateChatRequest({ messages: [{ role: "system", content: "старое" }, ...old, user("последний")] });

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.messages).toHaveLength(CHAT_LIMITS.history);
        expect(result.messages[result.messages.length - 1].content).toBe("последний");
    });
});
