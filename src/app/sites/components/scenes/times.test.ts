import { describe, expect, it } from "vitest";
import { move, PEAK, rise } from "@/app/ai/components/speed";
import { cardIn, cardOut, deckTimes, edges, flowTimes, morphLen, padded, payStageAt, payTimes, slideAt, termsTimes, TEXT } from "./times";

// Пик скорости кривой на окне dur экранов, путь px, экран h: максимум |Δy| / Δскролл
const peak = (curve: (k: number) => number, px: number, dur: number, h: number) => {
    let max = 0;
    const steps = 400;
    for (let i = 0; i < steps; i++) {
        const dy = Math.abs(curve((i + 1) / steps) - curve(i / steps)) * px;
        max = Math.max(max, dy / (dur * h / steps));
    }
    return max;
};

describe("сцены нижней части /sites", () => {
    it("выезд строки (Rise, ~25px) – не быстрее 2 px/px на экране от 400px", () => {
        expect(peak(rise, 25, TEXT, 400)).toBeLessThanOrEqual(PEAK);
    });

    it("колода: стык с окном – карточка едет не быстрее предела, слайды по порядку", () => {
        const h = 800;
        const t = deckTimes(5, false, true, 420, 560, h);
        expect(peak(move, 420, t.split[1], h)).toBeLessThanOrEqual(PEAK);
        expect(peak(move, 560, t.emerge[1], h)).toBeLessThanOrEqual(PEAK);
        // Окно гаснет и отдаёт рамку, пока экран окна ещё держится (запас липкости 0,4)
        expect(t.took).toBeLessThan(.4);
        expect(t.first).toBeGreaterThan(t.took);
        // Строки слайда уходят до того, как въезжают строки следующего
        expect(cardOut(t, 0, 3)![0] + cardOut(t, 0, 3)![1]).toBeLessThanOrEqual(cardIn(t, 1, 0)[0] + .001);
        expect(cardOut(t, 4, 0)).toBeNull();
        expect(slideAt(t, t.first + .1)).toBe(0);
        expect(slideAt(t, t.first + 2 * t.slide + .1)).toBe(2);
        expect(slideAt(t, t.path)).toBe(4);
    });

    it("колода без стыка: карточки проявляются сразу", () => {
        const t = deckTimes(9, true, false, 0, 0, 667);
        expect(t.took).toBe(0);
        expect(t.path).toBeCloseTo(t.first + 9 * t.slide);
    });

    it("путь проекта: шарик проезжает линию не быстрее предела, шаги загораются по порядку", () => {
        const at = [0, .2, .4, .6, .8, 1];
        const t = flowTimes(at, 2, 900, 800);
        expect(peak(move, 900, t.ride[1], 800)).toBeLessThanOrEqual(PEAK);
        expect(t.lit[0]).toBeCloseTo(t.ride[0], 2);
        expect(t.lit[5]).toBeCloseTo(t.ride[0] + t.ride[1], 2);
        for (let i = 1; i < at.length; i++) expect(t.lit[i]).toBeGreaterThan(t.lit[i - 1]);
        expect(t.free[0]).toBeGreaterThan(t.lit[1]);
    });

    it("шкала оплаты: доли – накопленные края, лишние отрезки – у правого края", () => {
        expect(edges([25, 25, 50])).toEqual([.25, .5, 1]);
        expect(padded([50, 50], 3)[2]).toEqual({ left: 1, width: 0 });
        expect(morphLen([50, 50], [25, 25, 50])).toBeCloseTo(.5);
    });

    it("шкала оплаты перестраивается не быстрее предела, этапы по очереди", () => {
        const stages = [[50, 50], [25, 25, 50], [20, 20, 20, 20, 20]];
        const bar = 860;
        const h = 800;
        const t = payTimes(stages, bar, h);
        for (let s = 1; s < stages.length; s++) {
            expect(peak(move, morphLen(stages[s - 1], stages[s]) * bar, t.stages[s].morph[1], h)).toBeLessThanOrEqual(PEAK);
        }
        expect(payStageAt(t, 0)).toBe(0);
        expect(payStageAt(t, t.stages[1].at + .01)).toBe(1);
        expect(payStageAt(t, t.refund)).toBe(2);
        expect(t.path).toBeGreaterThan(t.refund);
    });

    it("три колонки: на телефоне сменяют друг друга, на компьютере идут каскадом", () => {
        const desk = termsTimes([6, 6, 5], false, 340, 800);
        expect(desk.cols.every((c) => c.out === null)).toBe(true);
        expect(desk.cols[1].line[0]).toBeGreaterThan(desk.cols[0].line[0]);
        const phone = termsTimes([6, 6, 5], true, 343, 667);
        expect(phone.cols[2].out).toBeNull();
        expect(phone.cols[1].line[0]).toBeGreaterThan(phone.cols[0].out![0] + phone.cols[0].out![1]);
    });
});
