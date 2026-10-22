import { services } from "@/data/offer";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { INDUSTRY_PARAM } from "./portfolioIndustry";
import { CASE_PARAM, SERVICE_PARAM } from "./services";

// Откуда пришёл клиент (SALES_PLAN 4.8): услуга, кейс или отрасль из ссылки «Обсудить» на форму.
// Форма их не показывает, а отправляет вместе с заявкой; владелец видит их в Telegram
const LEAD_SOURCE_PARAMS = [SERVICE_PARAM, CASE_PARAM, INDUSTRY_PARAM] as const;

// Заявка из окна демо-чата (CONVERSION_PLAN К3.2): поле from в теле запроса, в адресе его нет
export const LEAD_FROM_FIELD = 'from';
export const LEAD_FROM_CHAT = 'chat';

export type LeadSource = Partial<Record<typeof LEAD_SOURCE_PARAMS[number], string>>;

// Параметры из адреса страницы с формой; пустые и чужие не попадают
export const leadSourceFromSearch = (search: string): LeadSource => {
    const params = new URLSearchParams(search);
    return Object.fromEntries(
        LEAD_SOURCE_PARAMS.flatMap((key) => {
            const value = params.get(key);
            return value ? [[key, value]] : [];
        })
    );
}

// Строки для сообщения в Telegram. Берутся только известные id и метка чата: в заявку не попадёт произвольный текст из ссылки
export const leadSourceLines = (body: Record<string, unknown>): string[] => {
    const service = services.find((item) => item.id === body[SERVICE_PARAM]);
    const work = portfolioWorks.find((item) => item.id === body[CASE_PARAM]);
    const industry = portfolioIndustries.find((item) => item.id === body[INDUSTRY_PARAM]);

    return [
        body[LEAD_FROM_FIELD] === LEAD_FROM_CHAT && 'Откуда: демо-чат',
        service && `Услуга: ${service.title}`,
        work && `Кейс: ${work.name}`,
        industry && `Отрасль: ${industry.label}`
    ].filter((line): line is string => Boolean(line));
}

// Текст заявки для Telegram (SALES_PLAN 4.3): поля формы, ниже – откуда пришёл клиент. Пустой комментарий не пишем
export const leadMessageText = (
    lead: { name: string; contact: string; message: string },
    body: Record<string, unknown>
): string => {
    const fields = [
        `Имя: ${lead.name}`,
        `Контакт: ${lead.contact}`,
        lead.message && `Комментарий: ${lead.message}`
    ].filter(Boolean).join('\n');
    const source = leadSourceLines(body).join('\n');

    return ['Новая заявка с сайта', fields, source].filter(Boolean).join('\n\n');
}
