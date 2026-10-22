"use client";
import { FC, useEffect, useState, MouseEvent, TouchEvent } from "react";
import Image from "next/image";

import styles from './ImageComparisonSlider.module.scss';

interface ImageComparisonSliderProps {
  lowQualitySrc: string;
  highQualitySrc: string;
  step: number;
  handleLoad: () => void;
  // Ширина картинки на экране для next/image: от неё зависит, какой вариант скачает браузер
  sizes?: string;
}

const ImageComparisonSlider: FC<ImageComparisonSliderProps> = ({
  lowQualitySrc,
  highQualitySrc,
  step,
  handleLoad,
  sizes = "100vw"
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
        {/* Подпись, а не заголовок: h2 в каждом слайде засоряли структуру страницы */}
        <p style={{ opacity: sliderPosition / 100 + 0.3 }} className={styles.titleLow}>
          До
        </p>
        <Image
          onLoad={() => setLoadCheck((prev) => ({ ...prev, low: true }))}
          src={lowQualitySrc}
          priority={step === 0} // Priority только для первого изображения
          alt="Фото до обработки"
          fill
          sizes={sizes}
          draggable="false"
          className={styles.image}
        />
      </div>

      {/* Правая часть изображения (высокое качество), обрезана по положению слайдера */}
      <div
        className={`${styles.imageWrapper} ${styles.imageWrapperHigh}`}
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <p style={{ opacity: (1 - sliderPosition / 100) + 0.3 }} className={styles.titleHigh}>
          После
        </p>
        <Image
          onLoad={() => setLoadCheck((prev) => ({ ...prev, high: true }))}
          src={highQualitySrc}
          priority={step === 0} // Priority только для первого изображения
          alt="Фото после обработки"
          fill
          sizes={sizes}
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
