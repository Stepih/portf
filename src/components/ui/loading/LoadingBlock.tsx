"use client";

import { FC, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import debounce from 'lodash/debounce'
import s from './LoadingBlock.module.scss';
import { ralewayBold } from "@/app/fonts/fonts";

const LoadingBlock: FC = () => {
  const divRef = useRef<HTMLDivElement | null>(null);
  const childRef = useRef<HTMLDivElement | null>(null);
  const [sizes, setSizes] = useState({ parentWidth: 0, parentHeight: 0, childWidth: 0, childHeight: 0 });

  useEffect(() => {
    const updateSizes = () => {
      if (divRef.current && childRef.current) {
        const parentRect = divRef.current.getBoundingClientRect();
        const childRect = childRef.current.getBoundingClientRect();
        setSizes({
          parentWidth: parentRect.width,
          parentHeight: parentRect.height,
          childWidth: childRect.width,
          childHeight: childRect.height,
        });
      }
    };

    
    updateSizes();
    const handleResize = debounce(updateSizes, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      ref={divRef}
      className={s.load}
    >
      <motion.b
        ref={childRef}
        className={ralewayBold.className}
        initial={{ x: 0, y: 0 }} // Начальная позиция
        animate={{
          x: [0, sizes.parentWidth - sizes.childWidth], // Двигаемся по оси X
          y: [0, sizes.parentHeight - sizes.childHeight], // Двигаемся по оси Y
        }}
        transition={{
          x: {
            duration: 3, // Время для одной анимации по оси X
            repeat: Infinity, // Бесконечное повторение
            repeatType: 'mirror', // Плавное отскоковое движение
            ease: 'linear', // Плавное движение
          },
          y: {
            duration: 4.4, // Время для одной анимации по оси Y
            repeat: Infinity, // Бесконечное повторение
            repeatType: 'mirror', // Плавное отскоковое движение
            ease: 'linear', // Плавное движение
          },
        }}
      >
        Загрузка
      </motion.b>
    </motion.div>
  );
};

export default LoadingBlock;
