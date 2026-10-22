import { describe, expect, it } from "vitest";
import { leadMessageText, leadSourceFromSearch, leadSourceLines } from "./leadSource";

describe("leadSourceFromSearch", () => {
    it("берёт услугу, кейс и отрасль из адреса", () => {
        expect(leadSourceFromSearch("?service=landing&case=icc&for=construction")).toEqual({
            service: "landing",
            case: "icc",
            for: "construction",
        });
    });

    it("пустые и чужие параметры не попадают", () => {
        expect(leadSourceFromSearch("?case=&utm_source=tg")).toEqual({});
        expect(leadSourceFromSearch("")).toEqual({});
    });
});

describe("leadSourceLines", () => {
    it("известные id превращаются в названия", () => {
        expect(leadSourceLines({ service: "landing", case: "icc", for: "construction" })).toEqual([
            "Услуга: Лендинг",
            "Кейс: ИКЦ «Презентация»",
            "Отрасль: Строительство и ремонт",
        ]);
    });

    it("заявка из демо-чата помечается", () => {
        expect(leadSourceLines({ from: "chat" })).toEqual(["Откуда: демо-чат"]);
        expect(leadSourceLines({ from: "spam" })).toEqual([]);
    });

    it("неизвестные id и не строки отбрасываются", () => {
        expect(leadSourceLines({ service: "spam", case: 42, for: { id: "medicine" } })).toEqual([]);
        expect(leadSourceLines({})).toEqual([]);
    });
});

describe("leadMessageText", () => {
    const lead = { name: "Анна", contact: "@anna", message: "Нужен сайт" };

    it("заявка на русском: заголовок, поля, откуда пришла", () => {
        expect(leadMessageText(lead, { case: "icc" })).toBe(
            "Новая заявка с сайта\n\nИмя: Анна\nКонтакт: @anna\nКомментарий: Нужен сайт\n\nКейс: ИКЦ «Презентация»"
        );
    });

    it("без комментария и источника лишних строк нет", () => {
        expect(leadMessageText({ ...lead, message: "" }, {})).toBe(
            "Новая заявка с сайта\n\nИмя: Анна\nКонтакт: @anna"
        );
    });
});
