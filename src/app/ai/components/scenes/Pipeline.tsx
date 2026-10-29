"use client";

import { CSSProperties, FC, ReactNode, useCallback, useRef, useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import s from './Pipeline.module.scss'
import OrbStar from "@/app/(home)/components/chat/OrbStar";
import { ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ChartIcon, DocIcon, PhoneIcon, StarIcon } from "./PipelineIcons";
import { ease, easeOut, easeOutBack, lerp, offsetIn, span, useStickyScene } from "../scene";
import { pipelineDemo, pipelineNote, pipelineStages, sections } from "@/data/aiPage";

export type Kind = 'calls' | 'reviews' | 'data' | 'docs';
export const KINDS: Kind[] = ['calls', 'reviews', 'data', 'docs'];

// Путь сцены в экранах: раскрытие плашки и четыре примера по ~0,55 экрана
const PATH = 2.4;
const PATH_PHONE = 2;
// Плашка раскрывается до краёв окна в начале и собирается обратно в конце – как первый экран главной
const EXPAND = [0, .05];
const CONTRACT = [.95, 1];
const STAGES_FROM = .05;
const STAGE = .9 / KINDS.length;

// Внутри примера (доли его пути): вход появляется, улетает каплями в шар, шар вздрагивает на каждой,
// из шара выезжает отчёт и собирается; в конце отчёт уходит, следующий пример – заново
const tokenIn = (i: number) => .02 + i * .04;
export const flyFrom = (i: number) => .2 + i * .06;
export const FLY = .2;
const REPORT_IN = [.55, .68];
const BUILD = [.62, .9];
const REPORT_OUT = [.93, 1];
const LABEL_IN = [0, .08];
const LABEL_OUT = [.93, 1];
export const TOKENS = 4;
const DOT = 14;
const ARC = 40;

const k = (v: number, [from, to]: number[]) => span(v, from, to - from);
const stageOf = (p: number, i: number) => span(p, STAGES_FROM + i * STAGE, STAGE);

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
    const pop = (v: number) => easeOutBack(k(v, [tokenIn(i), tokenIn(i) + .1]));
    const fly = (v: number) => span(v, flyFrom(i), FLY);
    const x = useTransform(u, (v) => geom.dx * ease(fly(v)));
    const y = useTransform(u, (v) => geom.dy * ease(fly(v)) - ARC * Math.sin(Math.PI * fly(v)));
    const scale = useTransform(u, (v) => fly(v) > 0 ? 1 : .6 + .4 * pop(v));
    const opacity = useTransform(u, (v) => v <= 0 || fly(v) >= 1 ? 0 : Math.min(1, k(v, [tokenIn(i), tokenIn(i) + .05])));
    // В полёте вход сжимается в тёмную каплю
    const clipPath = useTransform(u, (v) => {
        const f = easeOut(Math.min(1, fly(v) / .45));
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
    const g = useTransform(u, (v) => easeOut(k(v, [from, from + .12])));
    const pop = useTransform(u, (v) => easeOutBack(k(v, [from, from + .1])));
    const motionStyle = axis === 'x' ? { scaleX: g } : axis === 'y' ? { scaleY: g } : { scale: pop, opacity: g };
    return <motion.span className={className} style={{ ...style, ...motionStyle }}>{children}</motion.span>;
};

const at = (n: number, step = .035) => BUILD[0] + n * step;

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
    const pathLength = useTransform(u, (v) => easeOut(k(v, [BUILD[0], BUILD[0] + .2])));
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
        const open = 100 * (1 - easeOut(k(v, REPORT_IN)));
        const shut = last ? 0 : 100 * ease(k(v, REPORT_OUT));
        return vertical
            ? `inset(${shut}% 0 ${open}% 0 round 13px)`
            : `inset(0 ${open}% 0 ${shut}% round 13px)`;
    });
    const opacity = useTransform(u, (v) => v <= 0 || (!last && v >= 1) ? 0 : 1);

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
        const leave = last ? 0 : ease(k(v, LABEL_OUT));
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

const Stage: FC<{ p: MotionValue<number>, i: number, kind: Kind, geoms: IGeom[], vertical: boolean, tokenRefs?: (j: number) => (el: HTMLDivElement | null) => void }> = ({ p, i, ...rest }) => {
    const u = useTransform(p, (v) => stageOf(v, i));
    return <PipelineStage u={u} last={i === KINDS.length - 1} {...rest} />;
};

const StageMeta: FC<{ p: MotionValue<number>, i: number, children: ReactNode }> = ({ p, i, children }) => {
    const u = useTransform(p, (v) => stageOf(v, i));
    return <Label u={u} last={i === KINDS.length - 1}>{children}</Label>;
};

const StageBar: FC<{ p: MotionValue<number>, i: number }> = ({ p, i }) => {
    const u = useTransform(p, (v) => stageOf(v, i));
    return <Bar u={u} />;
};

