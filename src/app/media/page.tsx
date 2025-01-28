import { FC } from "react";
import { IMedia } from "@/interfaces/mediaImages";

import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { mediaTitleData } from "@/data/titleBlockPage";

import ImageMediaContent from "./components/ImageMediaContent";
import { Metadata } from "next";

async function fetchContent(): Promise<IMedia[]> {
    const res = await fetch('http://localhost:3000/api/media-content', {
        next: {
            revalidate: 1
        }
    });

    if (!res.ok) {
        throw new Error('Не удалось получить контент-медиа'); 
    }

    return res.json();
}

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
        content = await fetchContent()
    } catch (error) {
        errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка'; 
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