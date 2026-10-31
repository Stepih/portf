// Время сцены «окно-герой» /sites (SERVICES_PLAN У5б, этап 1). Одна липкая сцена на три вида сайта: первый экран →
// лендинг → сайт компании → магазин. Время – в экранах скролла от начала сцены (t), путь сцены – total экранов.
// У каждого вида три фазы: сборка в окне (build), опции таблетками (options), цена (price). Чистые функции без
// framer-motion – их проверяет Vitest (timeline.test.ts)

import { clamp01 } from "@/app/ai/components/speed";

export type Kind = 'landing' | 'corporate' | 'shop';
export const KINDS: Kind[] = ['landing', 'corporate', 'shop'];
// wait – окно ещё не начало собирать вид: первый экран или смена вида, под окном пусто
export type Phase = 'wait' | 'build' | 'options' | 'price';

// Первый экран: заголовок уходит вверх, пустое окно встаёт по центру (путь ~400px – около 1 px/px)
export const INTRO = .5;
// Смена вида: собранный сайт гаснет за FADE до начала следующего, вкладка переключается в тот же момент
export const FADE = .15;
// Якорь вида (/sites#shop) – чуть позже начала вида: скролл к метке округляется, а сцена должна уже показать вид
export const ANCHOR_AFTER = .04;
// Сборка в окне: прогресс макета p (Mocks.tsx) идёт от FROM_P (пусто) до 1. Первый шаг встаёт при p ∈ [−0,1; 0]
export const FROM_P = -.1;

// Длины фаз в экранах [сборка, опции, цена]. ~2,5 экрана на вид, на телефоне короче. У магазина сборка длиннее:
// пять шагов и самые длинные проезды (каталог, оформление) – при 1,7 экрана их пик не выше 2 px/px (speed.ts).
// У сайта компании опции дольше: таблетки, потом счётчик суммы
const LENGTHS: Record<'desktop' | 'phone', Record<Kind, [number, number, number]>> = {
    desktop: { landing: [1.2, .6, .65], corporate: [1.1, .9, .65], shop: [1.7, .5, .65] },
    phone: { landing: [1, .5, .55], corporate: [.95, .8, .55], shop: [1.4, .45, .55] },
};

export interface IKindPlan {
    kind: Kind,
    // Начало вида (сюда ведёт якорь /sites#kind), конец сборки, конец опций, конец вида
    from: number,
    built: number,
    priced: number,
    to: number
}

export interface IPlan {
    kinds: IKindPlan[],
    total: number
}

export const planFor = (phone: boolean): IPlan => {
    let at = INTRO;
    const kinds = KINDS.map((kind) => {
        const [b, o, p] = LENGTHS[phone ? 'phone' : 'desktop'][kind];
        const plan = { kind, from: at, built: at + b, priced: at + b + o, to: at + b + o + p };
        at = plan.to;
        return plan;
    });
    return { kinds, total: at };
};

// Прогресс макета вида: FROM_P в начале вида, 1 – в конце сборки
export const mockP = (k: IKindPlan, t: number) => FROM_P + (1 - FROM_P) * clamp01((t - k.from) / (k.built - k.from));

// Вид, который сейчас в окне: следующий забирает окно за FADE до своего начала
export const kindAt = (plan: IPlan, t: number): IKindPlan =>
    [...plan.kinds].reverse().find((k, i) => i === plan.kinds.length - 1 || t >= k.from - FADE) ?? plan.kinds[0];

// Доля опций, за которую встают таблетки; у сайта компании за ними – счётчик суммы
export const PILLS_SHARE = .8;
export const PILLS_SHARE_SUM = .4;

// Когда встаёт таблетка i из n (sum – у вида есть счётчик)
export const pillAt = (k: IKindPlan, i: number, n: number, sum: boolean) =>
    k.built + (k.priced - k.built) * (sum ? PILLS_SHARE_SUM : PILLS_SHARE) * i / Math.max(1, n);

// Когда встаёт слагаемое j счётчика (j = число слагаемых – итог)
export const termAt = (k: IKindPlan, j: number, terms: number) =>
    k.built + (k.priced - k.built) * (PILLS_SHARE_SUM + .5 * j / (terms + 1));

export interface IKindRows {
    // Шаги окна, на которых открываются группы состава (callouts[].at), и число шагов
    groups: number[],
    steps: number,
    pills: number,
    // Слагаемых счётчика (0 – счётчика нет)
    terms: number
}

export interface IState {
    kind: Kind,
    phase: Phase,
    // Сборка – текущая группа состава; опции – сколько таблеток стоит; цена – 0
    row: number,
    // Сколько слагаемых счётчика видно (terms + 1 – и итог)
    term: number
}

// Шаг i из n начинается в stepAt(i, n) – как в Mocks.tsx (там же STEP)
const STEP = .1;
const stepAt = (i: number, n: number) => -STEP + i * .8 / n;

export const stateAt = (plan: IPlan, rows: Record<Kind, IKindRows>, t: number): IState => {
    const k = kindAt(plan, t);
    const r = rows[k.kind];
    const sum = r.terms > 0;
    if (t < k.from) return { kind: k.kind, phase: 'wait', row: 0, term: 0 };
    if (t < k.built) {
        const p = mockP(k, t);
        let row = 0;
        r.groups.forEach((at, i) => { if (p >= stepAt(at, r.steps)) row = i; });
        return { kind: k.kind, phase: 'build', row, term: 0 };
    }
    let pills = 0;
    for (let i = 0; i < r.pills; i++) if (t >= pillAt(k, i, r.pills, sum)) pills = i + 1;
    let term = 0;
    for (let j = 0; j <= r.terms && sum; j++) if (t >= termAt(k, j, r.terms)) term = j + 1;
    if (t < k.priced) return { kind: k.kind, phase: 'options', row: pills, term };
    return { kind: k.kind, phase: 'price', row: r.pills, term: sum ? r.terms + 1 : 0 };
};
