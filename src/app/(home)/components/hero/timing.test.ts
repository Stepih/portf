import { describe, expect, it } from "vitest";
import { move, PEAK, SPEED } from "@/app/ai/components/speed";
import { burstLength, DESKTOP_GEOM, FLIGHT, ISceneGeom, LIFT, PHONE_GEOM, PORTAL_HOLD, sceneTiming, WAVE } from "./timing";

// Пик скорости кривой на окне dur экранов, путь px, экран h: максимум |Δ| / Δскролл
const peak = (curve: (k: number) => number, px: number, dur: number, h: number) => {
    let max = 0;
    const steps = 400;
    for (let i = 0; i < steps; i++) {
        const d = Math.abs(curve((i + 1) / steps) - curve(i / steps)) * px;
        max = Math.max(max, d / (dur * h / steps));
    }
    return max;
};

const cases: [string, ISceneGeom][] = [
    ["1400×900", DESKTOP_GEOM],
    ["375×812", PHONE_GEOM],
    ["1100×700, пути длиннее", { ...DESKTOP_GEOM, h: 700, photo: 700, open: 1000, wave: 700, chip: 600, chipPeak: 1400, deal: 600 }],
];

describe("сцена первого экрана главной – скорость как у /sites и /ai", () => {
    for (const [name, g] of cases) {
        it(name, () => {
            const t = sceneTiming(g);
            const screens = (a: number, b: number) => (b - a) * t.length;
            // Раскрытие: фото и фон – кривой move, пик не выше предела
            expect(peak(move, Math.max(g.photo, g.inset), screens(t.expandFrom, t.expandTo), g.h)).toBeLessThanOrEqual(PEAK);
            // Портал: рост диска и дыра – move, пик не выше предела
            expect(peak(move, g.grow, (t.diskTo - t.clearTo) * t.portal, g.h)).toBeLessThanOrEqual(PEAK);
            expect(peak(move, g.open, (1 - t.openAt) * t.portal, g.h)).toBeLessThanOrEqual(PEAK);
            // Стояние диска прежнее
            expect((t.openAt - t.diskTo) * t.portal).toBeCloseTo(PORTAL_HOLD, 5);
            // Брызги: капля и волна в среднем не быстрее SPEED
            const perSec = screens(t.burstFrom, t.landAt) / t.landSec;
            // Неподвижный кадр перед порталом – не дольше паузы чтения /sites (0,4 экрана) плюс хвост брызг
            expect(screens(t.landAt, t.portalFrom)).toBeLessThanOrEqual(.4 + 1e-6);
            expect(t.burstTo).toBeLessThanOrEqual(t.portalFrom);
            expect(burstLength(g.chips)).toBeGreaterThan(t.landSec);
            expect((g.chip + LIFT) / (perSec * FLIGHT * g.h)).toBeLessThanOrEqual(SPEED + 1e-6);
            expect(g.chipPeak / (perSec * FLIGHT * g.h)).toBeLessThanOrEqual(PEAK + 1e-6);
            expect(g.wave / (perSec * WAVE * g.h)).toBeLessThanOrEqual(SPEED + 1e-6);
            // Порядок: раскрытие → брызги (внахлёст с концом раскрытия) → чипы стоят → портал
            expect(t.burstFrom).toBeGreaterThan(t.expandFrom);
            expect(t.burstFrom).toBeLessThan(t.expandTo);
            expect(t.portalFrom).toBeGreaterThan(t.burstTo);
            expect(t.clearTo).toBeLessThan(t.diskTo);
            expect(t.diskTo).toBeLessThan(t.openAt);
            expect(t.openAt).toBeLessThan(1);
            // Колода после портала: в среднем не быстрее SPEED
            expect(g.deal / (t.after * .7 * g.h)).toBeLessThanOrEqual(SPEED + 1e-6);
        });
    }

    it("окна не короче прежних (на маленьких путях сцена не ускоряется)", () => {
        const t = sceneTiming({ ...DESKTOP_GEOM, photo: 0, inset: 0, chip: 0, chipPeak: 0, wave: 0, grow: 0, open: 0, deal: 0, h: 1e9 });
        expect(t.portalFrom * t.length).toBeGreaterThan(t.burstTo * t.length);
        expect(t.after).toBeCloseTo(.3, 5);
    });
});
