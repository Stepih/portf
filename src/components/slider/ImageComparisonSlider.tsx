"use client";
import { FC, useEffect, useState, MouseEvent, TouchEvent } from "react";
import Image from "next/image";

import styles from './ImageComparisonSlider.module.scss';

interface ImageComparisonSliderProps {
  lowQualitySrc: string;
  highQualitySrc: string;
  step: number;
  handleLoad: () => void;
}

const ImageComparisonSlider: FC<ImageComparisonSliderProps> = ({
  lowQualitySrc,
  highQualitySrc,
  step,
  handleLoad
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // Начальная позиция ползунка в центре
  const [loadCheck, setLoadCheck] = useState({ low: false, high: false });

  // Функция для перемещения ползунка
  const handleMove = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    const sliderContainer = e.currentTarget;
    const rect = sliderContainer.getBoundingClientRect();
    const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX;
    const offsetX = clientX - rect.left;
    const newPosition = Math.min(Math.max((offsetX / rect.width) * 100, 0), 100); // Ограничиваем диапазон [0, 100]
    setSliderPosition(newPosition);
  };

  // Вызываем handleLoad только если оба изображения загружены
  useEffect(() => {
    if (loadCheck.low && loadCheck.high) {
      handleLoad();
    }
  }, [loadCheck]);

  return (
    <div
      className={styles.sliderContainer}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* Левая часть изображения (низкое качество) */}
      <div className={styles.imageWrapper}>
        <h2 style={{ opacity: sliderPosition / 100 + 0.3 }} className={styles.titleLow}>
          До
        </h2>
        <Image
          onLoad={() => setLoadCheck((prev) => ({ ...prev, low: true }))}
          src={lowQualitySrc}
          priority={step === 0} // Priority только для первого изображения
          alt="Low Quality"
          fill
          sizes="100%"
          draggable="false"
          className={styles.image}
        />
      </div>

      {/* Правая часть изображения (высокое качество), обрезана по положению слайдера */}
      <div
        className={`${styles.imageWrapper} ${styles.imageWrapperHigh}`}
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <h2 style={{ opacity: (1 - sliderPosition / 100) + 0.3 }} className={styles.titleHigh}>
          После
        </h2>
        <Image
          onLoad={() => setLoadCheck((prev) => ({ ...prev, high: true }))}
          src={highQualitySrc}
          priority={step === 0} // Priority только для первого изображения
          alt="High Quality"
          fill
          sizes="100%"
          draggable="false"
          className={styles.image}
        />
      </div>

      {/* Вертикальный ползунок-разделитель */}
      <div className={styles.handle} style={{ left: `${sliderPosition}%` }} />
    </div>
  );
};

export default ImageComparisonSlider;
