"use client";

import { FC, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import s from "./Background.module.scss";
import { BgRectangle1, BgRectangle2 } from "./BgRectangle";
import { useIsTouchDevice } from "@/hooks/useIstouchDevice";

const BackgroundPage: FC = () => {
  const touchDevice = useIsTouchDevice(); // Определение сенсорного устройства
  
  const [currentUrl, setCurrentUrl] = useState('');
  const [parallax, setParallax] = useState(0);
  const [showRectangles, setShowRectangles] = useState(false); // Состояние для отображения ректанглов
  const pathname = usePathname(); // Получение текущего пути

  useEffect(() => {
    // Разбиваем путь на сегменты
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments.length > 0 ? `/${segments[segments.length - 1]}` : '/';
    setCurrentUrl(lastSegment);
  }, [pathname]);

  useEffect(() => {
    if (touchDevice) return; // Если сенсорное устройство, не добавляем обработчик прокрутки

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setParallax(-scrollPosition / -20); // Вычисление параллакса
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [touchDevice]); // Добавляем зависимость от touchDevice

  useEffect(() => {
    setShowRectangles(true); // Показываем ректанглы сразу при загрузке
  }, []);

  return (
    <div className={`${s.bg}`}>
      {!touchDevice && showRectangles && (
        <>
          <BgRectangle1 currentUrl={currentUrl} parallax={parallax} />
          <BgRectangle2 currentUrl={currentUrl} parallax={parallax} />
        </>
      )}
    </div>
  );
};

export default BackgroundPage;
