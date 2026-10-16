import { describe, expect, it } from "vitest";

import { cameraOffset, formatMetric, parseMetric } from "./caseMath";

describe('parseMetric', () => {
    it('разбирает префикс, число и суффикс', () => {
        expect(parseMetric('+24%')).toEqual({ pre: '+', num: 24, suf: '%', dec: 0, comma: false });
        expect(parseMetric('3 клика')).toEqual({ pre: '', num: 3, suf: ' клика', dec: 0, comma: false });
        expect(parseMetric('×2')).toEqual({ pre: '×', num: 2, suf: '', dec: 0, comma: false });
    });

    it('помнит дробную часть и запятую', () => {
        expect(parseMetric('1,8 с')).toEqual({ pre: '', num: 1.8, suf: ' с', dec: 1, comma: true });
    });

    it('без числа возвращает null', () => {
        expect(parseMetric('много')).toBeNull();
    });
});

describe('formatMetric', () => {
    it('показывает долю числа в исходном формате', () => {
        const parts = parseMetric('1,8 с')!;
        expect(formatMetric(parts, 0)).toBe('0,0 с');
        expect(formatMetric(parts, 0.5)).toBe('0,9 с');
        expect(formatMetric(parts, 1)).toBe('1,8 с');
        expect(formatMetric(parseMetric('−35%')!, 1)).toBe('−35%');
    });
});

describe('cameraOffset', () => {
    it('картинку меньше окна ставит по центру', () => {
        expect(cameraOffset(100, 200, 0.9, 1)).toBe(50);
    });

    it('центрирует точку, не выходя за края', () => {
        // 1000px в окне 400: точка 0.5 → центр
        expect(cameraOffset(1000, 400, 0.5, 1)).toBe(-300);
        // точка у верхнего края — картинка прижата к верху
        expect(cameraOffset(1000, 400, 0, 1)).toBe(0);
        // точка у нижнего края — прижата к низу
        expect(cameraOffset(1000, 400, 1, 1)).toBe(-600);
        // с приближением длина растёт
        expect(cameraOffset(1000, 400, 0.5, 2)).toBe(-800);
    });
});
