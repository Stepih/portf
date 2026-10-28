"use client";

import { CSSProperties, FC, ReactNode, useCallback, useRef, useState } from "react";
import { motion, MotionValue, useScroll, useSpring, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import s from './Sections.module.scss'
import a from './AgentsTable.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ease, easeOut, easeOutBack, span, SMOOTH, useStickyScene } from "../scene";
import { agentHeads, agentRows, sections } from "../../placeholders";

// Путь сцены в экранах: девять карт раздаются по строкам
const PATH = 1.3;
// Карта колоды – левая часть строки этой ширины, px; веер – наклон на карту, град.
const CARD = 300;
const FAN = 2.4;
// Окно карты i на пути сцены: летит на своё место, раскрывается во всю строку, плашка тает в линию
const dealFrom = (i: number) => .04 + i * .075;
const DEAL = .3;

// Строка в колоде: сдвиг к колоде, наклон, сколько px справа срезано до карты
interface IDeck { dx: number, dy: number, rotate: number, cut: number, z: number }

interface IRow {
    // Прогресс сцены; на телефоне и в высокой таблице – свой, по скроллу строки
    scene: MotionValue<number>,
    own: boolean,
    i: number,
    deck?: IDeck,
    rowRef: (el: HTMLDivElement | null) => void,
    // Ячейки строки: первая видна и на карте колоды, остальные – когда карта раскрылась
    cells: ReactNode[]
}

const Row: FC<IRow> = ({ scene, own, i, deck, rowRef, cells }) => {
    const reduceMotion = usePrefersReducedMotion();
    const ref = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.72'] });
    const ownProgress = useSpring(scrollYProgress, SMOOTH);

    // Своя раздача: карта въезжает сбоку (чётные слева, нечётные справа) с наклоном
    const side = i % 2 ? 1 : -1;
    const local = (v: number) => own ? v : span(v, dealFrom(i), DEAL);
    const p = own ? ownProgress : scene;

    const x = useTransform(p, (v) => {
        const f = easeOutBack(span(local(v), 0, .75));
        return own ? `${side * 40 * (1 - f)}%` : (deck?.dx ?? 0) * (1 - f);
    });
    const y = useTransform(p, (v) => own ? 0 : (deck?.dy ?? 0) * (1 - easeOutBack(span(local(v), 0, .75))));
    const rotate = useTransform(p, (v) => (own ? side * 5 : deck?.rotate ?? 0) * (1 - easeOutBack(span(local(v), 0, .75))));
    const opacity = useTransform(p, (v) => own ? span(local(v), 0, .25) : 1);
    // Карта раскрывается вправо во всю строку
    const clipPath = useTransform(p, (v) => {
        const o = ease(span(local(v), .4, .4));
        const cut = own ? 0 : (deck?.cut ?? 0) * (1 - o);
        return `inset(-10px ${cut}px -10px -2px round ${13 * (1 - o)}px)`;
    });
    const plate = useTransform(p, (v) => 1 - span(local(v), .7, .3));
    // Текст карты: у карт под верхней его нет (видна только верхняя), у края карты он тает, а не режется
    const text = useTransform(p, (v) => own || i === 0 ? 1 : span(v, dealFrom(i - 1), .04));
    const maskImage = useTransform(p, (v) => {
        const o = ease(span(local(v), .4, .4));
        if (own || o >= 1) return 'none';
        const edge = CARD + (deck?.cut ?? 0) * o;
        return `linear-gradient(90deg, #000 ${edge - 56}px, transparent ${edge - 12}px)`;
    });
    const line = useTransform(p, (v) => easeOut(span(local(v), .75, .25)));

    return (
        <motion.div
            ref={(el) => { ref.current = el; rowRef(el) }}
            className={`${s.row} ${a.row}`}
            role="row"
            style={reduceMotion ? undefined : { x, y, rotate, opacity, clipPath, zIndex: deck?.z }}
        >
            {!reduceMotion && <motion.span className={a.plate} style={{ opacity: plate }} aria-hidden="true" />}
            <motion.span className={a.rule} style={reduceMotion ? undefined : { scaleX: line }} aria-hidden="true" />
            {cells.map((cell, n) => (
                <motion.span
                    key={n}
                    role="cell"
                    className={n === 1 ? s.muted : undefined}
                    style={reduceMotion ? undefined : n === 0 ? { opacity: text, maskImage, WebkitMaskImage: maskImage } : { opacity: text }}
                >
                    {cell}
                </motion.span>
            ))}
        </motion.div>
    );
};

interface IAgentsTable {
    // Вариант B: строки плотнее
    compact?: boolean
}

// Какие агенты делаю (макет page_C_ai). На компьютере – липкая сцена: девять агентов лежат веером колоды, скролл раздаёт
// их по строкам таблицы – карта летит на место, раскрывается во всю строку, плашка тает в волосяную линию.
// На телефоне (и если таблица выше экрана) – без остановки: каждая строка въезжает картой сбоку по своему скроллу
const AgentsTable: FC<IAgentsTable> = ({ compact }) => {
    const reduceMotion = usePrefersReducedMotion();
    const scene = useRef<HTMLElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const wrap = useRef<HTMLDivElement>(null);
    const table = useRef<HTMLDivElement>(null);
    const rows = useRef<(HTMLDivElement | null)[]>([]);
    const [decks, setDecks] = useState<IDeck[]>([]);
    const [own, setOwn] = useState(true);

    const onMeasure = useCallback(() => {
        const t = table.current;
        const w = wrap.current;
        if (!t || !w) return;
        // Сцена – только шире 900px и если таблица целиком помещается в экран
        const fits = window.innerWidth >= 900 && w.offsetHeight <= window.innerHeight - 40;
        setOwn(!fits);
        const els = rows.current;
        const first = els[0];
        const last = els[els.length - 1];
        if (!first || !last) return;
        const cx = t.offsetWidth / 2;
        const cy = (first.offsetTop + last.offsetTop + last.offsetHeight) / 2;
        const mid = (els.length - 1) / 2;
        setDecks(els.map((el, i) => el ? {
            dx: cx - CARD / 2 - el.offsetLeft + (i - mid) * 5,
            dy: cy - (el.offsetTop + el.offsetHeight / 2) + Math.abs(i - mid) * 3,
            rotate: (i - mid) * FAN,
            cut: Math.max(0, el.offsetWidth - CARD),
            z: els.length - i,
        } : { dx: 0, dy: 0, rotate: 0, cut: 0, z: 0 }));
    }, []);

    const { progress } = useStickyScene({ scene, path, screen }, onMeasure);
    const headOpacity = useTransform(progress, (v) => own ? 1 : span(v, .82, .12));

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${a.scene} ${own || reduceMotion ? a.flat : ''} ${compact ? s.compact : ''}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${PATH * 100}vh)` } as CSSProperties}
            aria-labelledby="agents-title"
        >
            <div ref={screen} className={`${sc.screen} ${a.screen}`}>
                <div ref={wrap} className={a.wrap}>
                    <h2 id="agents-title" className={`${ralewayBold.className} ${s.title}`}>{sections.agents.title}</h2>
                    <p className={s.description}>{sections.agents.text}</p>

                    <div ref={table} className={a.table} role="table" aria-labelledby="agents-title">
                        <motion.div className={`${s.row} ${s.head}`} role="row" style={reduceMotion ? undefined : { opacity: headOpacity }}>
                            {agentHeads.map((head) => <span key={head} role="columnheader">{head}</span>)}
                        </motion.div>
                        {agentRows.map((row, i) => (
                            <Row
                                key={row.title}
                                scene={progress}
                                own={own}
                                i={i}
                                deck={decks[i]}
                                rowRef={(el) => { rows.current[i] = el }}
                                cells={[
                                    <><b className={ralewayBold.className}>{row.title}</b> – {row.text}</>,
                                    row.where,
                                    <><b className={ralewayBold.className}>{row.price}</b>, {row.term}</>,
                                ]}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div ref={path} className={`${sc.path} ${own || reduceMotion ? a.hidden : ''}`} aria-hidden="true" />
        </section>
    );
};

export default AgentsTable;
