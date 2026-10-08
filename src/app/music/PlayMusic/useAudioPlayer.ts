import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { IAlbums } from "@/interfaces/albums";
import { isTouchDevice } from "@/scripts/typeDevice";
import { initialPlayerState, playerReducer } from "./playerReducer";
import { playAudio } from "./player/playAudio";

const VOLUME_KEY = "playerVolume";

// Единое состояние плеера. Элемент <audio> один на всё время, пока плеер открыт:
// при смене трека меняется только src, а play()/pause() вызываются только в эффекте ниже
export const useAudioPlayer = () => {
    const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { album, trackIndex, isPlaying } = state;
    const src = album?.tracks[trackIndex]?.path ?? null;

    // Громкость из localStorage; на тач-устройствах она всегда 1
    useEffect(() => {
        if (isTouchDevice()) return;
        const saved = parseFloat(localStorage.getItem(VOLUME_KEY) || "1");
        if (!Number.isNaN(saved)) setVolume(saved);
    }, []);

    // src в зависимостях: новый трек или заново открытый плеер нужно запустить, даже если isPlaying не менялся
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying && src) {
            playAudio(audio, () => dispatch({ type: 'playFailed' }));
        } else {
            audio.pause();
        }
    }, [isPlaying, src]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume, src]);

    const changeVolume = useCallback((value: string) => {
        setVolume(parseFloat(value));
        localStorage.setItem(VOLUME_KEY, value);
    }, []);

    return {
        album,
        trackIndex,
        isPlaying,
        volume,
        audioRef,
        src,
        selectAlbum: useCallback((album: IAlbums) => dispatch({ type: 'selectAlbum', album }), []),
        close: useCallback(() => dispatch({ type: 'close' }), []),
        selectTrack: useCallback((index: number) => dispatch({ type: 'selectTrack', index }), []),
        togglePlay: useCallback(() => dispatch({ type: 'togglePlay' }), []),
        next: useCallback(() => dispatch({ type: 'next' }), []),
        prev: useCallback(() => dispatch({ type: 'prev' }), []),
        handleEnded: useCallback(() => dispatch({ type: 'ended' }), []),
        changeVolume,
    };
};
