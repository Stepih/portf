"use client";

import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import x from './Scenes.module.scss'
import s from './TermsColumns.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import Rise from "@/app/ai/components/Rise";
import { easeOut, move, span } from "@/app/ai/components/scene";
import { commonId, terms } from "@/data/sitesPage";
import Scene, { ISceneMode } from "./Scene";
import { ITermsTimes, termsTimes, TEXT, W } from "./times";

const columns = terms.columns;
const counts = columns.map((col) => col.items.length + (col.notes?.length ?? 0));
const k = (v: number, [a, d]: W) => span(v, a, d);

interface IColumn {
    time: MotionValue<number>,
    t: ITermsTimes,
    c: number,
    animated: boolean
}

// Колонка: линия над ней прорисовывается слева направо, из-под неё выезжают заголовок и пункты по одному.
// На телефоне колонки сменяют друг друга: дочитанная уходит вверх, следующая встаёт на её место
const Column: FC<IColumn> = ({ time, t, c, animated }) => {
    const col = columns[c];
    const ct = t.cols[c];
    const line = useTransform(time, (v) => move(k(v, ct.line)));
    const out = useTransform(time, (v) => ct.out ? k(v, ct.out) : 0);
    const opacity = useTransform(out, (o) => 1 - easeOut(o));
    const y = useTransform(out, (o) => -24 * move(o));
    const notes = col.notes ?? [];

    return (
        <motion.div className={s.column} style={animated ? { opacity, y } : undefined}>
            <motion.span className={x.hairline} style={animated ? { scaleX: line } : undefined} aria-hidden="true" />
            <h3 className={`${ralewayBold.className} ${s.title}`}>
                <Rise progress={time} from={ct.title} dur={TEXT}>{col.title}</Rise>
            </h3>
            <ul className={s.list}>
                {col.items.map((item, j) => (
                    <li key={item}>
                        <Rise progress={time} from={ct.items[j]} dur={TEXT}><span className={x.bulleted}>{item}</span></Rise>
                    </li>
                ))}
            </ul>
            {notes.map((note, j) => (
                <p key={note} className={s.note}>
                    <Rise progress={time} from={ct.items[col.items.length + j]} dur={TEXT}>{note}</Rise>
                </p>
            ))}
        </motion.div>
    );
};

const TermsBody: FC<{ time: MotionValue<number>, mode: ISceneMode, onLen: (len: number) => void }> = ({ time, mode, onLen }) => {
    const grid = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ col: 340, h: 900 });
    useLayoutEffect(() => {
        const el = grid.current?.firstElementChild as HTMLElement | null;
        if (!el) return;
        const measure = () => setSize({ col: el.offsetWidth, h: window.innerHeight });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);
    // Колонки сменяют друг друга – только в сцене на телефоне; без движения – столбиком
    const swap = mode.phone && mode.sticky;
    const t = useMemo(() => termsTimes(counts, swap, size.col, size.h), [swap, size]);
    useEffect(() => onLen(t.path), [onLen, t.path]);
    const headOn = useTransform(time, (v) => easeOut(span(v, t.head, .1)));

    return (
        <>
            <motion.div className={s.head} style={mode.sticky ? { opacity: headOn } : undefined}>
                <h2 id={`${commonId}-title`} className={`${ralewayBold.className} ${x.title}`}>{terms.title}</h2>
                <p className={x.description}>{terms.text}</p>
            </motion.div>
            <div ref={grid} className={`${s.grid} ${swap ? s.swap : ''}`}>
                {columns.map((col, c) => <Column key={col.title} time={time} t={t} c={c} animated={mode.sticky} />)}
            </div>
        </>
    );
};

// «Что входит и что остаётся вам» (SERVICES_PLAN У5б, этап 2) – три колонки, как «Что входит» на /ai (Terms):
// «Входит в каждый сайт», «Не входит» (один раз на страницу) и «Остаётся вам». Колонки – слева направо, пункты
// выезжают по одному; на телефоне – по одной колонке на экране
const TermsColumns: FC = () => {
    const [len, setLen] = useState(1.6);
    return (
        <Scene id={commonId} labelledBy={`${commonId}-title`} len={len}>
            {(time, mode) => <TermsBody time={time} mode={mode} onLen={setLen} />}
        </Scene>
    );
};

export default TermsColumns;
