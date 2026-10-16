import { describe, expect, it } from "vitest";
import { easeInOutQuad, easeOutCubic, passToCenter } from "./easing";

describe("easing", () => {
    it("кривые начинаются в 0 и заканчиваются в 1", () => {
        for (const ease of [easeOutCubic, easeInOutQuad]) {
            expect(ease(0)).toBe(0);
            expect(ease(1)).toBe(1);
        }
    });

    it("easeInOutQuad симметрична относительно середины", () => {
        expect(easeInOutQuad(0.5)).toBe(0.5);
        expect(easeInOutQuad(0.25) + easeInOutQuad(0.75)).toBeCloseTo(1);
    });

    it("easeOutCubic обгоняет линейную кривую", () => {
        expect(easeOutCubic(0.3)).toBeGreaterThan(0.3);
    });

    it("passToCenter переводит прогресс в диапазон от 1 до -1", () => {
        expect(passToCenter(0)).toBe(1);
        expect(passToCenter(0.5)).toBe(0);
        expect(passToCenter(1)).toBe(-1);
    });
});
