import { FC } from "react";

import { IAlbums } from "@/interfaces/albums";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { musicTitleData } from "@/data/titleBlockPage";
import MusicClient from "./PlayMusic/PlayMusicClient";
import History from "./MeHistory/History";
import { IMusicHistory } from "@/interfaces/musicHistory";
import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import { Metadata } from "next";
import { baseOpenGraph } from "@/data/metadata";
import { getAlbums } from "@/lib/content/albums";
import { getMusicHistory } from "@/lib/content/musicHistory";

// Страница пререндерится при сборке и обновляется раз в час: так подхватываются новые альбомы
export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Моя музыка",
    description: "На странице показаны альбомы моих треков, а так же небольшая история, как я пришел к музыки.",
    keywords: 'музыка, альбомы, треки, история музыки, музыкальное портфолио',
    
    openGraph: {
        ...baseOpenGraph,
        title: 'Моя музыка',
        description: 'На странице показаны альбомы моих треков, а так же небольшая история, как я пришел к музыки.',
    },
};

const MusicPage:FC = async() => {
    let albums: IAlbums[] = [];
    let musicHistory: IMusicHistory[] = []
    let errorMessage: string | undefined;

    try {
        [albums, musicHistory] = await Promise.all([getAlbums(), getMusicHistory()]);
    } catch (error) {
        console.error('Ошибка загрузки данных /music:', error);
        errorMessage = 'Не удалось получить альбомы';
    }

    return (
        <>
        <Breadcrumbs />
          <TitleBlockPage props={musicTitleData}/>
          <MusicClient albums={albums} error={errorMessage} />
          
          <History musicHistory={musicHistory} />
        </>
    );
}

export default MusicPage