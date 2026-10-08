// Закреплённая история: рамка высотой в экран стоит на месте, а прокрутка страницы
// внутри блока-«дорожки» переключает шаги.
// Каждому шагу отведён отрезок прокрутки: сначала шаг, не влезший в рамку, доезжает до своего конца
// (overflow), потом стоит на месте (hold), потом его сменяет следующий.

export interface IPinnedLayout {
    // Начало отрезка каждого шага, px прокрутки от начала дорожки
    starts: number[];
    // Насколько шаг выше рамки
    overflows: number[];
    // Длина всех отрезков; высота дорожки = высота рамки + total
    total: number;
}

export const pinnedLayout = (heights: number[], stage: number, hold: number): IPinnedLayout => {
    const starts: number[] = [];
    const overflows: number[] = [];
    let start = 0;

    heights.forEach(height => {
        const overflow = Math.max(0, Math.ceil(height - stage));
        starts.push(start);
        overflows.push(overflow);
        start += overflow + hold;
    });

    return { starts, overflows, total: start };
};

// Какой шаг показать и на сколько px сдвинуть его вверх, если дорожка прокручена на `scrolled`
export const pinnedPosition = (layout: IPinnedLayout, scrolled: number): { step: number, offset: number } => {
    if (layout.starts.length === 0) return { step: 0, offset: 0 };

    const s = Math.min(Math.max(scrolled, 0), layout.total);
    let step = 0;
    layout.starts.forEach((start, idx) => {
        if (s >= start) step = idx;
    });

    return { step, offset: Math.min(s - layout.starts[step], layout.overflows[step]) };
};
