"use client"; // Указывает, что компонент должен быть клиентским

import { useState, FC, useRef } from "react";
import { IAlbums } from "@/interfaces/albums";
import AlbumList from "./components/album/AlbumList";
import Player from "./components/player/Player";
import ListTracks from "./components/player/album/ListTracks";

interface MusicClientProps {
  albums: IAlbums[];
  error?: string
}

const MusicClient: FC<MusicClientProps> = ({ albums, error }) => {
  const [selectedAlbum, setSelectedAlbum] = useState<IAlbums | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [popup, setPopup] = useState<boolean>(false)

  const audioRef = useRef<HTMLAudioElement | null>(null);

  

  // Обработчик выбора альбома
  const handleAlbumSelect = (album: IAlbums | null) => {
    setSelectedAlbum(album);
    setCurrentTrackIndex(0);
    !album && setPopup(false)
  };
    
  const handleTrackSelect = (id:number) => {
    id === currentTrackIndex && setIsPlaying(!isPlaying)
    setCurrentTrackIndex(id)
  }

  const handleListTracks = () => {
    !popup ? document.body.style.overflow = 'hidden' : document.body.style.overflow = 'scroll';
    setPopup(!popup)
  }
  const statusPlay = {
    play: isPlaying,
    setPlay: setIsPlaying
  }
  
  return (
    <>
    {popup && selectedAlbum && (
      <ListTracks handleTrackSelect={handleTrackSelect} trackId={currentTrackIndex} statusPlay={statusPlay} album={selectedAlbum} /> 
    )}
    
    <div style={{opacity: popup && selectedAlbum ? 0 :  1, pointerEvents: popup && selectedAlbum ? 'none' : 'all'}}>
      <AlbumList handleAlbumSelect={handleAlbumSelect} albums={albums} error={error} />
    </div>
    {selectedAlbum && (
      <Player handleListTracks={handleListTracks} statusPlay={statusPlay} audioRef={audioRef} album={selectedAlbum} handleAlbumSelect={handleAlbumSelect} handleTrackSelect={handleTrackSelect} trackId={currentTrackIndex}/>
    )}
    </>
  );
};

export default MusicClient;
