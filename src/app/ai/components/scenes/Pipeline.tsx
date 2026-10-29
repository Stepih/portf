"use client";

import { CSSProperties, FC, ReactNode } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import s from './Pipeline.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { ChartIcon, DocIcon, PhoneIcon, StarIcon } from "./PipelineIcons";
import { easeOut, lerp, move, rise, span } from "../scene";
import { pipelineStages, sections } from "@/data/aiPage";

export type Kind = 'calls' | 'reviews' | 'data' | 'docs';
export const KINDS: Kind[] = ['calls', 'reviews', 'data', 'docs'];

// Внутри примера (доли его пути): вход появляется, улетает каплями в шар, шар вздрагивает на каждой,
// из шара выезжает отчёт и собирается; в конце отчёт уходит, следующий пример – заново. Единая скорость (speed.ts):
// длину примера считает ChatWorkScene так, чтобы полёт входа (FLY), раскрытие отчёта и рост его деталей (0,3 доли)
// шли не быстрее SPEED. Отчёт уходит уже в начале следующего примера (доля до 1,15 – u без ограничения 0–1)
const tokenIn = (i: number) => .02 + i * .03;
export const flyFrom = (i: number) => .1 + i * .05;
export const FLY = .3;
const REPORT_IN = [.45, .78];
const BUILD = [.5, .92];
const BUILD_LEN = .3;
const REPORT_OUT = [.85, 1.15];
const LABEL_IN = [0, .08];
const LABEL_OUT = [.93, 1];
export const TOKENS = 4;
const DOT = 14;
const ARC = 40;

const k = (v: number, [from, to]: number[]) => span(v, from, to - from);

// Вход относительно шара: сдвиг от центра входа до центра шара и размер
export interface IGeom { dx: number, dy: number, w: number, h: number }
export const noGeom: IGeom = { dx: 0, dy: 0, w: 0, h: 0 };

// ---------- Вход ----------
interface IToken {
    u: MotionValue<number>,
    i: number,
    geom: IGeom,
    itemRef?: (el: HTMLDivElement | null) => void,
    children: ReactNode
}

const Token: FC<IToken> = ({ u, i, geom, itemRef, children }) => {
    const pop = (v: number) => rise(k(v, [tokenIn(i), tokenIn(i) + .1]));
    const fly = (v: number) => span(v, flyFrom(i), FLY);
    const x = useTransform(u, (v) => geom.dx * move(fly(v)));
    const y = useTransform(u, (v) => geom.dy * move(fly(v)) - ARC * Math.sin(Math.PI * fly(v)));
    const scale = useTransform(u, (v) => fly(v) > 0 ? 1 : .6 + .4 * pop(v));
    const opacity = useTransform(u, (v) => v <= 0 || fly(v) >= 1 ? 0 : Math.min(1, k(v, [tokenIn(i), tokenIn(i) + .05])));
    // В полёте вход сжимается в тёмную каплю
    const clipPath = useTransform(u, (v) => {
        const f = move(Math.min(1, fly(v) / .45));
        return `inset(${(geom.h - DOT) / 2 * f}px ${(geom.w - DOT) / 2 * f}px round ${lerp(13, DOT / 2, f)}px)`;
    });
    const drop = useTransform(u, (v) => Math.min(1, fly(v) / .3));

    return (
        <motion.div ref={itemRef} className={s.token} style={{ x, y, scale, opacity, clipPath }}>
            {children}
            <motion.span className={s.tokenDrop} style={{ opacity: drop }} aria-hidden="true" />
        </motion.div>
    );
};

// Содержимое входов – иллюстрация, без настоящих данных
const Wave: FC = () => (
    <span className={s.wave}>
        {[5, 9, 14, 8, 12, 17, 10, 6, 13, 9, 5, 11].map((h, i) => <i key={i} style={{ height: h }} />)}
    </span>
);

