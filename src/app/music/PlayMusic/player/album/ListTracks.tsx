import { FC } from "react";
import { motion } from "framer-motion";


import Pause from '@/assets/_img/icons/pause-sm.svg'
import Play from '@/assets/_img/icons/play-sm.svg'

import BgFocus from "@/components/bg-page/BgFocus";

import { canada } from "@/app/fonts/fonts"; 
import s from './ListTracks.module.scss'
import { IAlbums } from "@/interfaces/albums";


interface IListTracks {
    album: IAlbums,
    trackIndex: number,
    isPlaying: boolean,
    onSelectTrack: (index: number) => void,
    onClose: () => void
}


const ListTracks:FC<IListTracks> =({ album, trackIndex, isPlaying, onSelectTrack, onClose }) => {
    
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

                    <button type="button" className={s.btn} onClick={onClose}>Свернуть</button>
                </div>
                <div className={s.listTracks}>
                {album.tracks.map((track) => (
                    <button
                        type="button"
                        className={s.track}
                        key={track.id}
                        onClick={() => onSelectTrack(track.id)}
                        aria-current={trackIndex === track.id ? 'true' : undefined}
                        >
                        {trackIndex === track.id && isPlaying ? <Pause />  : <Play />}
                        <span className={s.info}>
                            <span className={s.name}>{track.name} - <span className={s.artist}>{album.artist}</span></span>
                            <span className={`${canada.className} ${s.duration}`}>{track.duration}</span>
                        </span>
                    </button>
                ))}
                </div>
            </div>
        </>
        
    )
}

export default ListTracks