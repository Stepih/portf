import { describe, expect, it } from "vitest";
import { fadeOpacity } from "./fadeOpacity";

// Блок занимает в потоке страницы отрезок 1000–1600 px
const block = { top: 1000, bottom: 1600 };

describe("fadeOpacity", () => {
    it("блок полностью виден, пока прокрутка не дошла до его верха", () => {
        expect(fadeOpacity(500, block)).toBe(1);
    });

    it("гаснет втрое быстрее прокрутки: на 100 px из 600 остаётся половина", () => {
        expect(fadeOpacity(1100, block)).toBeCloseTo(0.5);
    });

    it("после трети блока остаётся невидимым и не уходит в минус", () => {
        expect(fadeOpacity(1400, block)).toBe(0);
        expect(fadeOpacity(2000, block)).toBe(0);
    });

    it("неизмеренный блок нулевой высоты виден полностью", () => {
        expect(fadeOpacity(0, { top: 0, bottom: 0 })).toBe(1);
        expect(fadeOpacity(500, { top: 0, bottom: 0 })).toBe(1);
    });
});
