import { describe, expect, it } from "vitest";
import { move, PEAK, rise } from "@/app/ai/components/speed";
import { ASK_GAP, ASK_SHIFT, cardIn, ctaTimes, cardOut, deckTimes, edges, faqTimes, flowTimes, moreTimes, morphLen, padded, payStageAt, payTimes, slideAt, termsTimes, TEXT } from "./times";

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

    // Д41: «Ещё делаю» – колонки прайса, как «Что входит», потом строка во всю ширину и тихая строка
    it("«Ещё делаю»: строка во всю ширину – после последней колонки, её линия не быстрее предела", () => {
        for (const [phone, col, wide, h] of [[false, 327, 1060, 900], [true, 343, 343, 812]] as const) {
            const t = moreTimes([3, 4, 5], phone, col, wide, h);
            const lastCol = t.cols[2];
            expect(t.wide.line[0]).toBeGreaterThan(lastCol.items[lastCol.items.length - 1]);
            expect(peak(move, wide, t.wide.line[1], h)).toBeLessThanOrEqual(PEAK);
            expect(t.quiet).toBeGreaterThan(t.wide.row);
            expect(t.path).toBeGreaterThan(t.quiet + TEXT);
            expect(t.path).toBeGreaterThan(t.wide.line[0] + t.wide.line[1]);
        }
    });

    // Этап 3: FAQ на липком экране – вопросы по одному, путь короче FAQ /ai (~5 экранов)
    it("FAQ: вопрос въезжает не быстрее предела, вопросы по очереди, путь короче 2,3 экрана", () => {
        for (const [w, h] of [[820, 900], [820, 800], [660, 1000]]) {
            const t = faqTimes(9, w, h);
            expect(peak(move, w * ASK_SHIFT, t.ask[0][1], h)).toBeLessThanOrEqual(PEAK);
            // По одному: следующий трогается, когда прошлый прошёл большую часть пути
            for (let i = 1; i < 9; i++) expect(t.ask[i][0] - t.ask[i - 1][0]).toBeGreaterThanOrEqual(Math.min(.1, t.ask[0][1] * ASK_GAP) - 1e-9);
            // Пузырь тает, когда вопрос почти на месте
            expect(t.melt[0][0]).toBeGreaterThan(t.ask[0][0] + t.ask[0][1] * .5);
            expect(t.path).toBeGreaterThan(t.melt[8][0] + t.melt[8][1]);
            expect(t.path).toBeLessThan(2.3);
        }
    });

    // 5б: финал со стыком от FAQ – все движения не быстрее предела, по порядку, на освобождённом месте
    it("финал: линия, шарик и кнопки – не быстрее 2 px/px, по порядку, после ухода FAQ", () => {
        for (const [h, clear] of [[900, 0], [800, 1.2]]) {
            const g = { line: 820, lift: 260, apart: 120, stretch: 70, clearRow: clear, clearTitle: clear + .1 };
            const t = ctaTimes(g, h);
            expect(peak(move, g.line / 2, t.shrink[1], h)).toBeLessThanOrEqual(PEAK);
            expect(peak(move, g.lift, t.lift[1], h)).toBeLessThanOrEqual(PEAK);
            expect(peak(move, g.apart, t.apart[1], h)).toBeLessThanOrEqual(PEAK);
            expect(peak(move, g.stretch, t.stretch[1], h)).toBeLessThanOrEqual(PEAK);
            const end = ([a, d]: number[]) => a + d;
            expect(t.lift[0]).toBeGreaterThanOrEqual(end(t.ball) - 1e-9);
            expect(end(t.lift)).toBeGreaterThanOrEqual(g.clearRow - 1e-9);
            expect(t.title[0]).toBeGreaterThanOrEqual(g.clearTitle - 1e-9);
            expect(t.apart[0]).toBeGreaterThanOrEqual(end(t.grow) - 1e-9);
            expect(t.note[0]).toBeGreaterThanOrEqual(end(t.label) - 1e-9);
            expect(t.path).toBeGreaterThan(end(t.note));
        }
    });
});
