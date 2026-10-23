import { IPortfolioWork } from "@/interfaces/portfolio";
import { IService, ServiceId } from "@/interfaces/offer";
import { contactSectionId } from "@/constants/urls";

// Параметр ссылки на форму с услугой: /popup?service=landing. Форма отправляет его с заявкой (4.8)
export const SERVICE_PARAM = 'service';

// Адрес формы с предвыбранной услугой
export const withService = (href: string, service: ServiceId): string =>
    `${href}?${SERVICE_PARAM}=${service}`;

// Адрес формы главной: /?service=landing#contact, без услуги – /#contact (DESIGN_FIXES_3_PLAN Д13)
export const contactHref = (service?: ServiceId): string =>
    `/${service ? `?${SERVICE_PARAM}=${service}` : ''}#${contactSectionId}`;

// Строки выбранной услуги для формы: «Лендинг · от 8 000 ₽ · 3–4 дня». Считаются на сервере и уходят
// в форму пропсом, чтобы offer.ts не попадал в клиентский бандл. Цена и срок не рвутся: пробелы неразрывные,
// после «–» – word joiner. На телефоне строка переносится по « · », а не «3– / 4 дня»
const keepTogether = (text: string): string => text.replace(/ /g, ' ').replace(/–/g, '–⁠');

export const serviceLines = (list: Pick<IService, 'id' | 'title' | 'price' | 'term'>[]): Partial<Record<ServiceId, string>> =>
    Object.fromEntries(list.map((service) => [
        service.id,
        [service.title, keepTogether(service.price), keepTogether(service.term)].join(' · ')
    ]));

// Параметр ссылки на форму из кейса: /popup?case=icc. Форма отправляет его с заявкой (4.8)
export const CASE_PARAM = 'case';

// Адрес формы с кейсом, который смотрел клиент
export const withCase = (href: string, caseId: string): string =>
    `${href}?${CASE_PARAM}=${encodeURIComponent(caseId)}`;

// Кейсы-примеры услуги: название и ссылка. Работы без страницы кейса и неизвестные id пропускаются
export const serviceCases = (
    ids: string[],
    works: Pick<IPortfolioWork, 'id' | 'name'>[],
    cases: Record<string, unknown>
): Pick<IPortfolioWork, 'id' | 'name'>[] =>
    ids.flatMap((id) => {
        const work = works.find((w) => w.id === id);
        return work && cases[id] ? [{ id: work.id, name: work.name }] : [];
    });
