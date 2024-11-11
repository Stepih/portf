"use client"

import { FC } from "react";
import { motion } from "framer-motion";

import Image from "next/image";

import { canada } from "@/fonts/fonts";
import { IAlbums } from "@/interfaces/albums";

import s from './Album.module.scss'
import { IStatusPlay } from "@/interfaces/player";


interface Album extends IStatusPlay {
    album: IAlbums,
    handleAlbumSelect: (album: IAlbums) => void
}

const Album:FC<Album> = ({statusPlay, album, handleAlbumSelect}) => {
    
    // const [status, setStatus] = useState(statusPlay.play) // true = play, false = pause

    return (
        <>  
        <motion.div whileTap={{scale: .9}} onClick={() => {handleAlbumSelect(album); statusPlay.setPlay(statusPlay.play)}} className={s.album}>
            {album.img ? (
                <div className={s.imgWrapper}>
                    {/* <StatusTrack status={status}/> */}
                    <Image 
                        className={s.img}
                        src={album.img} 
                        alt={album.name}
                        width={180} 
                        height={180} 
                        priority
                    />
                </div>
                
            ) : (
                <div className={`${s.noImg} ${canada.className}`}>
                    {/* <StatusTrack status={status} /> */}
                    {album.name}
                </div>
            )}
            <div className={s.title}>
                <h2 className={` ${!album.img && canada.className} ${s.albumName}`}>{album.name}</h2>
                <h4 className={s.artist}>{album.artist}</h4>
            </div>
            </motion.div>
        </>
        
    )
}

export default Album