"use client";

import { useState, FC } from "react";
import { IAlbums } from "@/interfaces/albums";
import AlbumList from "./album/AlbumList";
import Player from "./player/Player";
import ListTracks from "./player/album/ListTracks";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { AnimatePresence } from "framer-motion";
import { useAudioPlayer } from "./useAudioPlayer";

interface MusicClientProps {
  albums: IAlbums[];
  error?: string
}

const MusicClient: FC<MusicClientProps> = ({ albums, error }) => {
  const player = useAudioPlayer();
  const { album } = player;
  const [popup, setPopup] = useState<boolean>(false)

  // Список треков виден только при выбранном альбоме
  const showList = popup && album !== null;
  useBodyScrollLock(showList);

  const handleListTracks = () => {
    if (!popup) {
      window.scrollTo({
        top: 500,
        behavior: 'instant'
      })
    }
    setPopup(!popup)
  }

  return (
    <>
    {showList && (
      <ListTracks
        album={album}
        trackIndex={player.trackIndex}
        isPlaying={player.isPlaying}
        onSelectTrack={player.selectTrack}
        onClose={handleListTracks}
      />
    )}

    <div style={{display: showList ? 'none' : 'block', pointerEvents: showList ? 'none' : 'all'}}>
      <AlbumList handleAlbumSelect={player.selectAlbum} albums={albums} error={error} />
    </div>
    <AnimatePresence>
      {album && player.src && (
        <Player
          album={album}
          trackIndex={player.trackIndex}
          src={player.src}
          isPlaying={player.isPlaying}
          volume={player.volume}
          audioRef={player.audioRef}
          onTogglePlay={player.togglePlay}
          onNext={player.next}
          onPrev={player.prev}
          onEnded={player.handleEnded}
          onVolumeChange={player.changeVolume}
          onClose={player.close}
          onOpenTracks={handleListTracks}
        />
      )}
    </AnimatePresence>
    </>
  );
};

export default MusicClient;
