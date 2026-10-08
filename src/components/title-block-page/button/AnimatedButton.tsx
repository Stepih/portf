"use client"

import { FC } from "react";
import { motion } from "framer-motion";
import Link from "next/link"; // Импортируем Link из Next.js
import styles from "./AnimatedButton.module.scss"; // Импорт вашего SCSS файла

const AnimatedButton: FC = () => {
  return (
    <Link style={{position: 'absolute', overflow: 'hidden', textDecoration: 'none', display: 'block'}} href="/" passHref>
      {/* tabIndex=-1: иначе framer-motion из-за whileTap ставит div в Tab-порядок второй остановкой после ссылки */}
      <motion.div
        tabIndex={-1}
        className={styles.button}
        whileHover="hover"
        whileTap={{ scale: 0.9 }}
        initial="default"
        animate="default"
      >
        <motion.span className={styles.text}>На главную</motion.span>
        <motion.svg
          className={styles.borderAnimation}
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
        <motion.path
          d="M1,13 
            Q1,1 13,1 
            H198 
            V78 
            H1 
            V13 
            Z" // Путь с закругленным верхним левым углом
          fill="none"
          strokeWidth="8"
          strokeDasharray="600"
          strokeDashoffset="600"
          variants={{
            default: { strokeDashoffset: 600 },
            hover: { strokeDashoffset: 0 },
          }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        </motion.svg>
      </motion.div>
    </Link>
  );
};

export default AnimatedButton;
