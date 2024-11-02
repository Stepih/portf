import { FC, useEffect, useState, MouseEvent } from "react";
import { motion } from "framer-motion";
import s from './LineTrack.module.scss';

const LineTrack: FC<any> = ({isAudioReady, audioRef, trackId, albumId, loadProgress }) => {
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

  // Форматирование времени в "минуты:секунды"
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Обработка начала перемотки
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isAudioReady) {
      setIsSeeking(true);
      updateTimeByClick(e);
    }
    
  };

  // Обновление времени при перемещении мыши
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isSeeking) {
      updateTimeByClick(e);
    }

    // Обновляем позицию showTime при любом движении мыши
    updateShowTimePosition(e);
  };

  // Завершение перемотки
  const handleMouseUp = () => {
    setIsSeeking(false);
  };

  // Обновление текущего времени по позиции клика или движения мыши
  const updateTimeByClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    setTime(newTime);
  };

  // Обновление позиции элемента showTime по диагонали
  const updateShowTimePosition = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left; // Положение по X

    // Обновляем позицию showTime только по диагонали
    setShowTimePosition(relativeX);

    // Обновляем время, соответствующее позиции на линии
    const hoverTime = (relativeX / rect.width) * duration;
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
      onMouseDown={handleMouseDown}  // Начало перемотки
      onMouseMove={handleMouseMove}  // Перемещение мыши для обновления
      onMouseUp={handleMouseUp}      // Завершение перемотки
      onMouseLeave={handleMouseUp}   // Если мышь покинула область, завершить перемотку
    >
      {/* Текущее время */}
      <motion.span variants={vars} className={s.currentTime}>{formatTime(time)}</motion.span>
      
      {/* Прогресс-бар */}
      <motion.div
        animate={{ width: `${(time / duration) * 100}%` }}
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
