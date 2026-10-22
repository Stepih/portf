import { FC } from "react";
import { IMedia } from "@/interfaces/mediaImages";

import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { mediaTitleData } from "@/data/titleBlockPage";

import ImageMediaContent from "./components/ImageMediaContent";
import { Metadata } from "next";
import { baseOpenGraph } from "@/data/metadata";
import { getMediaContent } from "@/lib/content/mediaContent";

// Страница пререндерится при сборке и обновляется раз в час
export const revalidate = 3600;

const title = 'Дизайн – Степан Картузов';
const description = 'Обработка фото до и после, видеопереходы для монтажа и биты. Примеры работы с изображениями, видео и звуком';

export const metadata: Metadata = {
    title,
    description,
    keywords: 'обработка фото, ретушь, цветокоррекция, Photoshop, видеопереходы, монтаж видео, создание битов',
    openGraph: {
        ...baseOpenGraph,
        title,
        description,
    },
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