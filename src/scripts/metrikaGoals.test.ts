import { describe, expect, it } from "vitest";
import { linkGoal } from "./metrikaGoals";

const origin = "https://showmyworks.ru";

describe("linkGoal", () => {
    it("ссылка на Telegram – tg_click с местом", () => {
        expect(linkGoal({ href: "https://t.me/polo_ymniy", origin, page: "/", place: "final" })).toEqual({
            goal: "tg_click",
            params: { page: "/", place: "final" },
        });
    });

    it("ссылка на форму – cta_click, параметры адреса не мешают", () => {
        expect(linkGoal({ href: `${origin}/popup?case=icc`, origin, page: "/portfolio/icc", place: "case_end" })).toEqual({
            goal: "cta_click",
            params: { page: "/portfolio/icc", place: "case_end" },
        });
    });

    it("ссылка на форму главной – тоже cta_click, услуга в адресе не мешает", () => {
        expect(linkGoal({ href: `${origin}/#contact`, origin, page: "/", place: "hero" })).toEqual({
            goal: "cta_click",
            params: { page: "/", place: "hero" },
        });
        expect(linkGoal({ href: `${origin}/?service=ai#contact`, origin, page: "/" })?.goal).toBe("cta_click");
    });

    it("явная цель с id важнее адреса", () => {
        expect(linkGoal({ href: `${origin}/popup?service=landing`, origin, page: "/", goal: "service_click", id: "landing" })).toEqual({
            goal: "service_click",
            params: { page: "/", id: "landing" },
        });
    });

    it("обычные ссылки и неизвестные цели не считаются", () => {
        expect(linkGoal({ href: `${origin}/music`, origin, page: "/" })).toBeNull();
        expect(linkGoal({ href: `${origin}/music`, origin, page: "/", goal: "Музыкальное творчество" })).toBeNull();
        expect(linkGoal({ href: "https://other.ru/popup", origin, page: "/" })).toBeNull();
        expect(linkGoal({ href: `${origin}/#faq`, origin, page: "/" })).toBeNull();
    });
});
