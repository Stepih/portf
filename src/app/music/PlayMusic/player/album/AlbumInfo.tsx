import { FC } from "react";
import { motion } from "framer-motion";

import s from './AlbumInfo.module.scss'
import { IAlbums } from "@/interfaces/albums";
import Image from "next/image";

interface Info {
  album: IAlbums,
  trackId: number
}



const AlbumInfo:FC<Info> =({album, trackId}) => {

  return (
    <motion.div initial={{opacity: 0, x: 100}} animate={{opacity: 1, x: 0}} className={s.album}>
      {album.img ? (
        <Image className={s.img} width={50} height={50} src={album.img} alt="Обложка" />
      ) : (
        <div className={s.noImg}>
          <p>{album.name}</p>
        </div>
      )}
      <div>
        <span className={s.title}>{album.tracks[trackId].name}</span>
        <span className={s.artist}>{album.artist}</span>
      </div>
    </motion.div>
  )
}

export default AlbumInfo