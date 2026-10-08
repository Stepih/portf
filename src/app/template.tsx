"use client";

import { motion } from "framer-motion";

import s from './template.module.scss';

export default function Template({ children }: { children: React.ReactNode }) {


  return (
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
  );
}