const tokenFace = (kind: Kind, i: number): ReactNode => {
    switch (kind) {
        case 'calls':
            return <><PhoneIcon className={s.icon} /><Wave /><span className={s.tokenNum}>0{i + 2}:{i * 13 + 10}</span></>;
        case 'reviews':
            return <><span className={s.stars}>{[0, 1, 2, 3, 4].map((n) => <StarIcon key={n} className={s.star} filled={n < 5 - (i % 3)} />)}</span><span className={s.bar} style={{ width: 54 }} /></>;
        case 'data':
            return <><ChartIcon className={s.icon} /><span className={s.bar} style={{ width: 70 - i * 8 }} /><span className={s.bar} style={{ width: 34 }} /></>;
        case 'docs':
            return <><DocIcon className={s.icon} /><span className={s.lines}><span className={s.bar} style={{ width: 96 - i * 10 }} /><span className={s.bar} style={{ width: 70 }} /></span></>;
    }
};

// ---------- Отчёт ----------
interface IBuild {
    u: MotionValue<number>,
    from: number,
    children?: ReactNode,
    className?: string,
    style?: CSSProperties,
    // Как растёт: по ширине, по высоте или появлением
    axis?: 'x' | 'y' | 'pop'
}

// Деталь отчёта растёт по пути примера
const Build: FC<IBuild> = ({ u, from, children, className, style, axis = 'x' }) => {
    const g = useTransform(u, (v) => move(k(v, [from, from + BUILD_LEN])));
    const pop = useTransform(u, (v) => rise(k(v, [from, from + .1])));
    const motionStyle = axis === 'x' ? { scaleX: g } : axis === 'y' ? { scaleY: g } : { scale: pop, opacity: g };
    return <motion.span className={className} style={{ ...style, ...motionStyle }}>{children}</motion.span>;
};

const at = (n: number, step = .02) => BUILD[0] + n * step;

const reportBody = (kind: Kind, u: MotionValue<number>): ReactNode => {
    switch (kind) {
        case 'calls':
            return (
                <div className={s.rows}>
                    {[.82, .56, .91, .38].map((w, r) => (
                        <div key={r} className={s.callRow}>
                            <Build u={u} from={at(r)} axis="pop" className={s.dot} />
                            <Build u={u} from={at(r)} className={s.bar} style={{ width: 72 }} />
                            <span className={s.track}><Build u={u} from={at(r + 1)} className={s.fill} style={{ width: `${w * 100}%` }} /></span>
                            <Build u={u} from={at(r + 2)} axis="pop" className={s.badge} />
                        </div>
                    ))}
                </div>
            );
        case 'reviews':
            return (
                <div className={s.columns}>
                    {[.78, .52, .92, .4, .66].map((h, c) => (
                        <span key={c} className={s.column}>
                            <Build u={u} from={at(c)} axis="y" className={s.columnFill} style={{ height: `${h * 100}%` }} />
                            <Build u={u} from={at(c + 1)} className={s.bar} style={{ width: '70%' }} />
                        </span>
                    ))}
                </div>
            );
        case 'data':
            return <DataChart u={u} />;
        case 'docs':
            return (
                <div className={s.doc}>
                    {[92, 78, 86, 60, 88, 72, 94, 50].map((w, l) => (
                        <span key={l} className={s.docLine}>
                            <Build u={u} from={at(l * .6, .03)} className={s.bar} style={{ width: `${w}%` }} />
                            {(l === 2 || l === 5) && (
                                <>
                                    <Build u={u} from={at(4 + l * .3)} className={s.mark} style={{ width: `${w}%` }} />
                                    <Build u={u} from={at(5 + l * .3)} axis="pop" className={s.flag} />
                                </>
                            )}
                        </span>
                    ))}
                </div>
            );
    }
};

// График маркетинга: линия рисуется по пути, точки появляются за ней
const DataChart: FC<{ u: MotionValue<number> }> = ({ u }) => {
    const pathLength = useTransform(u, (v) => move(k(v, [BUILD[0], BUILD[0] + BUILD_LEN])));
    const points = [[0, 70], [20, 58], [40, 64], [60, 36], [80, 42], [100, 14]];
    return (
        <div className={s.chart}>
            <svg viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true">
                <line x1="0" y1="79" x2="100" y2="79" className={s.axis} />
                <motion.path
                    d={`M${points.map(([x, y]) => `${x} ${y}`).join(' L')}`}
                    className={s.line}
                    style={{ pathLength }}
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            <div className={s.legend}>
                {[60, 44, 52].map((w, n) => <Build key={n} u={u} from={at(4 + n)} className={s.bar} style={{ width: w }} />)}
            </div>
        </div>
    );
};

