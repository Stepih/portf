import { FC } from "react";

import { IAlbums } from "@/interfaces/albums";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { musicTitleData } from "@/data/titleBlockPage";
import MusicClient from "./MusicClient";


// Функция для получения данных с сервера
async function fetchAlbums(): Promise<IAlbums[]> {
    const res = await fetch('http://localhost:3000/api/albums', {
        cache: "no-cache"
    });

    if (!res.ok) {
        throw new Error('Не удалось получить альбомы'); // Генерация ошибки
    }

    return res.json();
}


const MusicPage:FC = async() => {
    let albums: IAlbums[] = [];
    let errorMessage: string | undefined;

    try {
        albums = await fetchAlbums();
    } catch (error) {
        errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка'; 
    }
    console.log(errorMessage)

    return (
        <>
          <TitleBlockPage props={musicTitleData}/>
          <MusicClient albums={albums} error={errorMessage} />
        </>
    );
}

export default MusicPage