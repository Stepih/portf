"use client";

import { FC, useEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";

import s from './WorksGrid.module.scss'
import { IPortfolioWork, PortfolioKind } from "@/interfaces/portfolio";
import { ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import WorkCard from "./WorkCard";

type Filter = PortfolioKind | 'all';

interface IProps {
    works: IPortfolioWork[],
    kinds: PortfolioKind[]
}

// Колонки начинаются с разным отступом и едут с разной скоростью — сетка «расслаивается» при скролле
const COLUMN_PADS = [0, 180, 70];
const COLUMN_SPEEDS = [0, 0.2, 0.08];

interface IColumnProps {
    items: { work: IPortfolioWork, num: string }[],
    pad: number,
    speed: number,
    progress: MotionValue<number>,
    travel: MotionValue<number>,
    mobile: boolean
}

const Column: FC<IColumnProps> = ({ items, pad, speed, progress, travel, mobile }) => {
    const reduceMotion = useReducedMotion();
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

// «Все работы»: фильтр по типу и колонки с параллаксом; на узком экране одна колонка
const WorksGrid: FC<IProps> = ({ works, kinds }) => {
    const [filter, setFilter] = useState<Filter>('all');
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

    const pick = (next: Filter) => {
        if (next === filter) return;
        setFilter(next);
        // Если сетка уже прокручена, возвращаемся к её началу: иначе короткий список окажется выше экрана
        const grid = gridRef.current;
        if (!grid) return;
        const top = grid.getBoundingClientRect().top + window.scrollY - 160;
        if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    };

    const filters: { id: Filter, label: string, count: number }[] = [
        { id: 'all', label: 'Все', count: works.length },
        ...kinds
            .map((kind) => ({ id: kind, label: kind, count: works.filter((w) => w.kind === kind).length }))
            .filter((f) => f.count > 0)
    ];

    // Номер работы — её место в общем списке, фильтр его не меняет
    const shown = works
        .map((work, i) => ({ work, num: String(i + 1).padStart(2, '0') }))
        .filter(({ work }) => filter === 'all' || work.kind === filter);

    const columnCount = mobile ? 1 : COLUMN_PADS.length;
    const columns = Array.from({ length: columnCount }, (_, ci) => shown.filter((_, i) => i % columnCount === ci));

    return (
        <section id="all" className={s.section} aria-labelledby="all-title">
            <div className={s.toolbar}>
                <h2 id="all-title" className={`${ralewayBold.className} ${s.title}`}>Все работы</h2>
                <div className={s.filters} role="group" aria-label="Тип сайта">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            className={`${s.filter} ${filter === f.id ? s.active : ''}`}
                            aria-pressed={filter === f.id}
                            onClick={() => pick(f.id)}
                        >
                            {f.label}
                            <span className={s.count}>{f.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div ref={gridRef} className={s.grid}>
                {columns.map((items, ci) => (
                    <Column
                        key={ci}
                        items={items}
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
