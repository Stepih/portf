import { GOALS, Goal } from "@/constants/analytics";
import { contactSectionId, myTg, popupPageURL } from "@/constants/urls";

// Клик по ссылке, как его видит общий слушатель в YandexMetrika: адрес, data-goal и data-goal-id ссылки,
// data-goal-place ближайшего блока и текущая страница
export interface ILinkClick {
    href: string,
    origin: string,
    page: string,
    goal?: string,
    id?: string,
    place?: string
}

const goalIds: readonly string[] = Object.values(GOALS);
const isGoal = (value: string | undefined): value is Goal => value !== undefined && goalIds.includes(value);

// Какую цель отправить. Telegram и форма заявки (/popup или #contact) узнаются по адресу, поэтому кнопкам (в том числе ActionButton
// из design-sync) атрибуты не нужны. Остальные ссылки считаются, только если у них есть data-goal
export const linkGoal = ({ href, origin, page, goal, id, place }: ILinkClick): { goal: Goal, params: Record<string, string> } | null => {
    let target: Goal | undefined = isGoal(goal) ? goal : undefined;

    if (!target) {
        const url = new URL(href, origin);
        if (href.startsWith(myTg)) target = GOALS.tgClick;
        // Форма – страница /popup или блок #contact главной (DESIGN_FIXES_3_PLAN Д13)
        else if (url.origin === origin && (url.pathname === popupPageURL || url.hash === `#${contactSectionId}`)) target = GOALS.ctaClick;
    }
    if (!target) return null;

    return { goal: target, params: { page, ...(place && { place }), ...(id && { id }) } };
}
