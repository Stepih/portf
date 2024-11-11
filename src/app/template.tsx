"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import s from './template.module.scss';

export default function Template({ children }: { children: React.ReactNode }) {

  const [isAnimating, setIsAnimating] = useState(true); // Сначала анимация включена

  const handleAnimationComplete = () => {
    setIsAnimating(false); // Завершаем анимацию
  };

  const handleAnimationStart = () => {
    setIsAnimating(true); // Начинаем анимацию
  };

  return (
    <motion.div
      onAnimationStart={handleAnimationStart} // Срабатывает при начале анимации
      className={s.content} // Класс для остального стиля
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.75 }}
      onAnimationComplete={handleAnimationComplete} // Срабатывает после завершения анимации
      style={{
        willChange: 'unset'
      }}
    >
      {children}
    </motion.div>
  );
}
