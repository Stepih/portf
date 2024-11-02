import { FC, useState } from "react";
import { IAlbums } from "@/interfaces/albums";

import s from './AlbumList.module.scss'
import Album from "./Album";

import Arrow from '@/assets/_img/icons/arrow-s-right.svg'
import { IStatusPlay } from "@/interfaces/player";


interface AlbumListProps extends IStatusPlay {
    albums: IAlbums[],
    error?: string,
    handleAlbumSelect: (album: IAlbums) => void,
}

// Компонент для отображения списка альбомов
const AlbumListDekstop:FC<AlbumListProps> = ({statusPlay, albums, error, handleAlbumSelect }) => {
    const [show, setShow] = useState(4)

    const showAllAlbums = () => {
        show === 4 ? setShow(albums.length) : setShow(4)
    }

    return (
        <>
            <div className={s.wrapper}>
                <div className={s.albumHeader}>
                    <h3 className={s.title}>Мои плейлисты</h3>
                    <div 
                        onClick={showAllAlbums}
                        className={s.popupBtn}>
                        <h3 
                            className={s.title}> {show === 4 ? 'Показать еще' : 'Показать меньше'}
                        </h3>
                        <Arrow className={s.arrow} />
                    </div>
                </div>
                <div className={s.albumList}>
                    {error && <h4 style={{textAlign: 'center', width: '100%'}}>Ошибка загрузки треков</h4>}
                    {albums.map((album, index) =>  {
                        return index <= show && <Album key={album.id} statusPlay={statusPlay} handleAlbumSelect={handleAlbumSelect} album={album}/>
                    })}
                </div>  
            </div>
        </>
        
    );
};

export default AlbumListDekstop;
