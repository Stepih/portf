import { FC } from "react";
import { motion } from "framer-motion";


import Pause from '@/assets/_img/icons/pause-sm.svg'
import Play from '@/assets/_img/icons/play-sm.svg'

import BgFocus from "@/components/bg-page/BgFocus";

import { canada } from "@/fonts/fonts"; 
import s from './ListTracks.module.scss'
import { IAlbums } from "@/interfaces/albums";
import { IStatusPlay } from "@/interfaces/player";


interface IListTracks extends IStatusPlay {
    album: IAlbums,
    trackId: number,
    handleTrackSelect: (id:number) => void,
    handleListTracks: () => void
}


const ListTracks:FC<IListTracks> =({handleListTracks, handleTrackSelect, album, statusPlay, trackId}) => {
    
    return (
        <>
            <BgFocus status={true}/>
            <div className={s.wrapper}>
                <div className={s.header}>
                    <h3>Сейчас играет: 
                        <motion.span 
                        initial={{ backgroundPosition: '0% 50%' }}
                        animate={{ backgroundPosition: '100% 50%'}}
                        transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
                        className={s.gradientText}> Альбом «{album.name}»
                        </motion.span>
                    </h3>

                    <span className={s.btn} onClick={handleListTracks}>Свернуть</span>
                </div>
                <div className={s.listTracks}>
                {album.tracks.map((track) => (
                    <motion.div
                        className={s.track}
                        key={track.id}
                        onClick={() => handleTrackSelect(track.id)}
                        >
                        {trackId === track.id && statusPlay.play ? <Pause />  : <Play />}
                        <div className={s.info}>
                            <p className={s.name}>{track.name} - <span className={s.artist}>{album.artist}</span></p>
                            <p className={`${canada.className} ${s.duration}`}>{track.duration}</p>
                        </div>
                    </motion.div>
                ))}
                </div>
            </div>
        </>
        
    )
}

export default ListTracks