"use client";

import { FC, useEffect, useRef } from "react";
import { motion, useInView, useMotionTemplate, useScroll, useTransform } from "framer-motion";

import s from './FeaturedCard.module.scss'
import { IPortfolioWork } from "@/interfaces/portfolio";
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { easeOutCubic, passToCenter } from "./easing";
import BrowserFrame from "./BrowserFrame";
import ScrollShot from "./ScrollShot";
import Tags from "./Tags";
import PortfolioLink from "./PortfolioLink";

interface IProps {
    work: IPortfolioWork,
    num: string
}

// Карточка «Избранного»: выезжает снизу при скролле, макеты внутри двигаются с разной скоростью
const FeaturedCard: FC<IProps> = ({ work, num }) => {
    const ref = useRef<HTMLElement>(null);
    const reduceMotion = usePrefersReducedMotion();
    const mobile = useMediaQuery('(max-width: 899px)');
    const media = work.featured;

    // Появление: 0 — верх карточки у нижнего края экрана, 1 — на 30% высоты экрана
    const { scrollYProgress: reveal } = useScroll({ target: ref, offset: ['start end', 'start 0.3'] });
    // Проход центра карточки через экран: от полутора экранов ниже центра до половины экрана выше
    const { scrollYProgress: pass } = useScroll({ target: ref, offset: ['center 1.5', 'center -0.5'] });
    // Прокрутка скриншотов, пока карточка на экране
    const { scrollYProgress: shot } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.25'] });

    const shown = useTransform(reveal, easeOutCubic);
    const cardY = useTransform(shown, (e) => (1 - e) * 120);
    const cardScale = useTransform(shown, (e) => 0.9 + 0.1 * e);
    const cardOpacity = useTransform(shown, (e) => 0.05 + 0.95 * e);
    // Медиа раскрывается из уменьшенного прямоугольника
    const clipY = useTransform(shown, (e) => (1 - e) * 18);
    const clipX = useTransform(shown, (e) => (1 - e) * 10);
    const clipPath = useMotionTemplate`inset(${clipY}% ${clipX}% round 13px)`;

    // На телефоне параллакс макетов вдвое слабее
    const depth = mobile ? 0.5 : 1;
    const center = useTransform(pass, passToCenter);
    const desktopY = useTransform(center, (c) => c * 16 * depth);
    const desktopScale = useTransform(shown, (e) => 1 + (1 - e) * 0.08);
    const phoneY = useTransform(center, (c) => c * 50 * depth);
    const phoneRotate = useTransform(center, (c) => c * -6 * depth);

    // Видео играет, только пока видно; без звука, иначе браузер не даст автозапуск
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoInView = useInView(videoRef, { amount: 0.2 });
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (videoInView && !reduceMotion) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }, [videoInView, reduceMotion]);

    if (!media) return null;

    const isVideo = media.type === 'video';
    const href = `${portfolioPageURL}/${work.id}`;

    return (
        <motion.article
            ref={ref}
            className={`${s.card} ${isVideo ? s.wide : ''}`}
            style={reduceMotion ? undefined : { y: cardY, scale: cardScale, opacity: cardOpacity }}
        >
            <motion.div
                className={s.media}
                style={{ backgroundColor: work.tint, clipPath: reduceMotion ? undefined : clipPath }}
            >
                {media.type === 'devices' ? (
                    <>
                        <motion.div className={s.desktop} style={reduceMotion ? undefined : { y: desktopY, scale: desktopScale }}>
                            <BrowserFrame className={s.frame}>
                                <ScrollShot
                                    src={media.desktop}
                                    alt={`${work.name} — десктоп`}
                                    progress={shot}
                                    sizes="(max-width: 899px) 80vw, 460px"
                                />
                            </BrowserFrame>
                        </motion.div>
                        <motion.div className={s.phone} style={reduceMotion ? undefined : { y: phoneY, rotate: phoneRotate }}>
                            <div className={s.phoneScreen}>
                                <ScrollShot
                                    src={media.mobile}
                                    alt={`${work.name} — мобильная версия`}
                                    progress={shot}
                                    sizes="160px"
                                />
                                <span className={s.notch} aria-hidden="true" />
                            </div>
                        </motion.div>
                    </>
                ) : (
                    <motion.div className={`${s.desktop} ${s.desktopWide}`} style={reduceMotion ? undefined : { y: desktopY, scale: desktopScale }}>
                        <BrowserFrame className={s.frame} dark>
                            <video
                                ref={videoRef}
                                className={s.video}
                                src={media.src}
                                poster={media.poster}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                aria-label={`${work.name} — запись сайта`}
                            />
                        </BrowserFrame>
                    </motion.div>
                )}
            </motion.div>

            <div className={s.body}>
                <div className={s.meta}>
                    <span className={allerta.className}>{num} / Избранное</span>
                    <span>{work.year}</span>
                </div>
                <div className={s.text}>
                    <h3 className={`${allerta.className} ${s.title}`}>{work.name}</h3>
                    <p className={s.description}>{work.description}</p>
                    <Tags tags={work.tags} />
                </div>
                {/* Ссылка растянута на всю карточку через ::after */}
                <PortfolioLink href={href} className={s.more} aria-label={`Смотреть кейс ${work.name}`}>
                    <span className={ralewayBold.className}>Смотреть кейс</span>
                    <span className={s.arrow} aria-hidden="true">→</span>
                </PortfolioLink>
            </div>
        </motion.article>
    )
}

export default FeaturedCard
