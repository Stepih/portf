import { describe, expect, it } from "vitest";
import { validateFeedback } from "./feedback";

describe("validateFeedback", () => {
    it("валидная заявка проходит, пробелы по краям обрезаются", () => {
        expect(validateFeedback({ name: "  Иван ", contact: " @ivan ", message: " Привет " })).toEqual({
            ok: true,
            data: { name: "Иван", contact: "@ivan", message: "Привет" },
        });
    });

    it("комментарий необязателен", () => {
        expect(validateFeedback({ name: "Иван", contact: "@ivan" })).toEqual({
            ok: true,
            data: { name: "Иван", contact: "@ivan", message: "" },
        });
    });

    it("тело не объект — Invalid body", () => {
        for (const body of [null, undefined, "строка", 42]) {
            expect(validateFeedback(body)).toEqual({ ok: false, error: "Invalid body" });
        }
    });

    it("нет имени или контакта, пустые после trim или не строки — Missing required fields", () => {
        const missing = { ok: false, error: "Missing required fields" };
        expect(validateFeedback({ contact: "@ivan" })).toEqual(missing);
        expect(validateFeedback({ name: "Иван" })).toEqual(missing);
        expect(validateFeedback({ name: "   ", contact: "@ivan" })).toEqual(missing);
        expect(validateFeedback({ name: "Иван", contact: 123 })).toEqual(missing);
        expect(validateFeedback({ name: "Иван", contact: "@ivan", message: 5 })).toEqual(missing);
    });

    it("лимиты: имя 50, контакт 30, комментарий 2000 символов после trim", () => {
        const ok = { name: "и".repeat(50), contact: "к".repeat(30), message: "т".repeat(2000) };
        expect(validateFeedback(ok).ok).toBe(true);
        expect(validateFeedback({ ...ok, name: ` ${ok.name} ` }).ok).toBe(true);

        const tooLong = { ok: false, error: "Field too long" };
        expect(validateFeedback({ ...ok, name: "и".repeat(51) })).toEqual(tooLong);
        expect(validateFeedback({ ...ok, contact: "к".repeat(31) })).toEqual(tooLong);
        expect(validateFeedback({ ...ok, message: "т".repeat(2001) })).toEqual(tooLong);
    });
});
