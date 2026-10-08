import { FC } from "react";

import Back from '@/assets/_img/icons/backTrack.svg'
import Pause from '@/assets/_img/icons/pause-sm.svg'
import Play from '@/assets/_img/icons/play-sm.svg'

import s from './Command.module.scss'
import { ISwitchTrack } from "@/interfaces/player";
import { playAudio } from "../playAudio";

interface IComand extends ISwitchTrack {
    countTracks: number
}

const Commands:FC<IComand> = ({ handleTrackSelect, trackId, audioRef, statusPlay, countTracks}) => {
    
    // На краях альбома кнопки неактивны и ничего не делают
    const cmd = {
        nextTrack: () => {
            if (trackId < countTracks - 1) handleTrackSelect(trackId + 1);
        },
        backTrack: () => {
            if (trackId > 0) handleTrackSelect(trackId - 1);
        },
        togglePlay: () => {
            if (audioRef.current) {
                if (statusPlay.play) {
                    audioRef.current.pause();
                } else {
                    playAudio(audioRef.current, () => statusPlay.setPlay(false));
                }
                statusPlay.setPlay(!statusPlay.play);
            }
        }
    }

    return (
        <div className={s.comands}>
            <div onClick={cmd.backTrack}>
                <Back className={`${s.back} ${trackId === 0 ? s.unsetActive : ''}`}/>
            </div>
            <div onClick={cmd.togglePlay}>
                {statusPlay.play ? (
                    <Pause />
                ) :
                    <Play />
                }
            </div>
            <div onClick={cmd.nextTrack}>
                <Back className={trackId + 1 === countTracks ? s.unsetActive : ''} style={{transform: 'rotate(180deg'}}/>
            </div>
        </div>
    )
}

export default Commands


