import { FC, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ym } from 'next-yandex-metrica';

import s from './ButtonStandartSize.module.scss';
import { IStandartHomeButtons } from "@/interfaces/homeButtons";
import ArrowLink from "@/components/arrow-link/ArrowLink";
import { useIsTouchDevice } from "@/hooks/useIstouchDevice";

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

const ButtonStandartSize: FC<IStandartHomeButtons> = ({ Icon, title, srcStandart }) => {
  const [clicked, setClicked] = useState(false);

  // Используем хук, чтобы определить, является ли устройство сенсорным
  const mobileDevice = useIsTouchDevice();
  
  return (
    <motion.div
      onClick={() => {setClicked(!clicked); ym(99704852, 'reachGoal', title)}}
      className={s.wrapperMain}
      whileTap={{ scale: !clicked ? 0.9 : 1 }}
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
        <Icon className={s.img}/>
        <p className={s.titleBtn}>{title}</p>
      </motion.div>

      {/* Подменю кнопок */}
      <motion.div
        className={s.wrapper_subbotun}
        initial={{ position: 'absolute', top: 0, opacity: 0, width: '100%' }}
        animate={clicked ? 'visible' : 'hide'}
        variants={hoverVariants}
      >
        {srcStandart?.map((btn) => (
          <motion.div key={btn.key} className={s.subbutton} whileTap={{scale: .9}} whileHover="hover">
            <motion.div className={s.link}>
              <Link
                onClick={() => ym(99704852, 'reachGoal', btn.title)}
                href={btn.src}
                style={{ pointerEvents: clicked ? "all" : "none" }}
              />
            </motion.div>

            <motion.div variants={subImgVariants}>
              {!mobileDevice && <btn.Icon className={s.subimg} />}
            </motion.div>

            <motion.span animate={{opacity: mobileDevice ? 1 : 0}} className={s.subtitle} variants={subtitleVariants}>
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
