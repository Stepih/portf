import { Dispatch, MutableRefObject, SetStateAction } from "react"

export interface ISwitchTrack extends IStatusPlay {
    audioRef: MutableRefObject<HTMLAudioElement | null>,
    handleTrackSelect: (id: number) => void
    trackId: number,
}

export interface IStatusPlay {
    statusPlay: {
        play: boolean,
        setPlay: Dispatch<SetStateAction<boolean>>
    }
}