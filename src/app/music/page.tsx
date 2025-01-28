import { FC } from "react";
import Head from 'next/head';

import { IAlbums } from "@/interfaces/albums";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { musicTitleData } from "@/data/titleBlockPage";
import MusicClient from "./PlayMusic/PlayMusicClient";
import History from "./MeHistory/History";
import { IMusicHistory } from "@/interfaces/musicHistory";
import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import { Metadata } from "next";


// Функция для получения данных с сервера
async function fetchAlbums(): Promise<IAlbums[]> {
    const res = await fetch('http://localhost:3000/api/albums', {
        next: {
            revalidate: 10
        }
    });

    if (!res.ok) {
        throw new Error('Не удалось получить альбомы'); // Генерация ошибки
    }

    return res.json();
}

async function fetchMusicHistory(): Promise<IMusicHistory[]> {
    const res = await fetch('http://localhost:3000/api/music-history', {
        next: {
            revalidate: 1000
        }
    });

    if (!res.ok) {
        throw new Error('Не удалось получить альбомы'); // Генерация ошибки
    }

    return res.json();
}

export const metadata: Metadata = {
    title: "Моя музыка",
    description: "На странице показаны альбомы моих треков, а так же небольшая история, как я пришел к музыки.",
    keywords: 'музыка, альбомы, треки, история музыки, музыкальное портфолио',
    
    openGraph: {
        title: 'Моя музыка',
        description: 'На странице показаны альбомы моих треков, а так же небольшая история, как я пришел к музыки.',
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

const MusicPage:FC = async() => {
    let albums: IAlbums[] = [];
    let musicHistory: IMusicHistory[] = []
    let errorMessage: string | undefined;

    try {
        albums = await fetchAlbums();
        musicHistory = await fetchMusicHistory();
    } catch (error) {
        errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка'; 
    }

    return (
        <>
        <Head>
        <title>{'2'}</title>
        <meta name="description" content={'description'} />
        <meta property="og:title" content={'title'} />
        <meta property="og:description" content={'description'} />
        <meta property="og:image" content="/images/portfolio-thumbnail.jpg" />
      </Head>
            <Breadcrumbs />
          <TitleBlockPage props={musicTitleData}/>
          <MusicClient albums={albums} error={errorMessage} />
          
          <History musicHistory={musicHistory} />
        </>
    );
}

export default MusicPage