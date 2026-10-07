"use client";

import { motion } from "framer-motion";

import s from './template.module.scss';
import { YandexMetricaProvider } from "next-yandex-metrica";

export default function Template({ children }: { children: React.ReactNode }) {


  return (
    <YandexMetricaProvider tagID={99704852} initParameters={{ clickmap: true, trackLinks: true, accurateTrackBounce: true }}>
    <motion.div
      className={s.content} // Класс для остального стиля
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.75 }}
      style={{
        willChange: 'unset'
      }}
    >
      {children}
    </motion.div>
    </YandexMetricaProvider>
  );
}
