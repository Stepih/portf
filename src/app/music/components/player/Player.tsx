import { FC, useEffect, useRef, useState } from "react";
import Image from "next/image";
import krest from '@/assets/_img/icons/krest.svg'
import list from '@/assets/_img/icons/list.svg'

import { motion } from "framer-motion";

import s from './Player.module.scss';
import Commands from "./commands/Command";
import { ISwitchTrack } from "@/interfaces/player";
import { IAlbums } from "@/interfaces/albums";
import { canada } from "@/fonts/fonts";
import Volume from "./commands/Volume";
import LineTrack from "./commands/LineTrack";
import AlbumInfo from "./album/AlbumInfo";

interface IPlayer extends ISwitchTrack {
  album: IAlbums,
  handleAlbumSelect: (album: IAlbums | null) => void,
  handleListTracks: () => void
}

const Player: FC<IPlayer> = ({handleAlbumSelect, handleListTracks, audioRef, album, handleTrackSelect, trackId, statusPlay }) => {
  const [volume, setVolume] = useState<number>(1);

  const isVolumeInitialized = useRef(false); // Контроль установки начальной громкости
    
  // Загружаем громкость из localStorage при первом рендере
  useEffect(() => {
    const savedVolume = localStorage.getItem("playerVolume");
    if (savedVolume) {
      const volumeValue = parseFloat(savedVolume);
      setVolume(volumeValue);
      if (audioRef.current) {
        audioRef.current.volume = volumeValue; // Устанавливаем громкость сразу
        isVolumeInitialized.current = true; // Отмечаем, что громкость инициализирована
      }
    } else {
      isVolumeInitialized.current = true;
    }
  }, []);


  // Обновляем громкость аудио-элемента при изменении состояния `volume`
  useEffect(() => {
    if (audioRef.current && isVolumeInitialized.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);


  // Управляем статусом воспроизведения
  useEffect(() => {
    
    if (audioRef.current) {
      audioRef.current.volume = volume; // Устанавливаем громкость перед воспроизведением
      if (statusPlay.play) {
        setTimeout(() => {
          audioRef.current?.play();
        }, 10);
        
      } else {
        audioRef.current.pause();
      }
    }
    
  }, [statusPlay]);

  // Обработчик изменения громкости
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    localStorage.setItem("playerVolume", newVolume.toString()); // Сохраняем уровень громкости в localStorage
  };

  return (
    <>
    
    <motion.div className={`${s.wrapper} ${canada.className}`} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <div className={s.content}>

        <LineTrack audioRef={audioRef} trackId={trackId} albumId={album.id}  />

        <div className={s.panel}>
          <Commands
            statusPlay={statusPlay}
            audioRef={audioRef}
            countTracks={album.tracks.length}
            handleTrackSelect={handleTrackSelect}
            trackId={trackId}
          />
          <motion.div className={s.img} whileTap={{scale: .9}}>
            <Image
           
            src={list}
            alt={'Показать треки'}
            height={15}
            onClick={handleListTracks}
            />
          </motion.div>

          <AlbumInfo trackId={trackId} album={album}/>
        </div>

        {/* Ползунок громкости */}
        <div className={s.right}>
          
          <Volume handleVolumeChange={handleVolumeChange} volume={volume} />
          <Image 
            className={s.img}
            width={15}
            height={15}
            src={krest} 
            alt="Закрыть" 
            onClick={() => {handleAlbumSelect(null)}} />
        </div>

        {/* Элемент аудио */}
        <audio className={s.audio} ref={audioRef} controls key={album.tracks[trackId].path}>
          <source src={album.tracks[trackId].path} type="audio/mpeg" />
        </audio>
      </div>
    </motion.div>
    </>
    
  );
};

export default Player;
