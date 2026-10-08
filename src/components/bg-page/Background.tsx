"use client";

import { FC, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { animate, useMotionValue, useMotionValueEvent, useScroll } from "framer-motion";

import s from "./Background.module.scss";
import { BgRectangle1, BgRectangle2 } from "./BgRectangle";
import { useIsTouchDevice } from "@/hooks/useIstouchDevice";

const BackgroundPage: FC = () => {
  const touchDevice = useIsTouchDevice(); // Определение сенсорного устройства
  
  const [currentUrl, setCurrentUrl] = useState('');
  const { scrollY } = useScroll();
  const parallax = useMotionValue(0);
  const [showRectangles, setShowRectangles] = useState(false); // Состояние для отображения ректанглов
  const pathname = usePathname(); // Получение текущего пути

  useEffect(() => {
    // Разбиваем путь на сегменты
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments.length > 0 ? `/${segments[segments.length - 1]}` : '/';
    setCurrentUrl(lastSegment);
  }, [pathname]);

  // Параллакс без ре-рендеров: догоняем 1/20 прокрутки твином 0.3 с, как раньше делал animate
  useMotionValueEvent(scrollY, "change", (y) => {
    if (touchDevice) return; // На сенсорных устройствах фигур нет
    animate(parallax, y / 20, { duration: 0.3, ease: "easeInOut" });
  });

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
