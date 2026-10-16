import { IPortfolioWork, PortfolioKind } from "@/interfaces/portfolio"

// Картинки и видео лежат в public/portfolio
const img = (file: string) => `/portfolio/${file}`

// Порядок в массиве = порядок и номер на странице
export const portfolioWorks: IPortfolioWork[] = [
    {
        id: 'vocal',
        name: 'Союз вокалистов',
        year: 2026,
        kind: 'Корпоративный',
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
        description: 'Сайт компании, которая строит дома и делает ремонт под ключ: тур по интерьеру на скролле, этапы работ и галерея объектов',
        tags: ['Web', 'Motion', 'Строительство'],
        tint: 'rgba(201, 162, 114, 0.2)',
        cover: img('keystone-after.jpg'),
        coverHeight: 400,
        featured: { type: 'video', src: img('keystone.mp4'), poster: img('keystone-poster.jpg') }
    },
    {
        id: 'hubech',
        name: 'Hubech',
        year: 2024,
        kind: 'Лендинг',
        description: 'Сервис поиска работы в IT с подбором вакансий по навыкам',
        tags: ['Web', 'Лендинг'],
        tint: 'rgba(119, 199, 234, 0.22)',
        cover: img('hubech.jpg'),
        coverHeight: 340
    },
    {
        id: 'jobs',
        name: 'Jobs',
        year: 2024,
        kind: 'Веб-сервис',
        description: 'Каталог вакансий с фильтрами по навыкам, локации и зарплате',
        tags: ['Web-app', 'HR-tech'],
        tint: 'rgba(119, 199, 234, 0.22)',
        cover: img('jobs.jpg'),
        coverHeight: 380
    }
]

// Порядок кнопок фильтра; тип без работ не показывается
export const portfolioKinds: PortfolioKind[] = ['Лендинг', 'Интернет-магазин', 'Корпоративный', 'Веб-сервис']
