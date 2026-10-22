import { describe, expect, it } from "vitest";
import { answerProblems } from "./checks";

const prompt = "Лендинг: цена от 8 000 ₽. Сайт компании: от 30 000 ₽";

describe("answerProblems", () => {
    it("хороший ответ проходит", () => {
        expect(answerProblems("Лендинг стоит от 8 000 ₽ и делается за 3–4 дня. Точную цену Степан назовёт на созвоне.", prompt)).toEqual([]);
    });

    it("цена, которой нет в базе", () => {
        expect(answerProblems("Лендинг – 5000 рублей.", prompt)).toEqual(["цена не из базы: 5000 ₽"]);
        expect(answerProblems("Сайт компании от 30000 ₽.", prompt)).toEqual([]);
    });

    it("длинное тире, Markdown, ссылка, пустой ответ", () => {
        expect(answerProblems("Да — конечно.", prompt)).toEqual(["длинное тире"]);
        expect(answerProblems("**Да**, конечно.", prompt)).toEqual(["Markdown"]);
        expect(answerProblems("- пункт\n- пункт", prompt)).toEqual(["Markdown"]);
        expect(answerProblems("Пишите: t.me/polo_ymniy", prompt)).toEqual(["ссылка"]);
        expect(answerProblems("  ", prompt)).toEqual(["пустой ответ"]);
    });

    it("больше 5 предложений – длинный", () => {
        expect(answerProblems("Раз. Два. Три. Четыре. Пять. Шесть.", prompt)).toEqual(["длинный: 6 предложений"]);
    });
});
