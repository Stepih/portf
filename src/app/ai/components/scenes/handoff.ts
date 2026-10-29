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
    // Шаги с телом – из каждого зажжённого шага падает кусок линии, под ним подпись и текст (HowFlow, drop); темы под
    // линией не нужны. И на десктопе, и на телефоне (владелец 29.10.2026: «да, как на десктопе»)
    steps: boolean,
    // Десктоп: шарик с конца линии падает в шкалу «Каждый месяц» (MonthlyScene). На телефоне сцены Monthly нет
    monthly: boolean
}
export const howJoin = motionValue<IHowJoin | null>(null);

// 1 – экран AgentDeck отпустил скролл: дальше верх рисует сам HowWeWork, копия сцены прячется. Ставит AgentDeck по
// скроллу (не по сглаженному прогрессу): с этого кадра оба едут вместе со страницей, и смена не видна
export const howTook = motionValue(0);

// Стык HowWeWork → Monthly (десктоп варианта C): малый шарик с конца линии шагов падает в начало шкалы «Каждый месяц».
// Дорожка линии шагов HowWeWork – от её конца стартует копия шарика; ставит HowWeWork, пока есть стык (monthly)
export const howTrackEl = motionValue<HTMLElement | null>(null);
// 1 – копию шарика рисует Monthly, настоящий в HowWeWork прячется в тот же кадр. Ставит Monthly по своему прогрессу
export const riderLeft = motionValue(0);

// Стык Monthly → Terms (десктоп варианта C), на одном неподвижном экране: экран «Каждый месяц» держится ещё
// termsPath экранов скролла, а липкий экран TermsScene лежит поверх него точь-в-точь. Линия под шапкой таблицы
// чернеет, отрывается и падает на темы, стирая над собой таблицу и пояснения; на её месте собирается «Что входит».
// Отпускают скролл оба экрана вместе. Путь считает TermsScene от путей своих движений (единая скорость, speed.ts);
// читают MonthlyScene и TermsScene – для длины сцены
export const termsPath = motionValue(2);
// Ставит MonthlyScene: линия под шапкой, таблица с пояснениями (wide, низ – bottom) в последнем кадре, от верха экрана.
// null – сцены нет: Terms живёт сам по себе
export interface IMonthlyEnd {
    x: number,
    y: number,
    w: number,
    wide: { x: number, w: number },
    bottom: number
}
export const monthlyEnd = motionValue<IMonthlyEnd | null>(null);
// Где сейчас падающая линия (от верха экрана): MonthlyScene обрезает над ней таблицу и прячет свою линию.
// −1 – линия на месте. Ставит Terms по своему времени
export const monthlyWipe = motionValue(-1);
// 0–1: заголовок «Каждый месяц» гаснет, когда выезжает заголовок «Что входит». Ставит Terms
export const monthlyGone = motionValue(0);

// Стык Terms → FAQ (десктоп варианта C), тем же приёмом: экраны «Каждый месяц» и «Что входит» держатся ещё faqPath,
// поверх ложится липкий экран FaqScene. Шарик, доехавший до конца сетки тем, спускается под неё и тянет чернильную
// линию; линия поднимается и стирает темы снизу вверх, на её месте агент отвечает на вопросы в аккордеоне.
// Путь считает FaqScene; читают MonthlyScene, TermsScene и FaqScene
export const faqPath = motionValue(3);
// Ставит TermsScene: где погас бы шарик и края сетки в последнем кадре, от левого верха экрана. null – сцены нет
export interface ITermsEnd {
    ball: { x: number, y: number },
    left: number,
    right: number,
    bottom: number
}
export const termsEnd = motionValue<ITermsEnd | null>(null);
// Где сейчас поднимающаяся линия (от верха экрана): TermsScene обрезает под ней свой экран. −1 – стирания нет.
// Ставит FaqScene по своему времени
export const termsWipe = motionValue(-1);
// 0–1: заголовок «Что входит» гаснет, когда выезжает заголовок FAQ. Ставит FaqScene
export const termsGone = motionValue(0);
// 1 – шарик рисует FaqScene, в TermsScene он прячется (и на конце ряда не гаснет, пока сцена FAQ есть)
export const termsBallTook = motionValue(0);
export const faqOn = motionValue(false);

// Стык FAQ → финал (десктоп варианта C): настоящий FAQ уезжает вверх как обычно, а липкий экран финала ложится поверх
// его низа. В кадре, где экран встал, нижняя линия списка отрывается и остаётся на экране: чернеет, стягивается
// в шарик, шарик поднимается к ряду кнопок и растёт в шар финала – дальше прежняя анимация FinalCta, но по скроллу.
// Список настоящего FAQ (от его низа отрывается линия); ставит AiFaq, пока сцена FaqScene есть
export const faqListEl = motionValue<HTMLElement | null>(null);
// 1 – линию рисует CtaScene, у списка нижняя рамка прячется. Ставит CtaScene по скроллу
export const faqLineTook = motionValue(0);
// Скролл, на котором экраны FAQ отпускают скролл (там же встаёт экран финала). Ставит FaqScene
export const faqRelease = motionValue(0);
