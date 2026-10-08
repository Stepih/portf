import type { Metadata } from "next";

// Next объединяет metadata неглубоко: openGraph страницы целиком заменяет openGraph из layout.
// Поэтому общие поля openGraph страницы добавляют сами, разворачивая этот объект
export const baseOpenGraph = {
    locale: 'ru_RU',
} satisfies Metadata['openGraph'];
