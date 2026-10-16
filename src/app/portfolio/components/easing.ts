// Кривые для анимаций на скролле: вход и выход 0–1

// Быстрый старт, плавное торможение — появление карточек
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

// Плавно в начале и в конце — прокрутка скриншота в рамке
export const easeInOutQuad = (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Прогресс прохода элемента через экран (0–1) → положение его центра относительно центра экрана: 1 ниже, -1 выше
export const passToCenter = (p: number): number => 1 - 2 * p;