interface IReport {
    u: MotionValue<number>,
    kind: Kind,
    last: boolean,
    vertical: boolean
}

// Отчёт выезжает из шара: обрезка раскрывается от стороны шара, в конце примера уходит в другую сторону
const Report: FC<IReport> = ({ u, kind, last, vertical }) => {
    const clipPath = useTransform(u, (v) => {
        const open = 100 * (1 - move(k(v, REPORT_IN)));
        const shut = last ? 0 : 100 * move(k(v, REPORT_OUT));
        return vertical
            ? `inset(${shut}% 0 ${open}% 0 round 13px)`
            : `inset(0 ${open}% 0 ${shut}% round 13px)`;
    });
    const opacity = useTransform(u, (v) => v <= 0 || (!last && v >= REPORT_OUT[1]) ? 0 : 1);

    return (
        <motion.div className={s.report} style={{ clipPath, opacity }} aria-hidden="true">
            <div className={s.reportHead}>
                <span className={`${ralewayBold.className} ${s.reportTitle}`}>Отчёт</span>
                <span className={s.bar} style={{ width: 64 }} />
            </div>
            {reportBody(kind, u)}
        </motion.div>
    );
};

// Подпись примера выезжает из-под маски и уходит вверх, следующая – снизу
export const Label: FC<{ u: MotionValue<number>, last: boolean, children: ReactNode }> = ({ u, last, children }) => {
    const y = useTransform(u, (v) => {
        const enter = 1 - easeOut(k(v, LABEL_IN));
        const leave = last ? 0 : move(k(v, LABEL_OUT));
        return `${(enter - leave) * 110}%`;
    });
    const opacity = useTransform(u, (v) => v <= 0 || (!last && v >= 1) ? 0 : 1);
    return <motion.span className={`${ralewayBold.className} ${s.label}`} style={{ y, opacity }}>{children}</motion.span>;
};

// Черта-индикатор примера – как черты слайдов первого экрана главной
export const Bar: FC<{ u: MotionValue<number> }> = ({ u }) => <span className={s.indicator}><motion.span style={{ scaleX: u }} /></span>;

interface IPipelineStage {
    // Доля пути примера 0–1
    u: MotionValue<number>,
    kind: Kind,
    // Последний пример: отчёт не уходит
    last: boolean,
    geoms: IGeom[],
    vertical: boolean,
    tokenRefs?: (j: number) => (el: HTMLDivElement | null) => void,
    // Вариант C: отчёт последнего примера меряется и гаснет, его место занимает карточка ступени
    outputRef?: (el: HTMLDivElement | null) => void,
    outputOpacity?: MotionValue<number>
}

// Пример целиком: входы в левой колонке, отчёт в правой (на телефоне – сверху и снизу), все примеры лежат друг на друге
export const PipelineStage: FC<IPipelineStage> = ({ u, kind, last, geoms, vertical, tokenRefs, outputRef, outputOpacity }) => (
    <>
        <div className={s.sources}>
            {Array.from({ length: TOKENS }, (_, j) => (
                <Token key={j} u={u} i={j} geom={geoms[j] ?? noGeom} itemRef={tokenRefs?.(j)}>
                    {tokenFace(kind, j)}
                </Token>
            ))}
        </div>
        <motion.div ref={outputRef} className={s.output} style={outputOpacity ? { opacity: outputOpacity } : undefined}>
            <Report u={u} kind={kind} last={last} vertical={vertical} />
        </motion.div>
    </>
);

// Вариант B, вторая сцена «агент за работой», осталась только без движения: на странице /ai примеры показывает
// ChatWorkScene (PipelineStage, Label, Bar отсюда), а при «уменьшить движение» – этот список
const Pipeline: FC = () => (
    <section className={s.static} aria-labelledby="pipeline-title">
        <h2 id="pipeline-title" className={`${ralewayBold.className} ${s.title}`}>{sections.pipeline.title}</h2>
        <p className={s.description}>{sections.pipeline.text}</p>
        <ul className={s.staticList}>
            {pipelineStages.map((stage) => <li key={stage} className={ralewayBold.className}>{stage}</li>)}
        </ul>
    </section>
);

export default Pipeline;
