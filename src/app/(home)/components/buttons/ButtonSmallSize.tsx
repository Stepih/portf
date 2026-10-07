"use client";

import { FC } from "react";

import Link from "next/link";
import { motion } from "framer-motion";
import { ym } from "next-yandex-metrica";

import s from './ButtonSmallSize.module.scss';
import { ISmallHomeButtons } from "@/interfaces/homeButtons";
import ArrowLink from "@/components/arrow-link/ArrowLink";


const animationVariants = {
  img: { hover: { opacity: 0 } },
  txt: { hover: { opacity: 1, width: 160} },
  arrow: { hover: { opacity: 1 } },
  wrapper: { hover: { width: 210, cursor: 'pointer' } },
};

const ButtonSmallSize: FC<ISmallHomeButtons> = ({ Icon, title, srcSmall }) => (
  <Link
    onClick={() => ym(99704852, 'reachGoal', title)}
    className={s.link} href={srcSmall || '/'}>
    <motion.div 
    whileTap={{scale: .9}}
      whileHover="hover" 
      variants={animationVariants.wrapper} 
      className={s.wrapper}
    >
      <motion.div variants={animationVariants.img}>
        
        <Icon className={s.img} />
      </motion.div>

      <motion.span variants={animationVariants.txt} className={s.title}>
        {title}
      </motion.span>

      <motion.div className={s.arrow} variants={animationVariants.arrow}>
        <ArrowLink />
      </motion.div>
    </motion.div>
  </Link>
);

export default ButtonSmallSize;
