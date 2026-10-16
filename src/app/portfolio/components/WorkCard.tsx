"use client";

import { FC, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import s from './WorkCard.module.scss'
import { IPortfolioWork } from "@/interfaces/portfolio";
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { easeOutCubic, passToCenter } from "./easing";
import BrowserFrame from "./BrowserFrame";
import Tags from "./Tags";

interface IProps {
    work: IPortfolioWork,
    num: string,
    mobile: boolean
}

// Карточка сетки: при появлении «откидывается» назад и выпрямляется, макет внутри движется медленнее карточки
const WorkCard: FC<IProps> = ({ work, num, mobile }) => {
    const ref = useRef<HTMLElement>(null);
    const reduceMotion = useReducedMotion();

    // На телефоне карточка успевает выпрямиться раньше: экран короче
    const { scrollYProgress: reveal } = useScroll({ target: ref, offset: ['start end', mobile ? 'start 0.55' : 'start 0.25'] });
    const { scrollYProgress: pass } = useScroll({ target: ref, offset: ['center 1.5', 'center -0.5'] });

    const shown = useTransform(reveal, easeOutCubic);
    const y = useTransform(shown, (e) => (1 - e) * 140);
    const rotateX = useTransform(shown, (e) => (1 - e) * 34);
    const scale = useTransform(shown, (e) => 0.86 + 0.14 * e);
    const opacity = useTransform(shown, (e) => 0.05 + 0.95 * e);

    const center = useTransform(pass, passToCenter);
    const innerY = useTransform(center, (c) => c * 38);
    const innerScale = useTransform(shown, (e) => 1 + (1 - e) * 0.12);

    const href = `${portfolioPageURL}/${work.id}`;

    return (
        <motion.article
            ref={ref}
            className={s.card}
            style={reduceMotion ? undefined : { y, rotateX, scale, opacity, transformPerspective: 1200 }}
        >
            <div className={s.cover} style={{ height: work.coverHeight, backgroundColor: work.tint }}>
                <motion.div className={s.inner} style={reduceMotion ? undefined : { y: innerY, scale: innerScale }}>
                    <BrowserFrame className={s.frame}>
                        <Image
                            className={s.shot}
                            src={work.cover}
                            alt={work.name}
                            fill
                            sizes="(max-width: 899px) 90vw, 320px"
                        />
                    </BrowserFrame>
                </motion.div>
            </div>

            <div className={s.body}>
                <div className={s.meta}>
                    <span className={allerta.className}>{num}</span>
                    <span>{work.year}</span>
                </div>
                <h3 className={`${ralewayBold.className} ${s.title}`}>
                    {/* Ссылка растянута на всю карточку через ::after */}
                    <Link href={href} className={s.link}>{work.name}</Link>
                </h3>
                <p className={s.description}>{work.description}</p>
                <Tags tags={work.tags} />
            </div>
        </motion.article>
    )
}

export default WorkCard
