  "use client";

  import { useState, FC, useRef } from "react";
  import { IAlbums } from "@/interfaces/albums";
  import AlbumList from "./album/AlbumList";
  import Player from "./player/Player";
  import ListTracks from "./player/album/ListTracks";
import { getWidthScroll } from "@/scripts/scrollTo";

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

    
    // Обработчик выбора альбома
    const handleAlbumSelect = (album: IAlbums | null) => {
      if (album) {
        
        if (audioRef.current) {
          statusPlay.setPlay(false) // Останавливаем воспроизведение
          audioRef.current.src = ""; // Сбрасываем источник
        }
      
        setIsAudioReady(false); // Сбросить состояние готовности для нового аудио
        setSelectedAlbum(album);
        setCurrentTrackIndex(0);

        statusPlay.setPlay(true)
      }
    
      if (!album) {
        console.log(123)
        setSelectedAlbum(null);
      }
    };
    
    const handleTrackSelect = (id: number) => {
      if (audioRef.current) {
        
        if (id === currentTrackIndex) {
          statusPlay.setPlay(!statusPlay.play) 
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
      setPopup(!popup)
    }
    const statusPlay = {
      play: isPlaying,
      setPlay: setIsPlaying
    }

    
    
    return (
      <>
      {popup && selectedAlbum && (
        <ListTracks handleListTracks={handleListTracks} handleTrackSelect={handleTrackSelect} trackId={currentTrackIndex} statusPlay={statusPlay} album={selectedAlbum} /> 
      )}
      
      <div style={{display: popup && selectedAlbum ? 'none' :  'block', pointerEvents: popup && selectedAlbum ? 'none' : 'all'}}>
        <AlbumList statusPlay={statusPlay} handleAlbumSelect={handleAlbumSelect} albums={albums} error={error} />
      </div>
      {selectedAlbum && (
        <Player isAudioReady={isAudioReady} setIsAudioReady={setIsAudioReady} handleListTracks={handleListTracks} statusPlay={statusPlay} audioRef={audioRef} album={selectedAlbum} handleAlbumSelect={handleAlbumSelect} handleTrackSelect={handleTrackSelect} trackId={currentTrackIndex}/>
      )}
      </>
    );
  };

  export default MusicClient;
