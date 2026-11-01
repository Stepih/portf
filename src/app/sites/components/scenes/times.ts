// Время сцен нижней части /sites (SERVICES_PLAN У5б, этап 2): кейсы, путь проекта, оплата, «Что входит», «Ещё делаю».
// Время – в экранах скролла от кадра, где липкий экран сцены встал. Окна движений – от их путей (единая скорость /ai,
// speed.ts: durFor – длительность, за которую объект проходит путь со скоростью SPEED; пик кривой move – SPEED × SLOPE
// ≤ 2 px/px). Короткие выезды строк (Rise, ~25px) – окном TEXT, его пик ниже 2 на любом экране выше 400px.
// Чистые функции без framer-motion – их проверяет Vitest (times.test.ts)

import { durFor, fadeFor, move } from "@/app/ai/components/speed";

// Окно [начало, длительность]
export type W = [number, number];
export const end = ([a, d]: W) => a + d;

// Выезд строки из-под маски (Rise) и шаг между соседними строками
export const TEXT = .14;
export const STAGGER = .04;
// Пауза чтения в конце сцены, пока экран ещё держится
export const READ = .4;

// ---------- Кейсы колодой ----------
// Слайд – время чтения пары карточек; на телефоне карточка одна и слайд короче
export const SLIDE = { desktop: .75, phone: .5 };
export interface IDeckTimes {
    // Стык с окном: содержимое окна гаснет (fade), рамку сменяет карточка (took)
    fade: W,
    took: number,
    // Карточка едет с места окна на своё (split), вторая выезжает из-под неё (emerge); без стыка – проявляются (show)
    split: W,
    emerge: W,
    show: W,
    head: number,
    // Первый слайд въезжает, длина слайда, слайдов
    first: number,
    slide: number,
    slides: number,
    path: number
}

// joined – есть стык с окном; split / emerge – пути левой и правой карточек от окна до своих мест в px, h – высота экрана
export const deckTimes = (slides: number, phone: boolean, joined: boolean, split: number, emerge: number, h: number): IDeckTimes => {
    const fade = fadeFor(h);
    const slide = phone ? SLIDE.phone : SLIDE.desktop;
    if (!joined) {
        const show: W = [0, fade * 1.5];
        const first = end(show) + .02;
        return { fade: [0, 0], took: 0, split: [0, 0], emerge: [0, 0], show, head: .02, first, slide, slides, path: first + slides * slide };
    }
    // Окно гаснет в первые 0,1 экрана: экран колоды встал ровно в конце сцены окна, его запас липкости – 0,4 экрана
    const fadeW: W = [0, Math.max(fade, .1)];
    const took = end(fadeW) + .01;
    // Карточки трогаются, когда под стеклом левой проступил цвет страницы (0,04 – CasesDeck, solid)
    const splitW: W = [took + .05, Math.max(fade, durFor(split, h))];
    // Вторая карточка – своим путём с места окна на своё, из-под первой: скорость каждой – в пределе
    const emergeW: W = [splitW[0], Math.max(fade, durFor(emerge, h))];
    const first = Math.max(end(splitW), end(emergeW)) + .02;
    // Заголовок – когда карточка уже ушла с места окна и не перекрывает его
    return { fade: fadeW, took, split: splitW, emerge: emergeW, show: [0, 0], head: end(splitW) - .02, first, slide, slides, path: first + slides * slide };
};

// Строка r карточки слайда j: въезжает в начале слайда, уходит вверх в конце (у последнего слайда – остаётся)
export const cardIn = (t: IDeckTimes, j: number, r: number): W => [t.first + j * t.slide - (j ? .06 : 0) + r * .03, TEXT];
export const cardOut = (t: IDeckTimes, j: number, r: number): W | null =>
    j >= t.slides - 1 ? null : [t.first + (j + 1) * t.slide - .2 + r * .02, .08];
// Слайд, который сейчас на экране
export const slideAt = (t: IDeckTimes, v: number) => Math.max(0, Math.min(t.slides - 1, Math.floor((v - t.first + .08) / t.slide)));

// ---------- Как идёт проект ----------
export interface IFlowTimes {
    head: number,
    base: W,
    // Шарик проезжает линию; шаг i загорается, когда шарик до него доехал
    ride: W,
    lit: number[],
    // Скобка «0 ₽» над бесплатными шагами – когда загорелся последний из них
    free: W,
    path: number
}

// at – где на линии кружки шагов, доли 0–1 (на вертикальной линии шаги разной высоты); track – длина линии, px
export const flowTimes = (at: number[], freeSteps: number, track: number, h: number): IFlowTimes => {
    const steps = at.length;
    const fade = fadeFor(h);
    const base: W = [.08, Math.max(fade, durFor(track, h) * .5)];
    const ride: W = [end(base) + .02, Math.max(fade, durFor(track, h))];
    // Шарик едет по move: момент, когда он у кружка, – обратная к кривой (поиск по сетке)
    const lit = at.map((f) => {
        let lo = 0;
        let hi = 1;
        for (let n = 0; n < 30; n++) {
            const mid = (lo + hi) / 2;
            if (move(mid) < f) lo = mid;
            else hi = mid;
        }
        return ride[0] + ride[1] * hi;
    });
    const free: W = [lit[Math.max(0, freeSteps - 1)] + .04, fade * 1.5];
    return { head: 0, base, ride, lit, free, path: lit[steps - 1] + .1 + TEXT + READ };
};

