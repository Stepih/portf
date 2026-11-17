import { describe, expect, it } from "vitest";
import { isMetrikaHost } from "./metrika";

// Метрика только на проде (DESIGN_FIXES_10_PLAN Д54)
describe("isMetrikaHost", () => {
    it("прод и www – да", () => {
        expect(isMetrikaHost("showmyworks.ru")).toBe(true);
        expect(isMetrikaHost("www.showmyworks.ru")).toBe(true);
    });

    it("регистр и точка в конце имени не мешают", () => {
        expect(isMetrikaHost("ShowMyWorks.RU")).toBe(true);
        expect(isMetrikaHost("showmyworks.ru.")).toBe(true);
    });

    it("локальные, превью и похожие хосты – нет", () => {
        for (const host of ["localhost", "127.0.0.1", "", "portfolio-git-master.vercel.app", "2.31.105.139.sslip.io",
            "2.31.105.139", "dev.showmyworks.ru", "showmyworks.ru.evil.com", "notshowmyworks.ru"]) {
            expect(isMetrikaHost(host), host).toBe(false);
        }
    });
});
