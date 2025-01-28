  "use client";

  import { useState, FC, useRef } from "react";
  import { IAlbums } from "@/interfaces/albums";
  import AlbumList from "./album/AlbumList";
  import Player from "./player/Player";
  import ListTracks from "./player/album/ListTracks";
import { bodyLock, bodyUnLock } from "@/scripts/scrollTo";
import { AnimatePresence } from "framer-motion";

  interface MusicClientProps {
    albums: IAlbums[];
    error?: string
  }

  const MusicClient: FC<MusicClientProps> = ({ albums, error }) => {
    const [selectedAlbum, setSelectedAlbum] = useState<IAlbums | null>(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [popup, setPopup] = useState<boolean>(false)

    const [isAudioReady, setIsAudioReady] = useState(true); // для отслеживания что браузер может воспроизвести
    
    const audioRef = useRef<HTMLAudioElement | null>(null);


    const statusPlay = {
      play: isPlaying,
      setPlay: setIsPlaying
    }
    
    const handleAlbumSelect = (album: IAlbums | null) => {
      if (!album) {
        
        setSelectedAlbum(null);
        return;
      }
    
      if (album === selectedAlbum) {
        setIsPlaying((prev) => !prev);
        return;
      }
    
      if (audioRef.current) {
        statusPlay.setPlay(false) // Остановка текущего воспроизведения
        audioRef.current.src = ""; // Сброс источника
      }
    
      setIsAudioReady(false);
      setSelectedAlbum(album);
      setCurrentTrackIndex(0);
      audioRef?.current?.load()
      statusPlay.setPlay(true)
    };
    
    
    const handleTrackSelect = (id: number) => {
      if (audioRef.current) {
        if (currentTrackIndex === id) {
          setIsPlaying((prev) => !prev);
          return
        }
        statusPlay.setPlay(false) // Останавливаем воспроизведение
        audioRef.current.src = ""; // Сбрасываем источник
        
        setCurrentTrackIndex(id) 
        audioRef.current.load();
        statusPlay.setPlay(true)
        
        setIsAudioReady(false); // Сбросить состояние готовности аудио
      }
    };
    

    const handleListTracks = () => {
      // !popup ? document.body.style.overflow = 'hidden' : document.body.style.overflow = 'scroll';
      if (!popup) {
        window.scrollTo({
          top: 500,
          behavior: 'instant'
        })
        bodyLock()
      } else {
        bodyUnLock();
      }
      setPopup(!popup)
    }
    
    
    return (
      <>
      {popup && selectedAlbum && (
        <ListTracks handleListTracks={handleListTracks} handleTrackSelect={handleTrackSelect} trackId={currentTrackIndex} statusPlay={statusPlay} album={selectedAlbum} /> 
      )}
      
      <div style={{display: popup && selectedAlbum ? 'none' :  'block', pointerEvents: popup && selectedAlbum ? 'none' : 'all'}}>
        <AlbumList statusPlay={statusPlay} handleAlbumSelect={handleAlbumSelect} albums={albums} error={error} />
      </div>
      <AnimatePresence>
        {selectedAlbum && (
          <Player isAudioReady={isAudioReady} setIsAudioReady={setIsAudioReady} handleListTracks={handleListTracks} statusPlay={statusPlay} audioRef={audioRef} album={selectedAlbum} handleAlbumSelect={handleAlbumSelect} handleTrackSelect={handleTrackSelect} trackId={currentTrackIndex}/>
        )}
      </AnimatePresence>
      </>
    );
  };

  export default MusicClient;
