// id услуги: по нему форма предвыбирает услугу (SALES_PLAN 4.2, 4.8)
export type ServiceId = 'landing' | 'corporate' | 'shop' | 'ai'

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
    wide?: boolean
}

export interface IOfferStep {
    title: string,
    text: string
}

export interface IOfferReason {
    title: string,
    text: string
}

export interface IFaqItem {
    question: string,
    answer: string
}
