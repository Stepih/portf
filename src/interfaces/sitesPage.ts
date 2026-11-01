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

// Сцена сборки (У5а): выноски состава группами по шагам окна. at – номер шага (Mocks.tsx), at = steps – после сборки;
// label – подпись группы («Каталог без корзины»)
export interface IBuildCallouts {
    at: number,
    label?: string,
    items: string[]
}

// Опция таблеткой в окне (У5б): номер опции в sitesDetails[вид].options (цена – оттуда) и короткое имя
export interface IBuildPill {
    option: number,
    label: string
}

// Счётчик суммы сайта компании (У5б): слагаемые по очереди, под каждым – что это; итог – из sitesDetails.example
export interface IBuildSum {
    caption: string,
    terms: { value: string, label: string }[],
    // Нарастающий итог после каждого слагаемого, ₽
    totals: number[]
}

export interface IBuild {
    // Шагов сборки в окне
    steps: number,
    callouts: IBuildCallouts[],
    // Опции с ценой – таблетками в окне, до 5; остальные – тихой строкой под окном
    pills: IBuildPill[],
    sum?: IBuildSum
}

// Этап шкалы «Оплата» (У5б, этап 2): сумма проекта и доли платежей. shares: false – проценты не подписываются
// (по этапам), note – строка под шкалой
export interface IPayStage {
    range: string,
    shares: boolean,
    note?: string,
    parts: { share: number, label?: string }[]
}
