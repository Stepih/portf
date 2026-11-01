// Страница /sites (SERVICES_PLAN У5)

// Опция с ценой: «Блок сверх 8 – от 1 000 ₽». Цена выделяется, note идёт сразу за ней («, зависит от сложности»).
// Без цены – строка целиком
export interface ISitesOption {
    title: string,
    price?: string,
    note?: string
}

// Кейс раздела: id работы из portfolioWorks и что в нём сделано
export interface ISitesCase {
    id: string,
    text?: string
}

// Опции и кейсы вида сайта. Название, описание, цена, срок и уточнение – из карточки главной (IService), состав –
// выносками сцены (IBuild), «Не входит» и оплата – один раз на страницу (terms, payment в sitesPage.ts)
export interface ISitesDetails {
    options: ISitesOption[],
    // Опции без цены – одной строкой после «Цену назову на созвоне:»
    onCall: string,
    // Итог примера расчёта, слагаемые – IBuildSum
    example?: { total: string },
    cases: ISitesCase[]
}

// Колонка «Что входит и что остаётся вам»: заголовок, пункты и мелкие строки под ними
export interface ISitesTopic {
    title: string,
    items: string[],
    notes?: string[]
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
