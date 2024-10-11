import { FC } from "react";
import { motion } from "framer-motion";

import Image from "next/image";
import pause from '@/assets/_img/icons/pause-sm.svg'
import play from '@/assets/_img/icons/play-sm.svg'


import { canada } from "@/fonts/fonts"; 
import s from './ListTracks.module.scss'
import { IAlbums } from "@/interfaces/albums";
import { IStatusPlay } from "@/interfaces/player";

interface IListTracks extends IStatusPlay {
    album: IAlbums,
    trackId: number,
    handleTrackSelect: (id:number) => void
}


const ListTracks:FC<IListTracks> =({handleTrackSelect, album, statusPlay, trackId}) => {
    
    return (
        <div className={s.wrapper}>
            <h3>Сейчас играет: 
                <motion.span 
                initial={{ backgroundPosition: '0% 50%' }}
                animate={{ backgroundPosition: '100% 50%'}}
                transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
                className={s.gradientText}> Альбом «{album.name}»
                </motion.span>
            </h3>
            <div className={s.listTracks}>
            {album.tracks.map((track) => (
                <motion.div
                    
                    className={s.track}
                    key={track.id}
                    onClick={() => handleTrackSelect(track.id)}
                    >
                    {trackId === track.id && statusPlay.play ? <Image height={20} width={20} src={pause} alt="Pause" /> : <Image height={20} width={20} src={play} alt="Play"/>}
                    <div className={s.info}>
                        <p className={s.name}>{track.name} - <span className={s.artist}>{album.artist}</span></p>
                        <p className={`${canada.className} ${s.duration}`}>{track.duration}</p>
                    </div>
                </motion.div>
            ))}
            </div>
        </div>
    )
}

export default ListTracks