import { services } from "@/data/offer";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { INDUSTRY_PARAM } from "./portfolioIndustry";
import { CASE_PARAM, SERVICE_PARAM } from "./services";

// Откуда пришёл клиент (SALES_PLAN 4.8): услуга, кейс или отрасль из ссылки «Обсудить» на форму.
// Форма их не показывает, а отправляет вместе с заявкой; владелец видит их в Telegram
const LEAD_SOURCE_PARAMS = [SERVICE_PARAM, CASE_PARAM, INDUSTRY_PARAM] as const;

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

// Строки для сообщения в Telegram. Берутся только известные id: в заявку не попадёт произвольный текст из ссылки
export const leadSourceLines = (body: Record<string, unknown>): string[] => {
    const service = services.find((item) => item.id === body[SERVICE_PARAM]);
    const work = portfolioWorks.find((item) => item.id === body[CASE_PARAM]);
    const industry = portfolioIndustries.find((item) => item.id === body[INDUSTRY_PARAM]);

    return [
        service && `Service: ${service.title}`,
        work && `Case: ${work.name}`,
        industry && `Industry: ${industry.label}`
    ].filter((line): line is string => Boolean(line));
}
