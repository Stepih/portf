// id услуги: по нему форма предвыбирает услугу (SALES_PLAN 4.2, 4.8)
export type ServiceId = 'landing' | 'corporate' | 'shop' | 'ai'

// Тип проекта в форме заявки (SALES_PLAN 4.2): услуга или «Другое»
export type LeadServiceId = ServiceId | 'other'

export interface ILeadService {
    id: LeadServiceId,
    title: string
}

// Слайд первого экрана: крупная надпись латиницей и подпись под ней
export interface IHeroSlide {
    headline: string,
    caption: string
}

export interface IOfferButton {
    title: string,
    href: string
}

export interface IService {
    id: ServiceId,
    title: string,
    // Одна строка: что это за сайт
    summary: string,
    // «от 8 000 ₽»
    price: string,
    term: string,
    // Уточнение к цене или сроку
    note?: string,
    // Кейсы-примеры из portfolioWorks; пусто — примера нет
    caseIds: string[],
    // Карточка на всю ширину под остальными: ИИ – отдельное направление, не четвёртый вид сайта
    wide?: boolean,
    // Кнопка демо-чата в карточке (CONVERSION_PLAN К3.2): чат – живой пример этой услуги
    demoChat?: boolean
}

// Что клиент платит на этапе (DESIGN_FIXES_2_PLAN Д5): due – здесь платёж, иначе этап бесплатный
export interface IOfferStepPay {
    label: string,
    note?: string,
    due?: boolean
}

export interface IOfferStep {
    title: string,
    text: string,
    pay: IOfferStepPay
}

export interface IOfferReason {
    title: string,
    text: string
}

export interface IFaqItem {
    question: string,
    answer: string
}

// Ссылка блока «А ещё я…»; id – параметр цели Метрики
export interface IMoreLink {
    title: string,
    href: string,
    id: string
}
