// Тип работы: подпись в карточке
export type PortfolioKind = 'Лендинг' | 'Интернет-магазин' | 'Корпоративный' | 'Веб-сервис'

// Отрасль клиента: по ней фильтруется страница портфолио, id идёт в ссылку /portfolio?for=<id>
export type PortfolioIndustry = 'medicine' | 'construction' | 'beauty' | 'outsourcing' | 'b2b' | 'realty' | 'education' | 'ecommerce' | 'travel'

export interface IPortfolioIndustry {
    id: PortfolioIndustry,
    // Подпись кнопки фильтра
    label: string,
    // Продолжение фразы «Сайты для …»: h1 и title подборки
    audience: string
}

// Медиа карточки в «Избранном»: макеты десктопа и телефона или запись сайта
export type IFeaturedMedia =
    | { type: 'devices', desktop: string, mobile: string }
    | { type: 'video', src: string, poster: string }

export interface IPortfolioWork {
    id: string,
    name: string,
    year: number,
    kind: PortfolioKind,
    // Отрасли, к которым работа относится напрямую; пусто — работа видна только среди всех
    industries: PortfolioIndustry[],
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

// ---- Страница кейса /portfolio/[id] ----

// Слайд первого экрана. dur — сколько секунд показывать слайд.
// desktop/mobile — длинный скриншот в окне браузера или в двух телефонах, листается за время слайда;
// crop — кадр со скриншота на весь экран, pos — его object-position
export type ICaseSlide =
    | { type: 'desktop' | 'mobile', src: string, caption: string, dur: number }
    | { type: 'crop', src: string, pos: string, caption: string, dur: number }
    | { type: 'video', src: string, poster: string, caption: string, dur: number }

// Ячейка блока «Задача и результат»: обычный текст, крупный текст или метки
export type ICaseInfo =
    | { label: string, text: string, big?: boolean }
    | { label: string, chips: string[] }

// Метка на скриншоте «Ключевых экранов». x, y — где стоит номер; cx, cy — куда смотрит камера; zoom — приближение.
// Все координаты — доли ширины и высоты картинки (0–1)
export interface ICaseMark {
    x: number,
    y: number,
    cx: number,
    cy: number,
    zoom: number
}

export interface ICasePoint {
    text: string,
    mark?: ICaseMark
}

// Шаг «Ключевых экранов». Картинка шага или отрезок видео кейса seg: [начало, конец] в секундах — его прокручивает скролл.
// fit: 'width' — картинка вписана по ширине, по умолчанию заполняет окно
export interface ICaseScreen {
    title: string,
    goal: string,
    text: string,
    points: ICasePoint[],
    image?: { src: string, fit?: 'width' },
    seg?: [number, number]
}

// «До»: скриншот старого сайта или рассказ, как было без сайта
export type ICaseBefore =
    | { src: string }
    | { text: string, channels: string[] }

export interface IPortfolioCase {
    // Тип проекта в кейсе подробнее, чем в фильтре списка
    kind: string,
    role: string,
    // Цвет номеров и кавычки
    accent: string,
    headline: string,
    tags: string[],
    // Адрес живого сайта; нет — кнопки «Открыть сайт» не показываются
    url?: string,
    slides: ICaseSlide[],
    info: ICaseInfo[],
    features?: { title: string, text: string }[],
    // [значение, подпись]; число в значении считается от нуля при появлении
    metrics: [string, string][],
    screens: ICaseScreen[],
    // Видео для шагов с seg. ratio — высота к ширине записи, по умолчанию 672 / 1440
    screensVideo?: { src: string, poster: string, ratio?: number },
    // Нет before — блока «До и после» нет. after по умолчанию — первый десктопный слайд
    before?: ICaseBefore,
    after?: string,
    quote?: { text: string, name: string, role: string }
}
