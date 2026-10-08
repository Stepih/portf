import { FC } from "react";

import Back from '@/assets/_img/icons/backTrack.svg'
import Pause from '@/assets/_img/icons/pause-sm.svg'
import Play from '@/assets/_img/icons/play-sm.svg'

import s from './Command.module.scss'

interface IComand {
    isPlaying: boolean,
    hasPrev: boolean,
    hasNext: boolean,
    onTogglePlay: () => void,
    onPrev: () => void,
    onNext: () => void,
}

// На краях альбома кнопки неактивны
const Commands:FC<IComand> = ({ isPlaying, hasPrev, hasNext, onTogglePlay, onPrev, onNext }) => {

    return (
        <div className={s.commands}>
            <button
                type="button"
                className={`${s.btn} ${s.back}`}
                onClick={onPrev}
                disabled={!hasPrev}
                aria-label="Предыдущий трек"
            >
                <Back className={!hasPrev ? s.unsetActive : ''}/>
            </button>
            <button
                type="button"
                className={s.btn}
                onClick={onTogglePlay}
                aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
            >
                {isPlaying ? <Pause /> : <Play />}
            </button>
            <button
                type="button"
                className={s.btn}
                onClick={onNext}
                disabled={!hasNext}
                aria-label="Следующий трек"
            >
                <Back className={!hasNext ? s.unsetActive : ''} style={{transform: 'rotate(180deg)'}}/>
            </button>
        </div>
    )
}

export default Commands