// ---------- Оплата: одна шкала ----------
// Доли этапов шкалы: шкала перестраивается от одного к другому. Границы долей – накопленные суммы, 0–1
export const edges = (shares: number[]): number[] => {
    const total = shares.reduce((a, b) => a + b, 0) || 1;
    let at = 0;
    return shares.map((share) => {
        at += share / total;
        return at;
    });
};

// Отрезки шкалы этапа, дополненные до n: лишние – нулевой ширины у правого края (из них растут новые доли)
export const padded = (shares: number[], n: number): { left: number, width: number }[] => {
    const e = edges(shares);
    return Array.from({ length: n }, (_, i) => i < shares.length
        ? { left: i ? e[i - 1] : 0, width: e[i] - (i ? e[i - 1] : 0) }
        : { left: 1, width: 0 });
};

// Самый дальний сдвиг края отрезка при перестройке, в долях шкалы
export const morphLen = (from: number[], to: number[]): number => {
    const n = Math.max(from.length, to.length);
    const a = padded(from, n);
    const b = padded(to, n);
    return Math.max(...a.map((s, i) => Math.max(Math.abs(s.left - b[i].left), Math.abs(s.left + s.width - b[i].left - b[i].width))));
};

export interface IPayTimes {
    head: number,
    // Шкала прорисовывается слева направо
    draw: W,
    // Этап s: подпись суммы и доли встают в at, шкала перестраивается к нему в morph (у первого – draw)
    stages: { at: number, morph: W }[],
    refund: number,
    path: number
}

// Пауза чтения этапа
export const HOLD = .6;

export const payTimes = (stages: number[][], bar: number, h: number): IPayTimes => {
    const fade = fadeFor(h);
    const draw: W = [.1, Math.max(fade, durFor(bar, h))];
    const list: IPayTimes['stages'] = [];
    let at = draw[0] + draw[1] * .4;
    stages.forEach((shares, s) => {
        if (!s) {
            list.push({ at, morph: draw });
            return;
        }
        const morph: W = [at + HOLD, Math.max(fade, durFor(morphLen(stages[s - 1], shares) * bar, h))];
        at = morph[0] + morph[1] * .3;
        list.push({ at, morph });
    });
    const refund = at + HOLD;
    return { head: 0, draw, stages: list, refund, path: refund + TEXT + READ };
};

// Какой этап шкалы сейчас (подписи), и где он в перестройке: k – доля пути к этапу s
export const payStageAt = (t: IPayTimes, v: number): number => {
    let s = 0;
    t.stages.forEach((st, i) => { if (v >= st.at) s = i; });
    return s;
};

// ---------- Три колонки ----------
export interface ITermsTimes {
    head: number,
    // Колонка c: линия над ней прорисовывается, заголовок и пункты выезжают; на телефоне колонки сменяют друг друга (out)
    cols: { line: W, title: number, items: number[], out: W | null }[],
    path: number
}

export const termsTimes = (counts: number[], phone: boolean, col: number, h: number): ITermsTimes => {
    const fade = fadeFor(h);
    let at = .14;
    const cols = counts.map((count, c) => {
        const line: W = [at, Math.max(fade, durFor(col, h))];
        const title = line[0] + .04;
        const items = Array.from({ length: count }, (_, j) => title + .06 + j * STAGGER);
        const shown = items[count - 1] + TEXT;
        const last = c === counts.length - 1;
        // Телефон: колонка дочитывается и уходит, следующая встаёт на её место
        const out: W | null = phone && !last ? [shown + HOLD, .1] : null;
        at = phone ? (out ? end(out) + .02 : at) : at + .2;
        return { line, title, items, out };
    });
    const lastCol = cols[cols.length - 1];
    return { head: 0, cols, path: lastCol.items[lastCol.items.length - 1] + TEXT + READ };
};

// ---------- Ещё делаю ----------
export interface IMoreTimes {
    head: number,
    pills: number[],
    quiet: number,
    path: number
}

export const moreTimes = (pills: number): IMoreTimes => {
    const list = Array.from({ length: pills }, (_, i) => .12 + i * .06);
    const quiet = list[pills - 1] + .12;
    return { head: 0, pills: list, quiet, path: quiet + TEXT + READ };
};

// ---------- FAQ (этап 3) ----------
// Вопрос приходит, как реплика клиента в чате (как FAQ на /ai): пузырь въезжает справа на ASK_SHIFT ширины списка
// с наклоном, распрямляется и тает в строку. Вопросы – по одному: следующий трогается, когда прошлый прошёл ASK_GAP
// своего пути (наклонённые пузыри не наезжают друг на друга)
export const ASK_SHIFT = .3;
export const ASK_GAP = .85;
export interface IFaqTimes {
    head: number,
    // Въезд вопроса i и таяние его пузыря
    ask: W[],
    melt: W[],
    path: number
}

// w – ширина списка, px; h – высота экрана
export const faqTimes = (count: number, w: number, h: number): IFaqTimes => {
    const fade = fadeFor(h);
    const dur = Math.max(fade, durFor(w * ASK_SHIFT, h));
    const step = Math.max(.1, dur * ASK_GAP);
    const ask = Array.from({ length: count }, (_, i): W => [.12 + i * step, dur]);
    const melt = ask.map(([a, d]): W => [a + d * .8, fade]);
    return { head: 0, ask, melt, path: end(melt[count - 1]) + READ };
};
