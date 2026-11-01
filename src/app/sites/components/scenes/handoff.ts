import { motionValue } from "framer-motion";

// Стык сцены окна (WindowScene) с колодой кейсов (CasesDeck) – как ChatWorkScene → AgentDeck на /ai (там handoff.ts).
// Липкий экран колоды ложится поверх последнего экрана окна (запас липкости --hold), оба неподвижны. В окне гаснет
// собранный магазин и строка с ценой – остаётся пустая рамка; под ней колода уже держит такую же пустую карточку,
// и рамку окна сменяет она. Карточка едет на своё место, из-под неё выезжает вторая – дальше слайды кейсов.

// Окно и его липкий экран: по ним колода кладёт карточку точь-в-точь. Ставит WindowScene, пока сцена есть (без
// движения – null, колода входит сама)
export interface IWindowEls {
    win: HTMLElement,
    screen: HTMLElement
}
export const windowEls = motionValue<IWindowEls | null>(null);

// 0–1: содержимое окна и строка под ним гаснут. Ставит колода по своему времени
export const windowFade = motionValue(0);
// 1 – пустую рамку уже рисует колода, WindowScene прячет окно. Ставит колода
export const windowTook = motionValue(0);
