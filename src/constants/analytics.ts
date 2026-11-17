// ID счётчика Яндекс Метрики
export const YM_ID = 99704852
// Домен прода: только на нём (и на www) счётчик грузится и шлёт хиты (DESIGN_FIXES_10_PLAN Д54)
export const YM_HOST = 'showmyworks.ru'

// Цели Метрики (SALES_PLAN 6.1). В интерфейсе Метрики цели заводятся с теми же id, тип «JavaScript-событие»
export const GOALS = {
    leadSubmit: 'lead_submit',
    leadError: 'lead_error',
    tgClick: 'tg_click',
    ctaClick: 'cta_click',
    industryClick: 'industry_click',
    serviceClick: 'service_click',
    // «Что входит →» из карточки услуги на главной – на страницу услуги (SERVICES_PLAN У4)
    servicesMore: 'services_more',
    moreClick: 'more_click',
    // Демо-чат (CONVERSION_PLAN К3.2): окно открыто, вопрос задан, контакт оставлен в чате
    chatOpen: 'chat_open',
    chatMessage: 'chat_message',
    chatLead: 'chat_lead'
} as const

export type Goal = typeof GOALS[keyof typeof GOALS]
