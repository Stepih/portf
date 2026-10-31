import { describe, expect, it } from "vitest";
import { FADE, INTRO, IKindRows, KINDS, Kind, kindAt, mockP, planFor, stateAt } from "./timeline";

// Сцена «окно-герой» /sites (SERVICES_PLAN У5б): время видов, фазы и строки под окном
const rows: Record<Kind, IKindRows> = {
    landing: { groups: [0, 1, 2, 3], steps: 4, pills: 5, terms: 0 },
    corporate: { groups: [0, 1, 2], steps: 3, pills: 5, terms: 3 },
    shop: { groups: [0, 1, 2, 3, 4, 5], steps: 5, pills: 3, terms: 0 },
};

describe("timeline окна-героя", () => {
    it("виды идут подряд после первого экрана, ~2–3 экрана на вид, на телефоне короче", () => {
        for (const phone of [false, true]) {
            const plan = planFor(phone);
            expect(plan.kinds.map((k) => k.kind)).toEqual(KINDS);
            expect(plan.kinds[0].from).toBe(INTRO);
            plan.kinds.forEach((k, i) => {
                expect(k.from < k.built && k.built < k.priced && k.priced < k.to).toBe(true);
                if (i > 0) expect(k.from).toBe(plan.kinds[i - 1].to);
                expect(k.to - k.from).toBeGreaterThanOrEqual(2);
                expect(k.to - k.from).toBeLessThanOrEqual(3);
            });
            expect(plan.total).toBe(plan.kinds[2].to);
        }
        expect(planFor(true).total).toBeLessThan(planFor(false).total);
    });

    it("сборка: окно пустое в начале вида и собрано к концу сборки", () => {
        const k = planFor(false).kinds[1];
        expect(mockP(k, k.from)).toBeCloseTo(-.1);
        expect(mockP(k, k.built)).toBe(1);
        expect(mockP(k, k.to)).toBe(1);
    });

    it("вкладка следующего вида загорается за FADE до его начала", () => {
        const plan = planFor(false);
        const corp = plan.kinds[1];
        expect(kindAt(plan, corp.from - FADE - .01).kind).toBe('landing');
        expect(kindAt(plan, corp.from - FADE + .01).kind).toBe('corporate');
        expect(kindAt(plan, 0).kind).toBe('landing');
        expect(kindAt(plan, plan.total + 1).kind).toBe('shop');
    });

    it("фазы: первый экран → состав → опции → цена; под окном одна строка", () => {
        const plan = planFor(false);
        expect(stateAt(plan, rows, 0).phase).toBe('wait');
        for (const k of plan.kinds) {
            const r = rows[k.kind];
            expect(stateAt(plan, rows, k.from + .01)).toMatchObject({ kind: k.kind, phase: 'build', row: 0 });
            expect(stateAt(plan, rows, k.built - .01)).toMatchObject({ phase: 'build', row: r.groups.length - 1 });
            expect(stateAt(plan, rows, k.built + .001)).toMatchObject({ phase: 'options', row: 1 });
            // Все таблетки и слагаемые стоят до конца опций
            const end = stateAt(plan, rows, k.priced - .01);
            expect(end.row).toBe(r.pills);
            expect(end.term).toBe(r.terms ? r.terms + 1 : 0);
            expect(stateAt(plan, rows, k.priced + .01)).toMatchObject({ phase: 'price', row: r.pills });
        }
    });
});
