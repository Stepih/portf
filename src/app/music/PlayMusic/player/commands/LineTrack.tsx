import { FC, useEffect, useState, PointerEvent, RefObject } from "react";
import { motion } from "framer-motion";
import { formatTime } from "@/scripts/formatTime";
import s from './LineTrack.module.scss';

interface ILineTrack {
  isAudioReady: boolean,
  audioRef: RefObject<HTMLAudioElement | null>,
  trackId: number,
  albumId: number,
  loadProgress: number,
}

const LineTrack: FC<ILineTrack> = ({isAudioReady, audioRef, trackId, albumId, loadProgress }) => {
  const [time, setTime] = useState(0); // Текущее время трека
  const [duration, setDuration] = useState(0); // Длительность трека
  const [isSeeking, setIsSeeking] = useState(false); // Перематывает ли сейчас пользователь
  const [showTimePosition, setShowTimePosition] = useState(0); // Позиция showTime
  const [hoverTime, setHoverTime] = useState(0); // Время трека при наведении

  

  // Обработчик загрузки метаданных и обновления времени
  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0);
        setTime(0);
      };

      // Обновление текущего времени при проигрывании
      const handleTimeUpdate = () => {
        if (!isSeeking) {
          setTime(audio.currentTime);
        }
      };

      // Метаданные могли загрузиться до подписки
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
        setDuration(audio.duration || 0);
      }

      // Добавляем слушателей
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);

      // Очищаем слушателей при размонтировании
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [audioRef, trackId, albumId, isSeeking]);

  // Обработка начала перемотки. Захват указателя оставляет перемотку за линией, даже если палец или курсор ушёл с неё
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (isAudioReady) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsSeeking(true);
      updateTimeByClick(e);
    }
  };

  // Обновление времени при перемещении указателя
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (isSeeking) {
      updateTimeByClick(e);
    }

    // Обновляем позицию showTime при любом движении мыши
    updateShowTimePosition(e);
  };

  // Завершение перемотки
  const handlePointerUp = () => {
    setIsSeeking(false);
  };

  // Положение указателя на линии, ограниченное её краями
  const getPointerX = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: Math.min(Math.max(e.clientX - rect.left, 0), rect.width), width: rect.width };
  };

  // Обновление текущего времени по позиции клика или движения указателя
  const updateTimeByClick = (e: PointerEvent<HTMLDivElement>) => {
    const { x, width } = getPointerX(e);
    if (!audioRef.current || !duration || !width) return;
    const newTime = (x / width) * duration;
    audioRef.current.currentTime = newTime;
    setTime(newTime);
  };

  // Обновление позиции элемента showTime по диагонали
  const updateShowTimePosition = (e: PointerEvent<HTMLDivElement>) => {
    const { x: relativeX, width } = getPointerX(e); // Положение по X
    if (!width) return;

    // Обновляем позицию showTime только по диагонали
    setShowTimePosition(relativeX);

    // Обновляем время, соответствующее позиции на линии
    const hoverTime = (relativeX / width) * duration;
    setHoverTime(hoverTime);
  };

  const vars = {
    hover: {
      opacity: 1
    }
  }

  return (
    <motion.div
      whileHover="hover"
      className={s.line}
      onPointerDown={handlePointerDown}     // Начало перемотки
      onPointerMove={handlePointerMove}     // Перемещение указателя для обновления
      onPointerUp={handlePointerUp}         // Завершение перемотки
      onPointerCancel={handlePointerUp}     // Жест прерван браузером
    >
      {/* Текущее время */}
      <motion.span variants={vars} className={s.currentTime}>{formatTime(time)}</motion.span>
      
      {/* Прогресс-бар */}
      <motion.div
        animate={{ width: `${duration > 0 ? Math.min(time / duration, 1) * 100 : 0}%` }}
        transition={{ duration: 0.1 }}
        className={s.progressBar}
      >
      </motion.div>
      <motion.div 
        animate={{width: `${loadProgress}%`}} 
        className={s.progressSubBar} 
        style={{background: 'grey'}}>

      </motion.div>
      
      {/* Оставшееся время */}
      <motion.span variants={vars} className={s.remainingTime}>{formatTime(Math.max(duration - time, 0))}</motion.span>

      {/* Элемент showTime, перемещаемый по диагонали */}
      <motion.div 
        initial={{ opacity: 0 }}
        className={s.showTime} 
        variants={{ hover: { opacity: 1 } }}
        style={{
          position: 'absolute',
          left: `${showTimePosition}px`,
        }}
      >
        {formatTime(hoverTime)}
      </motion.div>
    </motion.div>
  );
};

export default LineTrack;
