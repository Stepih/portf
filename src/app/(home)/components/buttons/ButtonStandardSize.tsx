import { FC, KeyboardEvent, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { reachGoal } from '@/scripts/metrika';

import s from './ButtonStandardSize.module.scss';
import { IStandardHomeButtons } from "@/interfaces/homeButtons";
import ArrowLink from "@/components/arrow-link/ArrowLink";
import { useIsTouchDevice } from "@/hooks/useIstouchDevice";

const MotionLink = motion.create(Link);

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

// Раскрывающееся подменю: кнопка-переключатель и список ссылок поверх неё
const ButtonStandardSize: FC<IStandardHomeButtons> = ({ Icon, title, srcStandard }) => {
  const [clicked, setClicked] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Используем хук, чтобы определить, является ли устройство сенсорным
  const mobileDevice = useIsTouchDevice();

  const closeOnEscape = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !clicked) return;
    setClicked(false);
    toggleRef.current?.focus();
  };

  return (
    <div className={s.wrapperMain} onKeyDown={closeOnEscape}>
      <motion.button
        ref={toggleRef}
        type="button"
        className={s.toggle}
        aria-expanded={clicked}
        aria-controls={menuId}
        onClick={() => {setClicked(!clicked); reachGoal(title)}}
        whileTap={{ scale: !clicked ? 0.9 : 1 }}
      >
        {/* Заголовок, который появляется при клике; клик по нему закрывает меню */}
        <motion.span
          className={s.clickTitle}
          style={{ pointerEvents: clicked ? "all" : "none" }}
          animate={clicked ? 'visible' : 'hide'}
          variants={hoverVariants}
        >
          {title}
        </motion.span>

        {/* Главное изображение и текст до клика */}
        <motion.span
          className={s.wrapper}
          animate={clicked ? 'hide' : 'visible'}
          variants={hoverVariants}
        >
          <Icon className={s.img}/>
          <span className={s.titleBtn}>{title}</span>
        </motion.span>
      </motion.button>

      {/* Подменю: закрытое недоступно с клавиатуры и для мыши (inert) */}
      <motion.div
        id={menuId}
        className={s.wrapper_subbotun}
        inert={!clicked}
        initial={{ position: 'absolute', top: 0, opacity: 0, width: '100%' }}
        animate={clicked ? 'visible' : 'hide'}
        variants={hoverVariants}
      >
        {srcStandard?.map((btn) => (
          <MotionLink
            key={btn.key}
            href={btn.src}
            className={s.subbutton}
            onClick={() => reachGoal(btn.title)}
            whileTap={{scale: .9}}
            whileHover="hover"
            whileFocus="hover"
          >
            <motion.div variants={subImgVariants}>
              {!mobileDevice && <btn.Icon className={s.subimg} />}
            </motion.div>

            <motion.span animate={{opacity: mobileDevice ? 1 : 0}} className={s.subtitle} variants={subtitleVariants}>
              {btn.title}
            </motion.span>

            <ArrowLink />
          </MotionLink>
        ))}
      </motion.div>
    </div>
  );
};

export default ButtonStandardSize;
