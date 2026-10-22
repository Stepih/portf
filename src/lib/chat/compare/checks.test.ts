import { describe, expect, it } from "vitest";
import { answerProblems } from "./checks";

const prompt = "Лендинг: цена от 8 000 ₽. Сайт компании: от 30 000 ₽";

describe("answerProblems", () => {
    it("хороший ответ проходит", () => {
        expect(answerProblems("Лендинг стоит от 8 000 ₽ и делается за 3–4 дня. Точную цену Степан назовёт на созвоне.", prompt)).toEqual([]);
    });

    it("цена, которой нет в базе, и цена без «от»", () => {
        expect(answerProblems("Лендинг – от 5000 рублей.", prompt)).toEqual(["цена не из базы: 5000 ₽"]);
        expect(answerProblems("Сайт компании от 30000 ₽.", prompt)).toEqual([]);
        expect(answerProblems("Лендинг стоит 8 000 ₽.", prompt)).toEqual(["цена без «от»: 8000 ₽"]);
    });

    it("длинное тире, Markdown, ссылка, пустой ответ", () => {
        expect(answerProblems("Да — конечно.", prompt)).toEqual(["длинное тире"]);
        expect(answerProblems("**Да**, конечно.", prompt)).toEqual(["Markdown"]);
        expect(answerProblems("- пункт\n- пункт", prompt)).toEqual(["Markdown"]);
        expect(answerProblems("Пишите: t.me/polo_ymniy", prompt)).toEqual(["ссылка"]);
        expect(answerProblems("Кейс: /portfolio/loti", prompt)).toEqual(["ссылка"]);
        expect(answerProblems("  ", prompt)).toEqual(["пустой ответ"]);
    });

    it("больше 5 предложений – длинный", () => {
        expect(answerProblems("Раз. Два. Три. Четыре. Пять. Шесть.", prompt)).toEqual(["длинный: 6 предложений"]);
    });

    it("от лица Степана, упоминание правил и модели", () => {
        expect(answerProblems("За один день сайт не сделаю.", prompt)).toEqual(["от лица Степана"]);
        expect(answerProblems("Передам ваш номер Степану.", prompt)).toEqual(["от лица Степана"]);
        expect(answerProblems("В базе знаний этого нет.", prompt)).toEqual(["упоминает правила или базу"]);
        expect(answerProblems("Я работаю на Claude.", prompt)).toEqual(["называет модель"]);
        // Слово внутри другого слова не считается
        expect(answerProblems("Степан всё сделает сам.", prompt)).toEqual([]);
    });
});
