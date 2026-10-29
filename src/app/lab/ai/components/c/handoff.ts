import { motionValue } from "framer-motion";

// Стык ChatWorkScene → AgentDeck. 1 – пустую карточку второй ступени уже рисует AgentDeck (её левая карточка лежит
// под ней точь-в-точь), и ChatWorkScene её прячет. Ставит AgentDeck по своему прогрессу: так смена приходится ровно
// на тот кадр, где левая карточка начинает ехать влево. В лабе одна сцена – хватает одного значения на модуль
export const deckTook = motionValue(0);

// Стык AgentDeck → HowWeWork. В конце сцены AgentDeck рисует на своём экране копию верха HowWeWork (заголовок, линия
// шагов, шарик), а HowWeWork стоит под ней точь-в-точь: его линия – на высоте шара сцены (orbY) в кадре, где липкий
// экран отпускает скролл. Отсюда отрицательный верхний отступ HowWeWork: orbY − h − (высота линии в разделе).
// null – сцены нет (телефон без высоты, низкий экран, «уменьшить движение»): HowWeWork живёт сам по себе
export interface IHowJoin {
    // Центр шара от верха экрана сцены и высота экрана, px
    orbY: number,
    h: number,
    // Десктоп: шаги с телом – из каждого зажжённого шага падает кусок линии, под ним подпись и текст (HowFlow, drop);
    // темы под линией не нужны. Телефон – пока по-старому: подписи сразу, три темы падают ниже
    steps: boolean
}
export const howJoin = motionValue<IHowJoin | null>(null);

// 1 – экран AgentDeck отпустил скролл: дальше верх рисует сам HowWeWork, копия сцены прячется. Ставит AgentDeck по
// скроллу (не по сглаженному прогрессу): с этого кадра оба едут вместе со страницей, и смена не видна
export const howTook = motionValue(0);

// Стык HowWeWork → Monthly (десктоп варианта C): малый шарик с конца линии шагов падает в начало шкалы «Каждый месяц».
// Дорожка линии шагов HowWeWork – от её конца стартует копия шарика; ставит HowWeWork, пока у шагов есть тела (steps)
export const howTrackEl = motionValue<HTMLElement | null>(null);
// 1 – копию шарика рисует Monthly, настоящий в HowWeWork прячется в тот же кадр. Ставит Monthly по своему прогрессу
export const riderLeft = motionValue(0);

// Стык Monthly → Terms (десктоп варианта C): под таблицей «Каждый месяц» прорисовывается нижняя линия, отрывается
// и падает на темы. Ставит MonthlyScene: где низ таблицы, когда экран сцены отпустит скролл (координаты страницы),
// и сам этот скролл (release). null – сцены нет: Terms живёт сам по себе
export interface IMonthlyEnd {
    x: number,
    y: number,
    w: number,
    release: number
}
export const monthlyEnd = motionValue<IMonthlyEnd | null>(null);
