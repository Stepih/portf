// Единая скорость сцен /ai (SERVICES_PLAN У4, владелец 29.10.2026): каждое движение плавное и одинаково быстрое –
// один прокрут даёт одно и то же число пикселей движения во всех сценах. Цель – 1,5–2 px движения на 1 px скролла,
// и в среднем, и в пике. Окна анимаций считаются от пути объекта: durFor(путь) – длительность в экранах скролла,
// движение – по кривым с ограниченным наклоном (move, drop): пик = SPEED × наклон ≤ 2.
// Чистые функции без framer-motion – их проверяет Vitest (speed.test.ts)

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Px движения на px скролла на равномерном участке кривой – это же и средняя скорость окна durFor
export const SPEED = 1.55;
// Самый крутой наклон кривых перемещения (move, drop): пик скорости – SPEED × SLOPE
// (с запасом: замер даёт до ~25% сверху – сглаживание пружиной и шаг замера)
export const SLOPE = 1 / .9;
// Предел пика (владелец)
export const PEAK = 2;

// Перемещение: разгон и торможение по синусу на RAMP доли окна, середина – равномерно. Наклон середины 1 / (1 − RAMP)
const RAMP = .1;
export const move = (k: number): number => {
    const t = clamp01(k);
    if (t > .5) return 1 - move(1 - t);
    if (t < RAMP) return SLOPE * (t / 2 - RAMP / (2 * Math.PI) * Math.sin(Math.PI * t / RAMP));
    return SLOPE * (t - RAMP / 2);
};

// Падение: разгон по синусу на первых FALL_RAMP окна, дальше – равномерно до посадки (без торможения: удар о линию,
// отскок рисует сцена). Тот же наклон SLOPE
const FALL_RAMP = .2;
export const drop = (k: number): number => {
    const t = clamp01(k);
    if (t < FALL_RAMP) return SLOPE * (t / 2 - FALL_RAMP / (2 * Math.PI) * Math.sin(Math.PI * t / FALL_RAMP));
    return SLOPE * (t - FALL_RAMP / 2);
};

// Короткое появление (строка из-под маски, сдвиг до ~40px): плавный выезд с торможением, наклон в начале π/2.
// Пик ≤ 2, если окно не короче riseFor(путь)
export const RISE_SLOPE = Math.PI / 2;
export const rise = (k: number): number => Math.sin(Math.PI / 2 * clamp01(k));

// Длительность в экранах скролла (h – высота экрана, px), за которую объект проходит px со скоростью SPEED
export const durFor = (px: number, h: number): number => Math.abs(px) / (SPEED * Math.max(1, h));
// Окно короткого появления: пик rise не выше PEAK
export const riseFor = (px: number, h: number): number => Math.abs(px) * RISE_SLOPE / (PEAK * Math.max(1, h));
// Проявление (прозрачность) – не короче FADE_MIN_PX скролла: не вспыхивает за щелчок колеса
export const FADE_MIN_PX = 80;
export const fadeFor = (h: number): number => FADE_MIN_PX / Math.max(1, h);
