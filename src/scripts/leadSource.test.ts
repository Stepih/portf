import { describe, expect, it } from "vitest";
import { leadSourceFromSearch, leadSourceLines } from "./leadSource";

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
            "Service: Лендинг",
            "Case: ИКЦ «Презентация»",
            "Industry: Строительство и ремонт",
        ]);
    });

    it("неизвестные id и не строки отбрасываются", () => {
        expect(leadSourceLines({ service: "spam", case: 42, for: { id: "medicine" } })).toEqual([]);
        expect(leadSourceLines({})).toEqual([]);
    });
});
