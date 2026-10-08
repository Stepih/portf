import { FC, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

import s from './AlbumInfo.module.scss';
import { IAlbums } from "@/interfaces/albums";
import Image from "next/image";

interface Info {
  album: IAlbums;
  trackIndex: number;
}

const AlbumInfo: FC<Info> = ({ album, trackIndex }) => {
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controls = useAnimation(); // Анимация текста

  useEffect(() => {
    
      if (titleRef.current && containerRef.current) {
        const titleWidth = titleRef.current.scrollWidth; // Полная ширина текста
        const containerWidth = containerRef.current.offsetWidth; // Ширина контейнера

        
        if (titleWidth > containerWidth) {
          
          controls.set({ x: 0 }); // Сбрасываем transform перед анимацией
          controls.start({
            x: [0, -(titleWidth - containerWidth)], // Анимация смещения
            transition: {  
              duration: 6, // Время анимации в одну сторону
              repeat: Infinity, // Бесконечная анимация
              repeatType: 'reverse', // Движение в обратном направлении
              delay: 1, // Пауза перед началом первой анимации
              repeatDelay: 1, // Пауза перед сменой направления
              ease: "linear", // Равномерное движение\
            }
          });
          
        } else {
          controls.stop(); // Останавливаем анимацию
          controls.set({ x: 0 }); // Сбрасываем transform
        }
      }
    
  }, [trackIndex, album, controls]);


  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      className={s.album}
    >
      {/* Обложка альбома */}
      {album.img ? (
        <Image
          className={s.img}
          width={50}
          height={50}
          src={album.img}
          alt="Обложка"
        />
      ) : (
        <div className={s.noImg}>
          <p>{album.name}</p>
        </div>
      )}
      {/* Контейнер с информацией */}
      <div ref={containerRef} className={s.container}>
        <motion.span
          ref={titleRef}
          className={s.title}
          animate={controls} // Запускаем анимацию только при переполнении
        >
          {album.tracks[trackIndex].name}
        </motion.span>
        <span className={s.artist}>{album.artist}</span>
      </div>
    </motion.div>
  );
};

export default AlbumInfo;
