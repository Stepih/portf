import { FC } from "react";
import { IMedia } from "@/interfaces/mediaImages";

import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { mediaTitleData } from "@/data/titleBlockPage";

import ImageMediaContent from "./components/ImageMediaContent";
import { Metadata } from "next";
import { getMediaContent } from "@/lib/content/mediaContent";

// Страница пререндерится при сборке и обновляется раз в час
export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Дизайн",
    description: "На этой странице я делюсь своими основами работы с монтажом и редактированием изображений в Photoshop. Я начинающий в этой области, но уже освоил основные инструменты для обработки фотографий, такие как кадрирование, коррекция цвета и контраста, а также использование фильтров. Я также работаю с простыми эффектами и текстами для улучшения визуального восприятия. Мой подход заключается в том, чтобы создавать чистые и аккуратные изображения, соблюдая основные принципы композиции и гармонии. Это раздел поможет вам увидеть мои первые шаги в мире монтажа и графического дизайна",
    keywords: 'монтаж видео, редактирование фото, обработка изображений, Photoshop, коррекция цвета, цветокоррекция, графический дизайн, видеоэффекты, простые эффекты, фотоманипуляции, работа с фильтрами, основы Photoshop, кадрирование, улучшение фотографий, базовые навыки в монтаже, текстовые эффекты, визуальные эффекты, ретушь фотографий, создание дизайна, визуальные проекты, редактирование контента, обработка изображений в Photoshop',
    
    openGraph: {
        title: 'Дизайн',
        description: "На этой странице я делюсь своими основами работы с монтажом и редактированием изображений в Photoshop. Я начинающий в этой области, но уже освоил основные инструменты для обработки фотографий, такие как кадрирование, коррекция цвета и контраста, а также использование фильтров. Я также работаю с простыми эффектами и текстами для улучшения визуального восприятия. Мой подход заключается в том, чтобы создавать чистые и аккуратные изображения, соблюдая основные принципы композиции и гармонии. Это раздел поможет вам увидеть мои первые шаги в мире монтажа и графического дизайна",
        locale: 'ru_RU'
    },
    robots: {
        index: true,
        follow: true
    },
    authors: {
        url: 'https://t.me/polo_ymniy',
        name: 'Kartuzov Stepan'
    }
};

const MediaPage: FC = async () => {

    let content:IMedia[]  = []
    let errorMessage: string | undefined;

    try {
        content = await getMediaContent()
    } catch (error) {
        console.error('Ошибка загрузки данных /media:', error);
        errorMessage = 'Не удалось получить контент-медиа';
    }
    
    return (
        <>
            <Breadcrumbs />
            <TitleBlockPage props={mediaTitleData}/>
            {content.length > 0 ? (
                <ImageMediaContent content={content} />
            ) : (
                <h3 style={{textAlign: 'center', marginTop: 100}}>{errorMessage}</h3>
            )}
        </>
    )
}

export default MediaPage