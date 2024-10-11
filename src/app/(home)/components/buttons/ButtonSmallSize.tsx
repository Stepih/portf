"use client";

import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import s from './ButtonSmallSize.module.scss';
import { ISmallHomeButtons } from "@/interfaces/homeButtons";
import ArrowLink from "@/components/arrow-link/ArrowLink";


const animationVariants = {
  img: { hover: { opacity: 0 } },
  txt: { hover: { opacity: 1, width: 160, color: 'white' } },
  arrow: { hover: { opacity: 1 } },
  wrapper: { hover: { width: 210, cursor: 'pointer' } },
};

const ButtonSmallSize: FC<ISmallHomeButtons> = ({ img, title, srcSmall }) => (
  <Link className={s.link} href={srcSmall || '/'}>
    <motion.div 
      whileHover="hover" 
      variants={animationVariants.wrapper} 
      className={s.wrapper}
    >
      <motion.div variants={animationVariants.img}>
        <Image className={s.img} src={img} alt={title} />
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
