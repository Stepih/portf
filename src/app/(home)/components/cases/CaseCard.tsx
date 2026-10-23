"use client";

import { FC, ReactNode, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

import w from '@/app/portfolio/components/WorkCard.module.scss'
import t from '@/app/portfolio/components/Tags.module.scss'
import s from './CaseCard.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { IPortfolioWork } from "@/interfaces/portfolio";
import BrowserFrame from "@/app/portfolio/components/BrowserFrame";
import PortfolioLink from "@/app/portfolio/components/PortfolioLink";
import { easeOutCubic } from "@/app/portfolio/components/easing";

// Положение карточки в колоде до раздачи: сдвиг к верхней карте, наклон, масштаб, слой
export interface IStack {
    x: number,
    y: number,
    rotate: number,
    scale: number,
    z: number
}

// Окна в доле прогресса раздачи: карта едет от dealFrom до dealTo, строки текста начинают с textFrom
// через lineStep и выезжают за lineDur
export interface ITiming {
    dealFrom: number,
    dealTo: number,
    textFrom: number,
    lineStep: number,
    lineDur: number
}

interface IProps {
    work: IPortfolioWork,
    // Карточка в мобильном виде: размер скриншота
    mobile: boolean,
    // Прогресс раздачи от сцены (путь после портала); null – свой, по скроллу карточки
    shared: MotionValue<number> | null,
    // Где карточка лежит в колоде; нет – она верхняя и стоит на месте
    stack?: IStack,
    timing: ITiming
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Чуть перелетает цель и возвращается: карта проскакивает своё место, наклон уходит в другую сторону
const easeOutBack = (k: number): number => {
    const c = 1.2;
    return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};

const local = (v: number, from: number, dur: number) => clamp01((v - from) / dur);

interface IRiseProps {
    progress: MotionValue<number>,
    from: number,
    dur: number,
    // Обёртка строки: span – внутри строки текста, div – вокруг абзаца
    tag?: 'span' | 'div',
    children: ReactNode
}

// Строка выезжает снизу из-под своей маски по скроллу, как надписи первого экрана.
// При reduced-motion – явные нули, а не style={undefined}: хук включается после монтирования,
// и framer-motion оставил бы на элементе transform первого рендера (строка за маской)
const Rise: FC<IRiseProps> = ({ progress, from, dur, tag = 'span', children }) => {
    const reduceMotion = usePrefersReducedMotion();
    const y = useTransform(progress, (v) => `${((1 - easeOutCubic(local(v, from, dur))) * 110).toFixed(2)}%`);
    const Mask = tag;
    const Inner = tag === 'span' ? motion.span : motion.div;

    return (
        <Mask className={s.mask}>
            <Inner className={s.rise} style={{ y: reduceMotion ? 0 : y }}>{children}</Inner>
        </Mask>
    )
}

// Метка отрасли вырастает из точки
const Pop: FC<{ progress: MotionValue<number>, from: number, dur: number, children: ReactNode }> = ({ progress, from, dur, children }) => {
    const reduceMotion = usePrefersReducedMotion();
    const scale = useTransform(progress, (v) => easeOutBack(local(v, from, dur)));
    const opacity = useTransform(progress, (v) => local(v, from, dur * .4));

    return <motion.li className={t.tag} style={reduceMotion ? { scale: 1, opacity: 1 } : { scale, opacity }}>{children}</motion.li>
}

// Карточка «Избранных кейсов» (ANIMATION_PLAN, 2Г): разметка как у WorkCard. Раздачу и текст ведёт скролл:
// на компьютере – путь сцены после портала, на телефоне – скролл самой карточки
const CaseCard: FC<IProps> = ({ work, mobile, shared, stack, timing }) => {
    const ref = useRef<HTMLElement>(null);
    const reduceMotion = usePrefersReducedMotion();
    // Свой прогресс, как у WorkCard на телефоне: от появления снизу до 55% экрана
    const { scrollYProgress: own } = useScroll({ target: ref, offset: ['start end', 'start 0.55'] });
    const progress = shared ?? own;

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useMotionValue(0);
    const scale = useMotionValue(1);

    // Карта из колоды на своё место; к концу окна чуть проскакивает его и возвращается
    const place = useCallback((v: number) => {
        if (!stack) return;
        const k = local(v, timing.dealFrom, timing.dealTo - timing.dealFrom);
        const rest = 1 - easeOutBack(k);
        x.set(stack.x * rest);
        y.set(stack.y * rest);
        rotate.set(stack.rotate * rest);
        scale.set(stack.scale + (1 - stack.scale) * easeOutCubic(k));
    }, [stack, timing, x, y, rotate, scale]);

    useMotionValueEvent(progress, 'change', place);
    useEffect(() => place(progress.get()), [place, progress]);

    const href = `${portfolioPageURL}/${work.id}`;
    const lineFrom = (n: number) => timing.textFrom + n * timing.lineStep;

    return (
        <motion.article
            ref={ref}
            className={`${w.card} ${s.card}`}
            style={reduceMotion ? { x: 0, y: 0, rotate: 0, scale: 1 } : { x, y, rotate, scale, zIndex: stack?.z }}
        >
            <div className={w.cover} style={{ height: work.coverHeight, backgroundColor: work.tint }}>
                <div className={w.inner}>
                    <BrowserFrame className={w.frame}>
                        <Image
                            className={w.shot}
                            src={work.cover}
                            alt={work.name}
                            fill
                            sizes={mobile ? '90vw' : '320px'}
                        />
                    </BrowserFrame>
                </div>
            </div>

            <div className={w.body}>
                <div className={w.meta}>
                    <Rise progress={progress} from={lineFrom(0)} dur={timing.lineDur}>{work.year}</Rise>
                </div>
                <h3 className={`${ralewayBold.className} ${w.title}`}>
                    <Rise progress={progress} from={lineFrom(1)} dur={timing.lineDur}>
                        {/* Ссылка растянута на всю карточку через ::after */}
                        <PortfolioLink href={href} className={w.link}>{work.name}</PortfolioLink>
                    </Rise>
                </h3>
                <Rise progress={progress} from={lineFrom(2)} dur={timing.lineDur} tag="div">
                    <p className={w.description}>{work.description}</p>
                </Rise>
                <ul className={t.tags}>
                    {work.tags.map((tag) => (
                        <Pop key={tag} progress={progress} from={lineFrom(3)} dur={timing.lineDur}>{tag}</Pop>
                    ))}
                </ul>
            </div>
        </motion.article>
    )
}

export default CaseCard
