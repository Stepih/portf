// Страница /sites (SERVICES_PLAN У5)

// Опция с ценой: «Блок сверх 8 – от 1 000 ₽». Цена выделяется, note идёт сразу за ней («, зависит от сложности»).
// Без цены – строка целиком
export interface ISitesOption {
    title: string,
    price?: string,
    note?: string
}

// Группа «Входит всегда»: у магазина две – «Магазин» и «Каталог без корзины». Первой строкой каждой группы – ссылка
// «Всё, что есть в каждом сайте»; note – мелкая строка под списком
export interface ISitesIncluded {
    label?: string,
    items: string[],
    note?: string
}

// Кейс раздела: id работы из portfolioWorks и что в нём сделано
export interface ISitesCase {
    id: string,
    text?: string
}

// Состав вида сайта. Название, описание, цена, срок и уточнение – из карточки главной (IService)
export interface ISitesDetails {
    included: ISitesIncluded[],
    options: ISitesOption[],
    // Опции без цены – одной строкой после «Цену назову на созвоне:»
    onCall: string,
    // Пример расчёта: формула и итог
    example?: { text: string, total: string },
    excluded: string[],
    payment: string[],
    cases: ISitesCase[]
}

// Тема «Для всех сайтов»: заголовок, пункты и мелкие строки под ними
export interface ISitesTopic {
    title: string,
    items: string[],
    notes?: string[],
    // Крупная цифра темы (У5а): «от 300 ₽/мес», «1 500 ₽/час»
    figure?: string,
    // Доли платежей для шкал «Оплаты», по пункту на шкалу (У5а)
    splits?: number[][]
}