// Вариант B, вторая сцена: что делает агент – на четырёх примерах. Плашка раскрывается на весь экран, как первый экран
// главной; слева появляются входы (звонки, отзывы, данные, документы), каплями улетают в шар агента, шар вздрагивает
// на каждой, справа из него выезжает и собирается отчёт. Всё ведёт скролл, вперёд и назад
const Pipeline: FC = () => {
    const reduceMotion = usePrefersReducedMotion();
    const vertical = useMediaQuery('(max-width: 700px)');

    const scene = useRef<HTMLElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const area = useRef<HTMLDivElement>(null);
    const orb = useRef<HTMLDivElement>(null);
    const tokens = useRef<(HTMLDivElement | null)[]>([]);
    const [geoms, setGeoms] = useState<IGeom[]>([]);
    const [inset, setInset] = useState({ x: 0, y: 0 });

    const onMeasure = useCallback(() => {
        const a = area.current;
        const o = orb.current;
        const sc = screen.current;
        if (!a || !o || !sc) return;
        const oc = offsetIn(o, a);
        const ox = oc.x + o.offsetWidth / 2;
        const oy = oc.y + o.offsetHeight / 2;
        setGeoms(tokens.current.map((el) => {
            if (!el) return noGeom;
            const t = offsetIn(el, a);
            return { dx: ox - (t.x + el.offsetWidth / 2), dy: oy - (t.y + el.offsetHeight / 2), w: el.offsetWidth, h: el.offsetHeight };
        }));
        // Плашка до раскрытия – по ширине контейнера страницы
        setInset({ x: Math.max(16, (sc.offsetWidth - 1260) / 2), y: Math.max(12, sc.offsetHeight * .04) });
    }, []);

    const { progress: p } = useStickyScene({ scene, path, screen }, onMeasure);

    const open = useTransform(p, (v) => ease(k(v, EXPAND)) * (1 - ease(k(v, CONTRACT))));
    const bgX = useTransform(open, (e) => inset.x * (1 - e));
    const bgY = useTransform(open, (e) => inset.y * (1 - e));
    const radius = useTransform(open, (e) => 13 * (1 - e));

    // Шар вздрагивает, когда в него влетает капля, и звезда медленно поворачивается – агент работает
    const orbScale = useTransform(p, (v) => {
        const i = Math.min(KINDS.length - 1, Math.floor((v - STAGES_FROM) / STAGE));
        if (i < 0) return 1;
        const u = stageOf(v, i);
        let bump = 0;
        for (let j = 0; j < TOKENS; j++) {
            const x = (u - flyFrom(j) - FLY) / .06;
            if (x >= 0 && x <= 1) bump = Math.max(bump, Math.sin(Math.PI * x));
        }
        return 1 + .08 * bump;
    });
    const starRotate = useTransform(p, (v) => v * 360);

    if (reduceMotion) {
        return (
            <section className={s.static} aria-labelledby="pipeline-title">
                <h2 id="pipeline-title" className={`${ralewayBold.className} ${s.title}`}>{sections.pipeline.title}</h2>
                <p className={s.description}>{sections.pipeline.text}</p>
                <ul className={s.staticList}>
                    {pipelineStages.map((stage) => <li key={stage} className={ralewayBold.className}>{stage}</li>)}
                </ul>
            </section>
        );
    }

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${s.scene}`}
            style={{
                '--scene-h': `calc(var(--screen-h) + ${PATH * 100}vh)`,
                '--scene-h-phone': `calc(var(--screen-h) + ${PATH_PHONE * 100}vh)`,
            } as CSSProperties}
            aria-labelledby="pipeline-title"
        >
            <div ref={screen} className={sc.screen}>
                <motion.div className={s.bg} style={{ top: bgY, bottom: bgY, left: bgX, right: bgX, borderRadius: radius }} aria-hidden="true" />

                <div className={s.content}>
                    <div className={s.top}>
                        <h2 id="pipeline-title" className={`${ralewayBold.className} ${s.title}`}>{sections.pipeline.title}</h2>
                        <p className={s.description}>{sections.pipeline.text}</p>
                        <div className={s.indicators}>
                            {KINDS.map((kind, i) => <StageBar key={kind} p={p} i={i} />)}
                        </div>
                        <div className={s.labels}>
                            {KINDS.map((kind, i) => <StageMeta key={kind} p={p} i={i}>{pipelineStages[i]}</StageMeta>)}
                        </div>
                    </div>

                    <div ref={area} className={s.area}>
                        {KINDS.map((kind, i) => (
                            <Stage
                                key={kind}
                                p={p}
                                i={i}
                                kind={kind}
                                geoms={geoms}
                                vertical={vertical}
                                tokenRefs={i === 0 ? (j) => (el) => { tokens.current[j] = el } : undefined}
                            />
                        ))}
                        <motion.div ref={orb} className={s.orb} style={{ scale: orbScale }} aria-hidden="true">
                            <span className={s.orbLight} />
                            <motion.span className={s.orbStar} style={{ rotate: starRotate }}>
                                <OrbStar className={s.orbIcon} />
                            </motion.span>
                        </motion.div>
                    </div>

                    <p className={s.note}>{pipelineNote} · {pipelineDemo}</p>
                </div>
            </div>

            <div ref={path} className={sc.path} aria-hidden="true" />
        </section>
    );
};

export default Pipeline;
