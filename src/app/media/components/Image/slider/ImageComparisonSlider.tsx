"use client"
import { FC } from "react";
import Image, { StaticImageData } from 'next/image';
import { useState, MouseEvent, TouchEvent } from 'react';
import { motion } from "framer-motion";

import styles from './ImageComparisonSlider.module.scss';

interface ImageComparisonSliderProps {
  lowQualitySrc: StaticImageData,
  highQualitySrc: StaticImageData,
  step: number
}

const ImageComparisonSlider: FC<ImageComparisonSliderProps> = ({ lowQualitySrc, highQualitySrc, step }) => {
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
    <motion.div
      className={styles.sliderContainer}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      initial={{y: 100, opacity: 0}}
      animate={{y: 0, opacity: 1}}
    >
      {/* Левая часть изображения (низкое качество) */}
      <div className={styles.imageWrapper}>
        {step === 0 ? (
          <Image src={lowQualitySrc} priority alt="Low Quality" fill sizes="100%" className={styles.image} />
        ) : (
          <Image src={lowQualitySrc} alt="Low Quality" fill sizes="100%" className={styles.image} />
        )}
        
      </div>

      {/* Правая часть изображения (высокое качество), обрезана по положению слайдера */}
      <div className={styles.imageWrapper} style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
      {step === 0 ? (
          <Image src={highQualitySrc} priority alt="High Quality" fill sizes="100%" className={styles.image} />
        ) : (
          <Image src={highQualitySrc} alt="High Quality" fill sizes="100%" className={styles.image} />
        )}
      </div>

      {/* Вертикальный ползунок-разделитель */}
      <div className={styles.handle} style={{ left: `${sliderPosition}%` }} />
    </motion.div>
  );
};

export default ImageComparisonSlider;
