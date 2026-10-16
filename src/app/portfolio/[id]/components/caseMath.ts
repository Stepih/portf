// Чистые расчёты страницы кейса: разбор цифр для счётчика и положение камеры над скриншотом

export interface IMetricParts {
    pre: string,
    num: number,
    suf: string,
    // Знаков после запятой
    dec: number,
    comma: boolean
}

// «+24%» → pre «+», num 24, suf «%». Без числа — null, такое значение показывается как есть
export const parseMetric = (value: string): IMetricParts | null => {
    const m = value.match(/^([^\d]*)(\d+(?:[.,]\d+)?)(.*)$/);
    if (!m) return null;
    const [, pre, digits, suf] = m;
    const frac = digits.split(/[.,]/)[1];
    return { pre, num: parseFloat(digits.replace(',', '.')), suf, dec: frac ? frac.length : 0, comma: digits.includes(',') };
}

// Промежуточное значение счётчика: доля t (0–1) от числа в том же формате
export const formatMetric = (parts: IMetricParts, t: number): string => {
    let n = (parts.num * t).toFixed(parts.dec);
    if (parts.comma) n = n.replace('.', ',');
    return parts.pre + n + parts.suf;
}

// Сдвиг картинки длиной len (px, до приближения) в окне full при приближении zoom,
// чтобы точка c (доля длины) встала в центр окна. Картинка не отъезжает от краёв; если она меньше окна — по центру
export const cameraOffset = (len: number, full: number, c: number, zoom: number): number => {
    const L = len * zoom;
    if (L <= full) return (full - L) / 2;
    return Math.min(0, Math.max(full - L, full / 2 - c * L));
}
