"use client";

import { CSSProperties, FC, ReactNode, useRef } from "react";
import { MotionValue, motionValue, useTransform } from "framer-motion";

import sc from '@/app/ai/components/scene.module.scss'
import s from './Scenes.module.scss'
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useStickyScene } from "@/app/ai/components/scene";
import { useRemeasure } from "./useRemeasure";

export interface ISceneMode {
    phone: boolean,
    // false – «уменьшить движение»: обычный блок, всё в покое
    sticky: boolean
}

interface IScene {
    id?: string,
    labelledBy: string,
    // Путь сцены в экранах скролла (times.ts) – по замерам раздела для текущей ширины и высоты экрана
    len: number,
    className?: string,
    children: (time: MotionValue<number>, mode: ISceneMode) => ReactNode
}

// Без движения время стоит далеко за концом сцены – всё на своих местах
const REST = motionValue(100);

// Липкий экран нижней части /sites (У5б, этап 2) на движке /ai: один фокус по центру экрана, время – в экранах от
// кадра, где экран встал (useStickyScene, сглаживание и потолок отставания – общие). Путь – len, плюс запас липкости.
// При reduced-motion – обычный раздел, время в покое
const Scene: FC<IScene> = ({ id, labelledBy, len, className = '', children }) => {
    const reduceMotion = usePrefersReducedMotion();
    const phone = useMediaQuery('(max-width: 700px)');
    const scene = useRef<HTMLElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const { progress, measure } = useStickyScene({ scene, path, screen });
    useRemeasure(scene, measure);
    // Длина пути пересчитывается разделом по замерам: функция преобразования берёт её на каждом рендере
    const time = useTransform(progress, (k) => k * len);

    if (reduceMotion) {
        return (
            <section id={id} className={`${s.flat} ${className}`} aria-labelledby={labelledBy}>
                {children(REST, { phone, sticky: false })}
            </section>
        );
    }

    return (
        <section
            ref={scene}
            id={id}
            className={`${sc.scene} ${s.scene} ${className}`}
            style={{
                '--scene-h': `calc(var(--screen-h) * ${len + 1})`,
            } as CSSProperties}
            aria-labelledby={labelledBy}
        >
            <div ref={path} className={sc.path} aria-hidden="true" />
            <div ref={screen} className={sc.screen}>
                <div className={s.frame}>{children(time, { phone, sticky: true })}</div>
            </div>
        </section>
    );
};

export default Scene;
