// Время сцены первого экрана главной (HeroExpand) – с той же скоростью, что сцены /sites и /ai (владелец 11.11.2026):
// окна движений считаются от их путей в px, durFor (speed.ts) – длительность, за которую объект проходит путь
// со скоростью SPEED (1,55 px на 1 px скролла). Раньше окна были в долях экрана, и на 1400×900 дыра портала
// проходила ~830px радиуса за 180px скролла (до ~18 px/px на старте), фото и капли – 3–4 px/px.
// Чистые функции без framer-motion – их проверяет Vitest (timing.test.ts)

import { durFor, fadeFor, PEAK, riseFor, SLOPE } from "@/app/ai/components/speed";

// Точки сцены в экранах прокрутки: раскрытие с EXPAND_FROM, брызги отраслей стартуют на SHOW_SHARE раскрытия –
// волна заголовка внахлёст с концом полёта фото, а не после него: иначе экран стоит пустым с одним кружком (Д9).
// Окна ниже – нижние границы (прежние значения): на крупных путях их растягивает скорость
export const EXPAND_FROM = .024;
const EXPAND_MIN = .336;
const SHOW_SHARE = (.24 - EXPAND_FROM) / EXPAND_MIN;
const BURST_MIN = .32;
// Чипы стоят, чтобы по ним успели прочитать и кликнуть: от посадки последней капли до портала – STILL экрана,
// как пауза чтения сцен /sites (READ); на телефоне (≤700px) – меньше (Д7). В это время капли ещё стекают и поднимается
// строка «Другая сфера?», так что неподвижный кадр короче. Раньше чипы стояли .33 экрана после всех брызг – с медленными
// брызгами это ~600px скролла без движения перед ростом круга (владелец 11.11.2026: «какое-то время на месте»)
const STILL = .4;
const PHONE_STILL = .3;
// Запас после брызг до чипов на месте
const BURST_TAIL = .05;
// Хвост брызг после посадки последней капли (стекает заливка, поднимается «Другая сфера?») – не длиннее TAIL_MAX экрана:
// там нет полётов, и медленные брызги не должны растягивать неподвижный кадр. Стекание (~200px за половину хвоста) – ~2 px/px
const TAIL_MAX = .25;

// Путь портала в экранах: отрасли гаснут, и опорой кадра остаётся знак «10 проектов» (clear), потом диск растёт
// из кружка вместе со знаком (grow), стоит с ним (PORTAL_HOLD), и в нём открывается дыра до краёв экрана (open).
// Отрасли гаснут до роста диска, а не под ним: диск не закрывает заголовок, пока тот читается (Д37)
const PORTAL_CLEAR = .03;
const PORTAL_GROW = .05;
export const PORTAL_HOLD = .07;
const PORTAL_OPEN = .2;
// Отрасли при гашении поднимаются на столько px
export const CLEAR_LIFT = 24;

// Путь после портала: кейсы ещё прилипают, скролл раздаёт их из колоды (SceneAfterContext). Крайние карты едут
// на DEAL_SHARE этого пути (HomeCasesGrid: dealTo .7)
const AFTER_MIN = .3;
const DEAL_SHARE = .7;

// Брызги, с (их таймлайн в секундах, время берётся из скролла). Капля летит FLIGHT, волна заголовка – WAVE
export const FLIGHT = .7;
export const WAVE = .7;
// Капли вылетают по очереди
export const chipDelay = (i: number) => .2 + i * .04;
// Капля растекается SPREAD, стоит залитой FILLED и стекает DRAIN; строка «Другая сфера?» поднимается OTHER_RISE
export const SPREAD = .15;
export const FILLED = .05;
export const DRAIN = .2;
export const OTHER_FROM = 0;
export const OTHER_RISE = .4;
// Подъём дуги капли над стартом, px
export const LIFT = 48;
// Дуга капли (HeroExpand, chipFrame): подъём на LIFT за первые CHIP_UP полёта (easeOut), падение на место – за остальное
// (drop, speed.ts), по горизонтали – flyEase. Наклоны кривых в самых крутых точках: easeOut на старте – 1 / .58,
// drop – SLOPE, flyEase на старте – .5 / .3, в конце – 0
export const CHIP_UP = .4;
const EASE_SLOPE = 1 / .58;
const FLY_SLOPE = .5 / .3;
// Пик скорости капли в px на долю полёта: старт (вбок и вверх) или посадка (только вниз); dx, dy – от чипа до кружка
export const chipPeak = (dx: number, dy: number) => Math.max(
    Math.hypot(FLY_SLOPE * dx, EASE_SLOPE * LIFT / CHIP_UP),
    SLOPE * (Math.abs(dy) + LIFT) / (1 - CHIP_UP),
);
// Волна: наклон waveEase на старте
const WAVE_SLOPE = .45 / .3;
// Экранов на секунду брызг, чтобы путь px за dur с прошёл в среднем не быстрее SPEED, а в пике (peak – px на долю окна) –
// не быстрее PEAK
const perSecFor = (px: number, peak: number, dur: number, h: number) =>
    Math.max(durFor(px, h), peak / (PEAK * Math.max(1, h))) / dur;

