// ID счётчика Яндекс Метрики
export const YM_ID = 99704852

// Цели Метрики (SALES_PLAN 6.1). В интерфейсе Метрики цели заводятся с теми же id, тип «JavaScript-событие»
export const GOALS = {
    leadSubmit: 'lead_submit',
    leadError: 'lead_error',
    tgClick: 'tg_click',
    ctaClick: 'cta_click',
    industryClick: 'industry_click',
    serviceClick: 'service_click',
    moreClick: 'more_click'
} as const

export type Goal = typeof GOALS[keyof typeof GOALS]
