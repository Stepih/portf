import { describe, expect, it } from "vitest";
import { FEEDBACK_LIMITS, isContactComplete, isContactInput, isNameInput, validateFeedback } from "./feedback";

describe("validateFeedback", () => {
    it("валидная заявка проходит, пробелы по краям обрезаются", () => {
        expect(validateFeedback({ name: "  Иван ", contact: " +7 999 123-45-67 ", message: " Привет " })).toEqual({
            ok: true,
            data: { name: "Иван", contact: "+7 999 123-45-67", message: "Привет" },
        });
    });

    it("комментарий необязателен", () => {
        expect(validateFeedback({ name: "Иван", contact: "79990001122" })).toEqual({
            ok: true,
            data: { name: "Иван", contact: "79990001122", message: "" },
        });
    });

    it("тело не объект — Invalid body", () => {
        for (const body of [null, undefined, "строка", 42]) {
            expect(validateFeedback(body)).toEqual({ ok: false, error: "Invalid body" });
        }
    });

    it("нет имени или контакта, пустые после trim или не строки — Missing required fields", () => {
        const missing = { ok: false, error: "Missing required fields" };
        expect(validateFeedback({ contact: "79990001122" })).toEqual(missing);
        expect(validateFeedback({ name: "Иван" })).toEqual(missing);
        expect(validateFeedback({ name: "   ", contact: "79990001122" })).toEqual(missing);
        expect(validateFeedback({ name: "Иван", contact: 123 })).toEqual(missing);
        expect(validateFeedback({ name: "Иван", contact: "79990001122", message: 5 })).toEqual(missing);
    });

    it("лимиты: имя 50, контакт 50, комментарий 2000 символов после trim", () => {
        const ok = { name: "и".repeat(50), contact: "1".repeat(50), message: "т".repeat(2000) };
        expect(validateFeedback(ok).ok).toBe(true);
        expect(validateFeedback({ ...ok, name: ` ${ok.name} ` }).ok).toBe(true);

        const tooLong = { ok: false, error: "Field too long" };
        expect(validateFeedback({ ...ok, name: "и".repeat(51) })).toEqual(tooLong);
        expect(validateFeedback({ ...ok, contact: "1".repeat(51) })).toEqual(tooLong);
        expect(validateFeedback({ ...ok, message: "т".repeat(2001) })).toEqual(tooLong);
    });

    // DESIGN_FIXES_2_PLAN Д6, SALES_PLAN 4.2: обрывки номера и короткие ники сервер не принимает
    it("контакт не номер целиком и не ник — Invalid contact", () => {
        const invalid = { ok: false, error: "Invalid contact" };
        for (const contact of ["123", "+7 (999) 123-4", "@ivan", "999-00-11", "Иван Петров"]) {
            expect(validateFeedback({ name: "Иван", contact }), contact).toEqual(invalid);
        }
    });

    it("ник Telegram проходит", () => {
        expect(validateFeedback({ name: "Иван", contact: "@ivan_petrov" })).toMatchObject({ ok: true, data: { contact: "@ivan_petrov" } });
    });
});

describe("isContactComplete", () => {
    it("10 цифр и больше – номер целиком, знаки не считаются", () => {
        for (const phone of ["9990001122", "79990001122", "+7 (999) 123-45-67", "8 999 123 45 67", "+44 20 7946 0958"]) {
            expect(isContactComplete(phone), phone).toBe(true);
        }
    });

    it("ник Telegram – с @, ссылкой t.me или без них", () => {
        for (const nick of ["@ivan_petrov", "ivan_petrov", "t.me/ivan_petrov", "https://t.me/IvanPetrov", "@abcde"]) {
            expect(isContactComplete(nick), nick).toBe(true);
        }
    });

    it("короткий номер, короткий ник, ник с цифры и смесь – нет", () => {
        for (const text of ["", "123", "999000112", "+7 (999) 123-4", "(((---)))+++", "@abcd", "@1ivan", "@ivan petrov", "+7 999 ivan_1", "t.me/", "@" + "a".repeat(33)]) {
            expect(isContactComplete(text), text).toBe(false);
        }
    });
});

describe("isContactInput", () => {
    it("номер в любом привычном виде и ник проходят", () => {
        for (const text of ["", "79990001122", "+7 (999) 123-45-67", "8 999 123 45 67", "@ivan_petrov", "https://t.me/ivan"]) {
            expect(isContactInput(text), text).toBe(true);
        }
    });

    it("кириллица, эмодзи и прочие знаки не проходят, длина – не больше лимита", () => {
        for (const text of ["Иван", "@ivan😀", "+7,999", "#1", "1".repeat(FEEDBACK_LIMITS.contact + 1)]) {
            expect(isContactInput(text), text).toBe(false);
        }
    });
});

// Настоящие имена (DESIGN_FIXES_3_PLAN Д14)
describe("isNameInput", () => {
    it("пропускает дефис, «Ё», апостроф, пробелы и другие алфавиты", () => {
        for (const name of ["", "Иван", "Анна-Мария", "Ёлкина", "O'Brien", "O’Brien", "Иван Петров", "José", "Zoë", "Ærøskøbing", "Ли Мин"]) {
            expect(isNameInput(name), name).toBe(true);
        }
    });

    it("пропускает имя ровно до лимита, длиннее – нет", () => {
        expect(isNameInput("а".repeat(FEEDBACK_LIMITS.name))).toBe(true);
        expect(isNameInput("а".repeat(FEEDBACK_LIMITS.name + 1))).toBe(false);
    });

    it("цифры, эмодзи и знаки не проходят", () => {
        for (const name of ["Ив1", "Иван😀", "Иван!", "Иван@", "Иван.", "<b>"]) {
            expect(isNameInput(name), name).toBe(false);
        }
    });
});
