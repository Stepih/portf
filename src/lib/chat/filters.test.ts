import { describe, expect, it } from "vitest";
import { isGarbage, isSameOrigin } from "./filters";

const req = (headers: Record<string, string>) => new Request("https://showmyworks.ru/api/chat", { method: "POST", headers });

describe("isSameOrigin", () => {
    it("Origin совпадает с хостом – да; чужой или пустой – нет", () => {
        expect(isSameOrigin(req({ host: "showmyworks.ru", origin: "https://showmyworks.ru" }))).toBe(true);
        expect(isSameOrigin(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).toBe(true);
        expect(isSameOrigin(req({ host: "showmyworks.ru", origin: "https://evil.example" }))).toBe(false);
        expect(isSameOrigin(req({ host: "showmyworks.ru" }))).toBe(false);
        expect(isSameOrigin(req({ host: "showmyworks.ru", origin: "null" }))).toBe(false);
    });
});

describe("isGarbage", () => {
    it("обычные вопросы проходят, в том числе с одной ссылкой и по-английски", () => {
        expect(isGarbage("Сколько стоит лендинг?")).toBe(false);
        expect(isGarbage("Вот мой сайт https://example.ru – переделаете?")).toBe(false);
        expect(isGarbage("Hi, do you build websites?")).toBe(false);
        expect(isGarbage("Ну ооочень нужно")).toBe(false);
    });

    it("без букв, одна буква подряд 15 раз, три ссылки – мусор", () => {
        expect(isGarbage("?????")).toBe(true);
        expect(isGarbage("123 456")).toBe(true);
        expect(isGarbage("ааааааааааааааа")).toBe(true);
        expect(isGarbage("https://a.ru https://b.ru www.c.ru купите")).toBe(true);
    });
});
