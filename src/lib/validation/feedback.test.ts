import { describe, expect, it } from "vitest";
import { isPhoneComplete, isPhoneInput, validateFeedback } from "./feedback";

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

    it("лимиты: имя 50, контакт 30, комментарий 2000 символов после trim", () => {
        const ok = { name: "и".repeat(50), contact: "1".repeat(30), message: "т".repeat(2000) };
        expect(validateFeedback(ok).ok).toBe(true);
        expect(validateFeedback({ ...ok, name: ` ${ok.name} ` }).ok).toBe(true);

        const tooLong = { ok: false, error: "Field too long" };
        expect(validateFeedback({ ...ok, name: "и".repeat(51) })).toEqual(tooLong);
        expect(validateFeedback({ ...ok, contact: "1".repeat(31) })).toEqual(tooLong);
        expect(validateFeedback({ ...ok, message: "т".repeat(2001) })).toEqual(tooLong);
    });

    // DESIGN_FIXES_2_PLAN Д6: «123» и прочие обрывки номера сервер не принимает
    it("в контакте меньше 10 цифр — Invalid phone", () => {
        const invalid = { ok: false, error: "Invalid phone" };
        for (const contact of ["123", "+7 (999) 123-4", "@ivan", "999-00-11"]) {
            expect(validateFeedback({ name: "Иван", contact }), contact).toEqual(invalid);
        }
    });
});

describe("isPhoneComplete", () => {
    it("10 цифр и больше – номер целиком, знаки не считаются", () => {
        for (const phone of ["9990001122", "79990001122", "+7 (999) 123-45-67", "8 999 123 45 67", "+44 20 7946 0958"]) {
            expect(isPhoneComplete(phone), phone).toBe(true);
        }
    });

    it("меньше 10 цифр – нет", () => {
        for (const text of ["", "123", "999000112", "+7 (999) 123-4", "(((---)))+++"]) {
            expect(isPhoneComplete(text), text).toBe(false);
        }
    });
});

describe("isPhoneInput", () => {
    it("номер проходит в любом привычном виде", () => {
        for (const phone of ["", "79990001122", "+7 (999) 123-45-67", "8 999 123 45 67", "+79990001122"]) {
            expect(isPhoneInput(phone), phone).toBe(true);
        }
    });

    it("буквы и прочие знаки не проходят, длина – не больше 25", () => {
        for (const text of ["12a", "@ivan", "+7.999", "1".repeat(26)]) {
            expect(isPhoneInput(text), text).toBe(false);
        }
    });
});
