import { IMedia } from "@/interfaces/mediaImages";

// Тексты блоков /media. Картинки подставляет getMediaContent из public/media
export const mediaContentData = {
    comparison: {
        id: 0,
        title: "Улучшение ваших фотографий",
        description:
            "Я помогу вашим фотографиям заиграть новыми красками! Профессиональная обработка, коррекция и ретушь подчеркнут красоту каждого кадра. Индивидуальный подход, высокое качество и оперативность работы.",
    },
    gifs: {
        id: 1,
        title: "Видеопереходы",
        description:
            "Лаконичный монтаж видеороликов, создания видеопереходов и видеоэффектов. Цветокоррекция, стабилизация видео. Работаю с разными форматами.",
    },
    beats: {
        id: 2,
        title: "Создание битов",
        description:
            "Делаю биты на заказ, с творчеством можно ознакомиться на {link}",
    },
} satisfies Record<string, Omit<IMedia, 'images' | 'imagesComparison'>>
