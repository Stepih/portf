import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";

import s from './Player.module.scss';
import Commands from "./commands/Command";
import { ISwitchTrack } from "@/interfaces/player";
import { IAlbums } from "@/interfaces/albums";
import { canada } from "@/fonts/fonts";
import Volume from "./commands/Volume";
import LineTrack from "./commands/LineTrack";
import AlbumInfo from "./album/AlbumInfo";

import Krest from '@/assets/_img/icons/krest.svg';
import List from '@/assets/_img/icons/list.svg';

import BgFocus from "@/components/bg-page/BgFocus";
import { isTouchDevice } from "@/scripts/typeDevice";

interface IPlayer extends ISwitchTrack {
  album: IAlbums,
  handleAlbumSelect: (album: IAlbums | null) => void,
  handleListTracks: () => void,
  isAudioReady: boolean,
  setIsAudioReady: Dispatch<SetStateAction<boolean>>,
  
}

const Player: FC<IPlayer> = ({isAudioReady, setIsAudioReady, handleAlbumSelect, handleListTracks, audioRef, album, handleTrackSelect, trackId, statusPlay }) => {
  const [volume, setVolume] = useState<number>(1);
  const [anim, setAnim] = useState(0)
  const [hover, setHover] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0);

  const mobileDevice = isTouchDevice()
  

  if (anim === 0) {
    setTimeout(() => {
      setAnim(1)
    }, 5000);
  }

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
  

  // Загружаем громкость из localStorage при первом рендере и инициализируем аудио
  useEffect(() => {
    if (mobileDevice) return setVolume(1)
    const savedVolume = parseFloat(localStorage.getItem("playerVolume") || "1");
    setVolume(savedVolume);
    
  }, []);

  // Обновляем громкость и управляем воспроизведением
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      statusPlay.play ? isAudioReady && audioRef.current.play() : audioRef.current.pause();
    }
  }, [volume, statusPlay, isAudioReady]);

  // Обработчик изменения громкости
  const handleVolumeChange = (num: string) => {
    setVolume(parseFloat(num));
    localStorage.setItem("playerVolume", num);
  };


  return (
    <>
    <BgFocus status={hover}/>
    
    <motion.div onHoverEnd={() => setHover(false)} onHoverStart={() => setHover(true)} 
      className={`${s.wrapper} ${canada.className}`} 
      initial={{ y: 40, opacity: 0, willChange: 'auto' }} 
      animate={{ y: !hover && !mobileDevice ? 60 : 0, opacity: 1 }}
      >
      <div className={s.content}>
        <LineTrack isAudioReady={isAudioReady} loadProgress={loadProgress} audioRef={audioRef} trackId={trackId} albumId={album.id} />

        <div className={s.panel}>
          <Commands
            statusPlay={statusPlay}
            audioRef={audioRef}
            countTracks={album.tracks.length}
            handleTrackSelect={handleTrackSelect}
            trackId={trackId}
          />
          <motion.div className={s.img} whileTap={{ scale: 0.9 }} onClick={handleListTracks}>
            <List />
          </motion.div>
          
          <AlbumInfo key={trackId} trackId={trackId} album={album} />
        </div>

        {/* Ползунок громкости */}
        <div className={s.right}>
          {!mobileDevice && <Volume handleVolumeChange={handleVolumeChange} volume={volume} />}
          <Krest className={s.img} onClick={() => handleAlbumSelect(null)}/>
          
        </div>

        {/* Элемент аудио */}
        <audio 
          onCanPlay={() => {setIsAudioReady(true)}}
          src={album.tracks[trackId].path}
          className={s.audio} 
          ref={audioRef} 
          controls 
          key={album.tracks[trackId].path}
          onProgress={handleAudioProgress}
          onEnded={() => statusPlay.setPlay(false)}
          >
          
        </audio>
      </div>
    </motion.div>
    </>
    
  );
};

export default Player;
