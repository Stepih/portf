import { IPortfolioWork } from "@/interfaces/portfolio";
import { ServiceId } from "@/interfaces/offer";

// Параметр ссылки на форму с услугой: /popup?service=landing. Форма начнёт его читать в 4.2
export const SERVICE_PARAM = 'service';

// Адрес формы с предвыбранной услугой
export const withService = (href: string, service: ServiceId): string =>
    `${href}?${SERVICE_PARAM}=${service}`;

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
