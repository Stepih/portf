"use client";

import { FC, useEffect, useRef } from "react";
import { motion, MotionValue, useMotionValue, useScroll, useTransform } from "framer-motion";

import s from './WorksGrid.module.scss'
import { IPortfolioWork } from "@/interfaces/portfolio";
import { ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import WorkCard from "./WorkCard";

interface IWorkItem {
    work: IPortfolioWork,
    // Место работы в общем списке: фильтр его не меняет
    num: string
}

interface IProps {
    items: IWorkItem[],
    title: string
}

// Колонки начинаются с разным отступом и едут с разной скоростью — сетка «расслаивается» при скролле
const COLUMN_PADS = [0, 180, 70];
const COLUMN_SPEEDS = [0, 0.2, 0.08];

interface IColumnProps {
    items: IWorkItem[],
    pad: number,
    speed: number,
    progress: MotionValue<number>,
    travel: MotionValue<number>,
    mobile: boolean
}

const Column: FC<IColumnProps> = ({ items, pad, speed, progress, travel, mobile }) => {
    const reduceMotion = usePrefersReducedMotion();
    // Сдвиг вверх пропорционально пройденному сеткой пути
    const y = useTransform([progress, travel], ([p, t]: number[]) => -p * t * speed);

    return (
        <motion.div
            className={s.column}
            style={{ paddingTop: pad, y: reduceMotion || mobile ? 0 : y }}
        >
            {items.map(({ work, num }) => (
                <WorkCard key={work.id} work={work} num={num} mobile={mobile} />
            ))}
        </motion.div>
    )
}

// «Все работы»: колонки с параллаксом; на узком экране одна колонка
const WorksGrid: FC<IProps> = ({ items, title }) => {
    const mobile = useMediaQuery('(max-width: 899px)');
    const gridRef = useRef<HTMLDivElement>(null);

    // Прогресс от появления верха сетки снизу до ухода её низа вверх; travel — длина этого пути в px
    const { scrollYProgress } = useScroll({ target: gridRef, offset: ['start end', 'end start'] });
    const travel = useMotionValue(0);

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;
        const measure = () => travel.set(grid.offsetHeight + window.innerHeight);
        const observer = new ResizeObserver(measure);

        observer.observe(grid);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [travel]);

    const columnCount = mobile ? 1 : COLUMN_PADS.length;
    const columns = Array.from({ length: columnCount }, (_, ci) => items.filter((_, i) => i % columnCount === ci));

    return (
        <section id="all" className={s.section} aria-labelledby="all-title">
            <h2 id="all-title" className={`${ralewayBold.className} ${s.title}`}>{title}</h2>

            <div ref={gridRef} className={s.grid}>
                {columns.map((columnItems, ci) => (
                    <Column
                        key={ci}
                        items={columnItems}
                        pad={mobile ? 0 : COLUMN_PADS[ci]}
                        speed={COLUMN_SPEEDS[ci]}
                        progress={scrollYProgress}
                        travel={travel}
                        mobile={mobile}
                    />
                ))}
            </div>
        </section>
    )
}

export default WorksGrid
