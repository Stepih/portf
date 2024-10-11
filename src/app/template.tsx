"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import s from './template.module.scss'

export default function Template({ children }: { children: React.ReactNode }) {

  const [isAnimating, setIsAnimating] = useState(false);
  const handleAnimationComplete = () => {
    setIsAnimating(false);
    // Дополнительные действия по завершении анимации
  };
  const handleAnimationStart = () => {
    setIsAnimating(true);
    // Дополнительные действия по завершении анимации
  };
  
  return (
    <motion.div
      onAnimationStart={handleAnimationStart}
      className={`${s.content} ${!isAnimating ? s.wc : ''}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1}}
      transition={{ ease: "easeInOut", duration: 0.75 }}
      onAnimationComplete={handleAnimationComplete}
    >
      {children}
    </motion.div>
  );
}