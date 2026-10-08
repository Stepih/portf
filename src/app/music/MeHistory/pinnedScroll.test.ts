import { describe, expect, it } from 'vitest';
import { pinnedLayout, pinnedPosition } from './pinnedScroll';

describe('pinnedLayout', () => {
    it('шаг, влезший в рамку, получает только hold', () => {
        expect(pinnedLayout([300, 400], 500, 200)).toEqual({ starts: [0, 200], overflows: [0, 0], total: 400 });
    });

    it('высокий шаг получает ещё и свой overflow', () => {
        expect(pinnedLayout([1300, 400, 200], 500, 200)).toEqual({ starts: [0, 1000, 1200], overflows: [800, 0, 0], total: 1400 });
    });
});

describe('pinnedPosition', () => {
    const layout = pinnedLayout([1300, 400, 200], 500, 200);

    it('до дорожки — первый шаг без сдвига', () => {
        expect(pinnedPosition(layout, -300)).toEqual({ step: 0, offset: 0 });
    });

    it('высокий шаг сначала доезжает до конца, потом стоит', () => {
        expect(pinnedPosition(layout, 500)).toEqual({ step: 0, offset: 500 });
        expect(pinnedPosition(layout, 900)).toEqual({ step: 0, offset: 800 });
    });

    it('на границе отрезка начинается следующий шаг', () => {
        expect(pinnedPosition(layout, 1000)).toEqual({ step: 1, offset: 0 });
        expect(pinnedPosition(layout, 1250)).toEqual({ step: 2, offset: 0 });
    });

    it('после дорожки остаётся последний шаг', () => {
        expect(pinnedPosition(layout, 5000)).toEqual({ step: 2, offset: 0 });
    });

    it('без шагов — нулевой шаг', () => {
        expect(pinnedPosition(pinnedLayout([], 500, 200), 100)).toEqual({ step: 0, offset: 0 });
    });
});