// Длительность брызг, с: до конца последней капли и строки «Другая сфера?»
export const burstLength = (count: number) => {
    const last = chipDelay(Math.max(0, count - 1));
    return last + FLIGHT + Math.max(SPREAD + FILLED + DRAIN, OTHER_FROM + OTHER_RISE);
};

// Пути сцены в px (замер HeroExpand); h – высота липкого экрана
export interface ISceneGeom {
    h: number,
    phone: boolean,
    chips: number,
    // Фото до кружка; самый широкий отступ карточки от края экрана (фон раскрывается до краёв)
    photo: number,
    inset: number,
    // Самая дальняя капля от кружка, самый быстрый кадр капель (chipPeak); радиус волны заголовка
    chip: number,
    chipPeak: number,
    wave: number,
    // Рост диска (радиус и сдвиг внутрь экрана); дыра – до дальнего угла экрана
    grow: number,
    open: number,
    // Путь крайней карты колоды до своего места
    deal: number
}

export interface ISceneTiming {
    // Длина сцены и путь портала, в экранах
    length: number,
    portal: number,
    after: number,
    // Доли пути сцены
    expandFrom: number,
    expandTo: number,
    slidesOut: number,
    burstFrom: number,
    burstTo: number,
    // Последняя капля села: доля пути сцены и время брызг, с. До неё брызги идут скоростью капель, после – хвостом
    landAt: number,
    landSec: number,
    portalFrom: number,
    // Доли пути портала: отрасли погасли, диск дорос, открывается дыра
    clearTo: number,
    diskTo: number,
    openAt: number
}

export const sceneTiming = (g: ISceneGeom): ISceneTiming => {
    const h = g.h;
    const expand = Math.max(EXPAND_MIN, durFor(Math.max(g.photo, g.inset), h));
    // Надпись слайда гаснет сразу – на её месте проступит заголовок сцены
    const slidesOut = Math.max(.13, fadeFor(h));
    const burstFrom = EXPAND_FROM + expand * SHOW_SHARE;
    // Экранов на секунду брызг: капля и волна проходят свои пути не быстрее SPEED в среднем и PEAK в пике
    const total = burstLength(g.chips);
    const perSec = Math.max(BURST_MIN / total, perSecFor(g.chip + LIFT, g.chipPeak, FLIGHT, h), perSecFor(g.wave, g.wave * WAVE_SLOPE, WAVE, h));
    const landSec = chipDelay(Math.max(0, g.chips - 1)) + FLIGHT;
    const landed = burstFrom + perSec * landSec;
    const burst = landed - burstFrom + Math.min(perSec * (total - landSec), TAIL_MAX);
    const portalFrom = Math.max(burstFrom + burst + BURST_TAIL, landed + (g.phone ? PHONE_STILL : STILL));

    const clear = Math.max(PORTAL_CLEAR, fadeFor(h), riseFor(CLEAR_LIFT, h));
    const grow = Math.max(PORTAL_GROW, durFor(g.grow, h));
    const open = Math.max(PORTAL_OPEN, durFor(g.open, h));
    const portal = clear + grow + PORTAL_HOLD + open;
    const length = portalFrom + portal;

    return {
        length,
        portal,
        after: Math.max(AFTER_MIN, durFor(g.deal, h) / DEAL_SHARE),
        expandFrom: EXPAND_FROM / length,
        expandTo: (EXPAND_FROM + expand) / length,
        slidesOut: (EXPAND_FROM + slidesOut) / length,
        burstFrom: burstFrom / length,
        burstTo: (burstFrom + burst) / length,
        landAt: landed / length,
        landSec,
        portalFrom: portalFrom / length,
        clearTo: clear / portal,
        diskTo: (clear + grow) / portal,
        openAt: (clear + grow + PORTAL_HOLD) / portal,
    };
};

// До замера (сервер, первый кадр) – типичный экран, замер 11.11.2026: 1400×900 и телефон 375×812
export const DESKTOP_GEOM: ISceneGeom = { h: 900, phone: false, chips: 6, photo: 10, inset: 356, chip: 444, chipPeak: 685, wave: 494, grow: 102, open: 938, deal: 407 };
export const PHONE_GEOM: ISceneGeom = { h: 812, phone: true, chips: 6, photo: 101, inset: 282, chip: 509, chipPeak: 1031, wave: 265, grow: 71, open: 709, deal: 0 };

export const DESKTOP_DEFAULT = sceneTiming(DESKTOP_GEOM);
export const PHONE_DEFAULT = sceneTiming(PHONE_GEOM);

// Знаки сравнения времени: замер по-новому меняет сцену, только если что-то сдвинулось заметно
export const sameTiming = (a: ISceneTiming, b: ISceneTiming) =>
    (Object.keys(a) as (keyof ISceneTiming)[]).every((k) => Math.abs(a[k] - b[k]) < 1e-3);
