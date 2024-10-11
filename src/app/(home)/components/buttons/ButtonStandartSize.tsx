"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

import s from './ButtonStandartSize.module.scss';
import { IStandartHomeButtons } from "@/interfaces/homeButtons";
import ArrowLink from "@/components/arrow-link/ArrowLink";


const hoverVariants = {
  hide: { opacity: 0 },
  visible: { opacity: 1 },
};

const subImgVariants = {
  hover: { transform: 'translateY(-90px)' },
};

const subtitleVariants = {
  hover: { opacity: 1 },
};

const ButtonStandartSize: FC<IStandartHomeButtons> = ({ img, title, srcStandart }) => {
  const [clicked, setClicked] = useState(false);

  return (
    <motion.div
      onClick={() => setClicked(!clicked)}
      className={s.wrapperMain}
      whileTap={{ scale: 0.9 }}
    >
      {/* Заголовок, который появляется при клике */}
      <motion.h2
        className={s.clickTitle}
        style={{ pointerEvents: clicked ? "all" : "none" }}
        animate={clicked ? 'visible' : 'hide'}
        variants={hoverVariants}
      >
        {title}
      </motion.h2>

      {/* Главное изображение и текст до клика */}
      <motion.div
        className={s.wrapper}
        animate={clicked ? 'hide' : 'visible'}
        variants={hoverVariants}
      >
        <Image className={s.img} src={img} alt={title} />
        <p>{title}</p>
      </motion.div>

      {/* Подменю кнопок */}
      <motion.div
        className={s.wrapper_subbotun}
        initial={{ position: 'absolute', top: 0, opacity: 0, width: '100%' }}
        animate={clicked ? 'visible' : 'hide'}
        variants={hoverVariants}
      >
        {srcStandart?.map((btn) => (
          <motion.div key={btn.key} className={s.subbutton} whileHover="hover">
            <motion.div className={s.link}>
              <Link
                href={btn.src}
                style={{ pointerEvents: clicked ? "all" : "none" }}
              />
            </motion.div>

            <motion.div variants={subImgVariants}>
              <Image className={s.subimg} src={btn.img} alt={btn.title} />
            </motion.div>

            <motion.span className={s.subtitle} variants={subtitleVariants}>
              {btn.title}
            </motion.span>

            <ArrowLink />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ButtonStandartSize;
