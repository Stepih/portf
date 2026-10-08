import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
    it("пропускает limit запросов в окне, следующий блокирует", () => {
        const isLimited = createRateLimiter({ limit: 3, windowMs: 1000 });

        expect([0, 10, 20].map(t => isLimited("1.1.1.1", t))).toEqual([false, false, false]);
        expect(isLimited("1.1.1.1", 30)).toBe(true);
    });

    it("запрос держит место в окне ровно windowMs", () => {
        const stillInWindow = createRateLimiter({ limit: 1, windowMs: 1000 });
        stillInWindow("ip", 0);
        expect(stillInWindow("ip", 999)).toBe(true);

        const leftWindow = createRateLimiter({ limit: 1, windowMs: 1000 });
        leftWindow("ip", 0);
        expect(leftWindow("ip", 1000)).toBe(false);
    });

    it("из окна выпадают только старые запросы, свежие продолжают считаться", () => {
        const isLimited = createRateLimiter({ limit: 2, windowMs: 1000 });
        isLimited("ip", 0);
        isLimited("ip", 500);

        expect(isLimited("ip", 1000)).toBe(false); // 0 вышел, в окне 500 и 1000
        expect(isLimited("ip", 1200)).toBe(true); // 500, 1000, 1200
    });

    it("заблокированные попытки тоже считаются: долбёжка продлевает блокировку", () => {
        const isLimited = createRateLimiter({ limit: 1, windowMs: 1000 });
        isLimited("ip", 0);

        expect(isLimited("ip", 900)).toBe(true);
        expect(isLimited("ip", 1500)).toBe(true); // запрос в 900 ещё в окне
    });

    it("разные IP считаются отдельно", () => {
        const isLimited = createRateLimiter({ limit: 1, windowMs: 1000 });
        isLimited("a", 0);

        expect(isLimited("a", 1)).toBe(true);
        expect(isLimited("b", 2)).toBe(false);
    });

    it("каждый ограничитель хранит своё состояние", () => {
        const first = createRateLimiter({ limit: 1, windowMs: 1000 });
        const second = createRateLimiter({ limit: 1, windowMs: 1000 });
        first("ip", 0);

        expect(second("ip", 1)).toBe(false);
    });
});
