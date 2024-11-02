import { FC } from "react";

import { IAlbums } from "@/interfaces/albums";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { musicTitleData } from "@/data/titleBlockPage";
import MusicClient from "./PlayMusic/PlayMusicClient";
import History from "./MeHistory/History";
import { IMusicHistory } from "@/interfaces/musicHistory";


// Функция для получения данных с сервера
async function fetchAlbums(): Promise<IAlbums[]> {
    const res = await fetch('http://localhost:3000/api/albums', {
        next: {
            revalidate: 100
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
            revalidate: 100
        }
    });

    if (!res.ok) {
        throw new Error('Не удалось получить альбомы'); // Генерация ошибки
    }

    return res.json();
}


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
    console.log(errorMessage)

    return (
        <>
          <TitleBlockPage props={musicTitleData}/>
          <MusicClient albums={albums} error={errorMessage} />
          
          <History musicHistory={musicHistory} />
        </>
    );
}

export default MusicPage