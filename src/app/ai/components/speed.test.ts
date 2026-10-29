import { describe, expect, it } from "vitest";

import { drop, durFor, fadeFor, FADE_MIN_PX, move, PEAK, rise, riseFor, SLOPE, SPEED } from "./speed";

// Наибольший наклон кривой на [0, 1] – численно
const maxSlope = (curve: (k: number) => number, n = 20000) => {
    let max = 0;
    for (let i = 0; i < n; i++) max = Math.max(max, (curve((i + 1) / n) - curve(i / n)) * n);
    return max;
};

// Скорость движения на px скролла: путь px за окно durFor(px), экран h
const speedOf = (curve: (k: number) => number, px: number, h: number, dur = durFor(px, h)) => maxSlope(curve) * px / (dur * h);

describe("единая скорость /ai (speed.ts)", () => {
    it("скорость – в цели владельца 1,5–2 px на px скролла", () => {
        expect(SPEED).toBeGreaterThanOrEqual(1.5);
        expect(SPEED * SLOPE).toBeLessThanOrEqual(PEAK);
    });

    it("durFor: окно в экранах – путь / (SPEED × высота экрана)", () => {
        expect(durFor(1550, 1000)).toBeCloseTo(1, 6);
        expect(durFor(775, 1000)).toBeCloseTo(.5, 6);
        expect(durFor(-310, 1000)).toBeCloseTo(.2, 6);
        // Средняя скорость окна durFor – SPEED при любом пути и экране
        for (const [px, h] of [[90, 900], [1288, 900], [470, 812], [40, 667]]) {
            expect(px / (durFor(px, h) * h)).toBeCloseTo(SPEED, 6);
        }
    });

    it("кривые перемещения: 0 → 1, монотонны, без скачков", () => {
        for (const curve of [move, drop, rise]) {
            expect(curve(0)).toBeCloseTo(0, 9);
            expect(curve(1)).toBeCloseTo(1, 9);
            expect(curve(-1)).toBeCloseTo(0, 9);
            expect(curve(2)).toBeCloseTo(1, 9);
            let prev = 0;
            for (let i = 1; i <= 1000; i++) {
                const v = curve(i / 1000);
                expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
                expect(v - prev).toBeLessThan(.01);
                prev = v;
            }
        }
    });

    it("move и drop: наклон не выше SLOPE, пик в окне durFor ≤ 2 px на px", () => {
        for (const curve of [move, drop]) {
            expect(maxSlope(curve)).toBeLessThanOrEqual(SLOPE + 1e-3);
            for (const [px, h] of [[90, 900], [1288, 900], [470, 812], [2000, 667]]) {
                expect(speedOf(curve, px, h)).toBeLessThanOrEqual(PEAK + 1e-3);
            }
        }
        // move начинает и заканчивает с нулевой скоростью, drop – с нулевой в начале
        expect((move(.001) - move(0)) * 1000).toBeLessThan(.01);
        expect((move(1) - move(.999)) * 1000).toBeLessThan(.01);
        expect((drop(.001) - drop(0)) * 1000).toBeLessThan(.01);
    });

    it("rise: пик ≤ 2 px на px в окне riseFor", () => {
        for (const [px, h] of [[18, 900], [40, 812], [88, 900]]) {
            expect(speedOf(rise, px, h, riseFor(px, h))).toBeLessThanOrEqual(PEAK + 1e-3);
        }
    });

    it("fadeFor: проявление – не короче FADE_MIN_PX скролла", () => {
        expect(fadeFor(900) * 900).toBeCloseTo(FADE_MIN_PX, 6);
        expect(fadeFor(667) * 667).toBeCloseTo(FADE_MIN_PX, 6);
    });
});
