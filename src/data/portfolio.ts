import { IPortfolioIndustry, IPortfolioWork } from "@/interfaces/portfolio"

// Картинки и видео лежат в public/portfolio
const img = (file: string) => `/portfolio/${file}`

// Порядок в массиве = порядок и номер на странице
export const portfolioWorks: IPortfolioWork[] = [
    {
        id: 'vocal',
        name: 'Союз вокалистов',
        year: 2026,
        kind: 'Корпоративный',
        industries: [],
        description: 'Сайт Российского союза вокалистов: вступление в союз, конкурсы и премии, события и новости',
        tags: ['Web', 'Mobile', 'Корпоративный'],
        tint: 'rgba(234, 119, 119, 0.2)',
        cover: img('vocal-desktop.jpg'),
        coverHeight: 420,
        featured: { type: 'devices', desktop: img('vocal-desktop.jpg'), mobile: img('vocal-mobile.jpg') }
    },
    {
        id: 'onkel',
        name: 'ONKEL.MOSCOW',
        year: 2026,
        kind: 'Интернет-магазин',
        industries: ['ecommerce'],
        description: 'Интернет-магазин московского бренда уличной одежды: дропы, каталог, коллаборации и лукбук',
        tags: ['E-commerce', 'Web', 'Mobile'],
        tint: 'rgba(57, 57, 57, 0.35)',
        cover: img('onkel-desktop.jpg'),
        coverHeight: 360,
        featured: { type: 'devices', desktop: img('onkel-desktop.jpg'), mobile: img('onkel-mobile.jpg') }
    },
    {
        id: 'keystone',
        name: 'KEYSTONE',
        year: 2026,
        kind: 'Корпоративный',
        industries: ['construction'],
        description: 'Сайт компании, которая строит дома и делает ремонт под ключ: тур по интерьеру на скролле, этапы работ и галерея объектов',
        tags: ['Web', 'Motion', 'Строительство'],
        tint: 'rgba(201, 162, 114, 0.2)',
        cover: img('keystone-after.jpg'),
        coverHeight: 400,
        featured: { type: 'video', src: img('keystone.mp4'), poster: img('keystone-poster.jpg') }
    },
    {
        id: 'icc',
        name: 'ИКЦ «Презентация»',
        year: 2026,
        kind: 'Корпоративный',
        industries: ['outsourcing'],
        description: 'Сайт кировской компании: сопровождение 1С, сайты, ИТ-поддержка 24/7, бухгалтерия и юристы на одной странице',
        tags: ['Web', 'Mobile', 'B2B-услуги'],
        tint: 'rgba(102, 221, 34, 0.2)',
        cover: img('icc-desktop.jpg'),
        coverHeight: 380
    },
    {
        id: 'keytravel',
        name: 'KeyTravel UAE',
        year: 2024,
        kind: 'Интернет-магазин',
        industries: ['travel', 'ecommerce'],
        description: 'Магазин экскурсий и билетов в Дубае и ОАЭ: бронирование в два шага, цены в рублях, долларах и дирхамах, оплата российской картой',
        tags: ['Web', 'Mobile', 'Туризм'],
        tint: 'rgba(23, 48, 80, 0.22)',
        cover: img('keytravel-desktop.jpg'),
        coverHeight: 400
    },
    {
        id: 'loti',
        name: 'LOTi',
        year: 2025,
        kind: 'Корпоративный',
        industries: ['travel'],
        description: 'Сайт премиального туроператора: главная как фильм при прокрутке, 9 направлений, каталог на 1138 отелей и карта агентств-партнёров',
        tags: ['Web', 'Motion', 'Туризм'],
        tint: 'rgba(62, 142, 138, 0.2)',
        cover: img('loti-desktop.jpg'),
        coverHeight: 420
    },
    {
        id: 'ptmix',
        name: 'ПТМ',
        year: 2024,
        kind: 'Корпоративный',
        industries: ['b2b'],
        description: 'Сайт-каталог ёмкостного оборудования из нержавеющей стали: 52 позиции для химических, молочных, винных и пищевых заводов, объекты с адресами и заявка с любой карточки',
        tags: ['Web', 'Mobile', 'Производство'],
        tint: 'rgba(183, 53, 34, 0.18)',
        cover: img('ptmix-desktop.jpg'),
        coverHeight: 380
    },
    {
        id: 'legiscan',
        name: 'Legiscan',
        year: 2026,
        kind: 'Веб-сервис',
        industries: ['outsourcing'],
        description: 'ИИ-сервис проверки договоров: риски с цитатой пункта и готовой правкой, сравнение редакций, сроки и чат по документу. Плюс Telegram-бот, API и интеграция с Pyrus',
        tags: ['Web', 'Mobile', 'SaaS', 'ИИ'],
        tint: 'rgba(59, 130, 246, 0.18)',
        cover: img('legiscan-desktop.jpg'),
        coverHeight: 420
    }
]

// Порядок кнопок фильтра. Отрасль без работ не показывается, а ссылка на неё открывает все работы
export const portfolioIndustries: IPortfolioIndustry[] = [
    { id: 'medicine', label: 'Медицина', audience: 'клиник, стоматологий и лабораторий' },
    { id: 'construction', label: 'Строительство и ремонт', audience: 'строительных и ремонтных компаний' },
    { id: 'beauty', label: 'Бьюти', audience: 'салонов красоты и косметологии' },
    { id: 'outsourcing', label: 'Юристы, бухгалтеры, кадры', audience: 'юристов, бухгалтеров и кадровых агентств' },
    { id: 'b2b', label: 'Производство и B2B', audience: 'производства и B2B-компаний' },
    { id: 'realty', label: 'Недвижимость', audience: 'агентств недвижимости' },
    { id: 'education', label: 'Онлайн-школы', audience: 'онлайн-школ и курсов' },
    { id: 'ecommerce', label: 'Интернет-магазины', audience: 'интернет-магазинов' },
    { id: 'travel', label: 'Туризм', audience: 'турагентств и туроператоров' }
]
