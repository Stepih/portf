
import { FC } from "react";
import { motion } from "framer-motion";

import Image from "next/image";
import back from '@/assets/_img/icons/backTrack.svg'
import next from '@/assets/_img/icons/nextTrack.svg'
import pause from '@/assets/_img/icons/pause-sm.svg'
import play from '@/assets/_img/icons/play-sm.svg'

import s from './Command.module.scss'
import { ISwitchTrack } from "@/interfaces/player";

interface IComand extends ISwitchTrack {
    countTracks: number
}

const Commands:FC<IComand> = ({ handleTrackSelect, trackId, audioRef, statusPlay, countTracks}) => {
    
    const cmd = {
        nextTrack: () => {trackId < countTracks - 1 ? handleTrackSelect(trackId + 1) : statusPlay.setPlay(!statusPlay.play)},
        backTrack: () => trackId > 0 ? handleTrackSelect(trackId - 1) : statusPlay.setPlay(!statusPlay.play),
        togglePlay: () => {
            if (audioRef.current) {
                if (statusPlay.play) {
                    audioRef.current.pause();
                } else {
                    audioRef.current.play();
                }
                statusPlay.setPlay(!statusPlay.play);
            }
        }
    }

    return (
        <div className={s.comands}>
            <motion.div whileTap={{scale: .9}}>
                <Image className={`${s.back} ${trackId === 0 ? s.unsetActive : ''}`} src={back} alt="Назад" onClick={cmd.backTrack} />
            </motion.div>
            <motion.div whileTap={{scale: .9}}>
                {statusPlay.play ? (
                    <Image height={20} width={20} src={pause} alt="Пауза" onClick={cmd.togglePlay}/>
                ) :
                    <Image height={20} width={20} src={play} alt="Пауза" onClick={cmd.togglePlay}/>
                }
            </motion.div>
            <motion.div whileTap={{scale: .9}} >
                <Image className={trackId + 1 === countTracks ? s.unsetActive : ''} src={next} alt="Следующий" onClick={cmd.nextTrack} />
            </motion.div>
        </div>
    )
}

export default Commands