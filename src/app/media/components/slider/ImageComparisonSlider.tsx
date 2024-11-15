"use client"
import { FC } from "react";
import Image, { StaticImageData } from 'next/image';
import { useState, MouseEvent, TouchEvent } from 'react';

import styles from './ImageComparisonSlider.module.scss';

interface ImageComparisonSliderProps {
  lowQualitySrc: string,
  highQualitySrc: string,
  step: number,
  nextSlide: (e: React.MouseEvent<HTMLDivElement>) => void
}

const ImageComparisonSlider: FC<ImageComparisonSliderProps> = ({ lowQualitySrc, highQualitySrc, step, nextSlide }) => {
  const [sliderPosition, setSliderPosition] = useState(50); // Начальная позиция ползунка в центре

  const handleMove = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    const sliderContainer = e.currentTarget;
    const rect = sliderContainer.getBoundingClientRect()
    const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX
    const offsetX = clientX - rect.left
    const newPosition = (offsetX / rect.width) * 100
    
    setSliderPosition(newPosition)
    
  };

  return (
      <div
      onClick={nextSlide}
      onContextMenu={nextSlide}
      className={styles.sliderContainer}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      >
      {/* Левая часть изображения (низкое качество) */}
      <div className={styles.imageWrapper}>
        <h2 style={{opacity: sliderPosition / 100 + 0.3}} className={styles.titleLow}>До</h2>
        {step === 0 ? (
          <Image src={lowQualitySrc} priority alt="Low Quality" fill sizes="100%" draggable="false"  className={styles.image} />
        ) : (
          <Image src={lowQualitySrc} alt="Low Quality" fill sizes="100%" draggable="false"  className={styles.image} />
        )}
        
      </div>

      {/* Правая часть изображения (высокое качество), обрезана по положению слайдера */}
      <div
        className={`${styles.imageWrapper} ${styles.imageWrapperHigh}`} 
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
      <h2 style={{opacity: (1 - sliderPosition / 100) + 0.3}} className={styles.titleHigh}>После</h2>
      {step === 0 ? (
          <Image src={highQualitySrc} priority alt="High Quality" fill sizes="100%" draggable="false"  className={styles.image} />
        ) : (
          <Image src={highQualitySrc} alt="High Quality" fill sizes="100%" draggable="false"  className={styles.image} />
        )}
      </div>

      {/* Вертикальный ползунок-разделитель */}
      <div className={styles.handle} style={{ left: `${sliderPosition}%` }} />
    </div>
    
  );
};

export default ImageComparisonSlider;
