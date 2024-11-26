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

const AlbumListDekstop:FC<AlbumListProps> = ({statusPlay, albums, error, handleAlbumSelect }) => {
    const [show, setShow] = useState(false)
    const limitAlbums:IAlbums[] = []
    const lastAlbums:IAlbums[] = []
    
    const limit = 5

    const showAlbum = () => {
        albums.forEach((album, id) => {
            if (id < limit) {
                limitAlbums.push(album)
            } else {
                lastAlbums.push(album)
            }
        })
    }
    showAlbum()
    const itog = show ? [...lastAlbums, ...limitAlbums] : limitAlbums
    const showAllAlbums = () => {
        setShow(!show)
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
                            className={s.title}> {!show ? 'Показать еще' : 'Показать меньше'}
                        </h3>
                        <Arrow className={s.arrow} />
                    </div>
                </div>
                <div className={s.albumList}>
                    {error && <h4 style={{textAlign: 'center', width: '100%'}}>Ошибка загрузки треков</h4>}
                    {itog.map((album) =>  {
                        return (
                            <Album key={album.id} statusPlay={statusPlay} handleAlbumSelect={handleAlbumSelect} album={album}/>
                        )
                    })}
                </div>  
            </div>
        </>
        
    );
};

export default AlbumListDekstop;
