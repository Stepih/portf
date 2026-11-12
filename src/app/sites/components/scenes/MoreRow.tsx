"use client";

import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import x from './Scenes.module.scss'
import s from './MoreRow.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import Rise from "@/app/ai/components/Rise";
import { easeOut, move, span } from "@/app/ai/components/scene";
import { more, moreId, sections } from "@/data/sitesPage";
import { IMoreRow } from "@/interfaces/sitesPage";
import Scene, { ISceneMode } from "./Scene";
import { IMoreTimes, moreTimes, TEXT, W } from "./times";

const columns = more.columns;
const counts = columns.map((col) => col.rows.length + (col.note ? 1 : 0));
const k = (v: number, [a, d]: W) => span(v, a, d);

// Строка прайса «услуга … цена»: название слева, цена Raleway Bold справа, одной строкой
const Row: FC<{ row: IMoreRow, className?: string }> = ({ row, className = '' }) => (
    <span className={`${s.row} ${className}`}>
        <span className={s.name}>{row.title}</span>
        <b className={`${ralewayBold.className} ${s.price}`}>{row.price}</b>
    </span>
);

interface IColumn {
    time: MotionValue<number>,
    t: IMoreTimes,
    c: number,
    animated: boolean
}

// Колонка – как в «Что входит»: линия прорисовывается, заголовок и строки выезжают по одной; на телефоне колонки
// сменяют друг друга. У ступеней сопровождения слева – рейка с точками, она растёт вслед за строками
const Column: FC<IColumn> = ({ time, t, c, animated }) => {
    const col = columns[c];
    const ct = t.cols[c];
    const line = useTransform(time, (v) => move(k(v, ct.line)));
    const out = useTransform(time, (v) => ct.out ? k(v, ct.out) : 0);
    const opacity = useTransform(out, (o) => 1 - easeOut(o));
    const y = useTransform(out, (o) => -24 * move(o));
    const last = ct.items[col.rows.length - 1];
    const rail = useTransform(time, (v) => move(k(v, [ct.items[0], last - ct.items[0] + TEXT])));

    return (
        <motion.div className={s.column} style={animated ? { opacity, y } : undefined}>
            <motion.span className={x.hairline} style={animated ? { scaleX: line } : undefined} aria-hidden="true" />
            <h3 className={`${ralewayBold.className} ${s.title}`}>
                <Rise progress={time} from={ct.title} dur={TEXT}>{col.title}</Rise>
            </h3>
            <ul className={`${s.list} ${col.ladder ? s.ladder : ''}`}>
                {col.ladder && <motion.span className={s.rail} style={animated ? { scaleY: rail } : undefined} aria-hidden="true" />}
                {col.rows.map((row, j) => (
                    <li key={row.title}>
                        <Rise progress={time} from={ct.items[j]} dur={TEXT} tag="div"><Row row={row} className={col.ladder ? s.step : ''} /></Rise>
                    </li>
                ))}
            </ul>
            {col.note && (
                <p className={s.note}>
                    <Rise progress={time} from={ct.items[col.rows.length]} dur={TEXT}>{col.note}</Rise>
                </p>
            )}
        </motion.div>
    );
};

const MoreBody: FC<{ time: MotionValue<number>, mode: ISceneMode, onLen: (len: number) => void }> = ({ time, mode, onLen }) => {
    const grid = useRef<HTMLDivElement>(null);
    const wideRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ col: 340, wide: 1060, h: 900 });
    useLayoutEffect(() => {
        const col = grid.current?.firstElementChild as HTMLElement | null;
        const wide = wideRef.current;
        if (!col || !wide) return;
        const measure = () => setSize({ col: col.offsetWidth, wide: wide.offsetWidth, h: window.innerHeight });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(col);
        observer.observe(wide);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);
    // Колонки сменяют друг друга – только в сцене на телефоне; без движения – столбиком
    const swap = mode.phone && mode.sticky;
    const t = useMemo(() => moreTimes(counts, swap, size.col, size.wide, size.h), [swap, size]);
    useEffect(() => onLen(t.path), [onLen, t.path]);
    const wideLine = useTransform(time, (v) => move(k(v, t.wide.line)));

    return (
        <>
            {/* Заголовок не проявляется после остановки, а въезжает вместе со страницей: перед «Ещё делаю» нет
                пустой прокрутки, пока экран сцены поднимается (Д41, попутно) */}
            <div className={s.head}>
                <h2 id={`${moreId}-title`} className={`${ralewayBold.className} ${x.title}`}>{sections.more.title}</h2>
                <p className={x.description}>{sections.more.text}</p>
            </div>
            <div ref={grid} className={`${s.grid} ${swap ? s.swap : ''}`}>
                {columns.map((col, c) => <Column key={col.title} time={time} t={t} c={c} animated={mode.sticky} />)}
            </div>
            <div ref={wideRef} className={s.wide}>
                <motion.span className={x.hairline} style={mode.sticky ? { scaleX: wideLine } : undefined} aria-hidden="true" />
                <Rise progress={time} from={t.wide.row} dur={TEXT} tag="div"><Row row={more.wide} className={s.wideRow} /></Rise>
            </div>
            <p className={s.quiet}>
                <Rise progress={time} from={t.quiet} dur={TEXT}>{more.quiet}</Rise>
            </p>
        </>
    );
};

// «Ещё делаю» (Д41, DESIGN_FIXES_8_PLAN) – прайс в колонках по задаче клиента, как «Что входит» (TermsColumns): три
// колонки под волосяными линиями, строки «услуга … цена»; сопровождение – ступенями на рейке. Под колонками – веб-сервисы
// строкой во всю ширину и тихая строка о партнёрах. На телефоне колонки сменяют друг друга на одном экране
const MoreRow: FC = () => {
    const [len, setLen] = useState(1.6);
    return (
        <Scene id={moreId} labelledBy={`${moreId}-title`} len={len}>
            {(time, mode) => <MoreBody time={time} mode={mode} onLen={setLen} />}
        </Scene>
    );
};

export default MoreRow;
