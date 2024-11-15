import { FC } from "react";
import { IMedia } from "@/interfaces/mediaImages";

import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { mediaTitleData } from "@/data/titleBlockPage";

import ImageMediaContent from "./components/ImageMediaContent";

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