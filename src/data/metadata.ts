import type { Metadata } from "next";

// Next объединяет metadata неглубоко: openGraph страницы целиком заменяет openGraph из layout.
// Поэтому общие поля openGraph страницы добавляют сами, разворачивая этот объект.
// images – общая картинка-превью src/app/opengraph-image.tsx: со своим openGraph страница теряет её
// из layout. Поле страницы главнее соседнего opengraph-image, поэтому кейсы указывают свою картинку сами
export const baseOpenGraph = {
    locale: 'ru_RU',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
} satisfies Metadata['openGraph'];
