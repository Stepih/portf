// Тип работы: по нему фильтруется сетка «Все работы»
export type PortfolioKind = 'Лендинг' | 'Интернет-магазин' | 'Корпоративный' | 'Веб-сервис'

// Медиа карточки в «Избранном»: макеты десктопа и телефона или запись сайта
export type IFeaturedMedia =
    | { type: 'devices', desktop: string, mobile: string }
    | { type: 'video', src: string, poster: string }

export interface IPortfolioWork {
    id: string,
    name: string,
    year: number,
    kind: PortfolioKind,
    description: string,
    tags: string[],
    // Фон под макетом
    tint: string,
    // Длинный скриншот для карточки в сетке, прокручивается при скролле
    cover: string,
    // Высота рамки с макетом в сетке, px: разная высота даёт «ступенчатые» колонки
    coverHeight: number,
    // Есть — работа показана ещё и в «Избранном»
    featured?: IFeaturedMedia
}
