import { FC, RefObject, useEffect, useState } from "react";

import { motion } from "framer-motion";

import s from './Player.module.scss';
import Commands from "./commands/Command";
import { IAlbums } from "@/interfaces/albums";
import { canada } from "@/app/fonts/fonts";
import Volume from "./commands/Volume";
import LineTrack from "./commands/LineTrack";
import AlbumInfo from "./album/AlbumInfo";

import List from '@/assets/_img/icons/list.svg';

import BgFocus from "@/components/bg-page/BgFocus";
import { isTouchDevice } from "@/scripts/typeDevice";
import ClosePlayer from "./commands/ClosePlayer";


interface IPlayer {
  album: IAlbums,
  trackIndex: number,
  src: string,
  isPlaying: boolean,
  volume: number,
  audioRef: RefObject<HTMLAudioElement | null>,
  onTogglePlay: () => void,
  onNext: () => void,
  onPrev: () => void,
  onEnded: () => void,
  onVolumeChange: (value: string) => void,
  onClose: () => void,
  onOpenTracks: () => void,
}

// Состояние и воспроизведение живут в useAudioPlayer; здесь только вид плеера и элемент <audio>
const Player: FC<IPlayer> = ({ album, trackIndex, src, isPlaying, volume, audioRef, onTogglePlay, onNext, onPrev, onEnded, onVolumeChange, onClose, onOpenTracks }) => {
  const [hover, setHover] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0);

  const mobileDevice = isTouchDevice();

  const [showMobilePlayer, setShowMobilePlayer] = useState(true);

  useEffect(() => {
    
    let isScrolling: NodeJS.Timeout | null = null;
  
    const handleScroll = () => {
      if (!mobileDevice) {
        return
      }
      // Если таймер ожидания завершения скролла уже существует, очищаем его
      if (isScrolling) {
        clearTimeout(isScrolling);
      }
  
      // Показываем плеер, пока скролл активен
      setShowMobilePlayer(true);
  
      // Устанавливаем новый таймер на 5 секунд после завершения скролла
      isScrolling = setTimeout(() => {
        setShowMobilePlayer(false);
      }, 5000);
    };
  
    // Добавляем обработчик скролла
    window.addEventListener('scroll', handleScroll);
  
    return () => {
      // Удаляем обработчик скролла при размонтировании
      window.removeEventListener('scroll', handleScroll);
  
      // Очищаем таймер при размонтировании компонента
      if (isScrolling) {
        clearTimeout(isScrolling);
      }
    };
  }, []);
  
  
  // Плеер подсвечен первую секунду после появления
  useEffect(() => {
    const timer = setTimeout(() => setHover(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAudioProgress = () => {
    if (audioRef.current) {
      const audio = audioRef.current;
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const duration = audio.duration;
  
        if (duration > 0) {
          const percent = (bufferedEnd / duration) * 100;
          setLoadProgress(Math.min(percent, 100));
        } else {
          setLoadProgress(0);
        }
      }
    }
  };
  

  return (
    <>
    <BgFocus status={hover}/>
    
    <motion.div onClick={()=>setShowMobilePlayer(true)} onHoverEnd={() => setHover(false)} onHoverStart={() => setHover(true)}
      // С клавиатуры плеер выезжает, пока фокус внутри него
      onFocus={() => setHover(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(false) }}
      className={`${s.wrapper} ${canada.className}`} 
      initial={{ y: 40, opacity: 0, willChange: 'auto' }} 
      animate={{ y: !hover && !mobileDevice ? 60 : showMobilePlayer ? 0 : 60, opacity: 1 }}
      exit={{y: 40, opacity: 0}}
      >
      <div className={s.content}>
        <LineTrack loadProgress={loadProgress} audioRef={audioRef} />

        <div className={s.panel}>
          <Commands
            isPlaying={isPlaying}
            hasPrev={trackIndex > 0}
            hasNext={trackIndex < album.tracks.length - 1}
            onTogglePlay={onTogglePlay}
            onPrev={onPrev}
            onNext={onNext}
          />
          <motion.button type="button" className={s.img} whileTap={{ scale: 0.9 }} onClick={onOpenTracks} aria-label="Список треков">
            <List />
          </motion.button>
          
          <AlbumInfo key={trackIndex} trackIndex={trackIndex} album={album} />
        </div>

        {/* Ползунок громкости */}
        <div className={s.right}>
          {!mobileDevice && <Volume handleVolumeChange={onVolumeChange} volume={volume} />}
          <ClosePlayer onClose={onClose} />
        </div>
        {/* Элемент аудио один на всё время работы плеера: при смене трека меняется только src */}
        <audio
          src={src}
          className={s.audio}
          ref={audioRef}
          controls
          onLoadStart={() => setLoadProgress(0)}
          onProgress={handleAudioProgress}
          onEnded={onEnded}
        />
      </div>
    </motion.div>
    </>
    
  );
};

export default Player;
