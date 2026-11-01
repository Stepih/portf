"use client";

import { CSSProperties, FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import x from './Scenes.module.scss'
import s from './PaymentScale.module.scss'
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import Rise from "@/app/ai/components/Rise";
import { easeOut, move, rise, span } from "@/app/ai/components/scene";
import { payment } from "@/data/sitesPage";
import Scene, { ISceneMode } from "./Scene";
import { IPayTimes, padded, payTimes, TEXT, W } from "./times";

const stages = payment.stages;
const shares = stages.map((stage) => stage.parts.map((part) => part.share));
const N = Math.max(...shares.map((list) => list.length));
const k = (v: number, [a, d]: W) => span(v, a, d);

// Отрезки шкалы в момент v: этап s, к которому шкала уже перестроилась (или перестраивается)
const segmentsAt = (t: IPayTimes, v: number) => {
    let from = padded(shares[0], N);
    for (let i = 1; i < stages.length; i++) {
        const to = padded(shares[i], N);
        const m = move(k(v, t.stages[i].morph));
        if (m <= 0) break;
        from = from.map((seg, j) => ({ left: seg.left + (to[j].left - seg.left) * m, width: seg.width + (to[j].width - seg.width) * m }));
        if (m < 1) break;
    }
    return from;
};

// Этап на экране: встаёт в своё время, уходит вверх, когда встаёт следующий. Без движения – виден последний
const useStageShown = (time: MotionValue<number>, t: IPayTimes, s: number) => {
    const next = t.stages[s + 1]?.at;
    const state = useTransform(time, (v) => ({ in: span(v, t.stages[s].at, TEXT), out: next === undefined ? 0 : span(v, next - .1, .1) }));
    const opacity = useTransform(state, (st) => easeOut(st.in) * (1 - st.out));
    const y = useTransform(state, (st) => 16 * (1 - rise(st.in)) - 16 * move(st.out));
    return { opacity, y };
};

const Segment: FC<{ time: MotionValue<number>, t: IPayTimes, j: number }> = ({ time, t, j }) => {
    const seg = useTransform(time, (v) => segmentsAt(t, v)[j]);
    const left = useTransform(seg, (g) => `${g.left * 100}%`);
    const width = useTransform(seg, (g) => `${g.width * 100}%`);
    return <motion.span className={s.segment} style={{ left, width }} data-j={j} aria-hidden="true" />;
};

// Подписи этапа: доля и когда платить – под своими отрезками (на телефоне – списком под шкалой)
const Labels: FC<{ time: MotionValue<number>, t: IPayTimes, s: number, animated: boolean, last: boolean }> = ({ time, t, s: si, animated, last }) => {
    const stage = stages[si];
    const segs = padded(shares[si], stage.parts.length);
    const style = useStageShown(time, t, si);
    return (
        <motion.ul className={`${s.labels} ${last ? s.lastLabels : ''}`} style={animated ? style : undefined}>
            {stage.parts.map((part, j) => part.label || stage.shares ? (
                <li
                    key={j}
                    className={s.label}
                    style={{ '--left': `${segs[j].left * 100}%`, '--width': `${segs[j].width * 100}%` } as CSSProperties}
                    data-j={j}
                >
                    <span className={s.swatch} aria-hidden="true" />
                    {stage.shares && <span className={`${allerta.className} ${s.share}`}>{part.share}%</span>}
                    {part.label && <span className={s.when}>{part.label}</span>}
                </li>
            ) : null)}
        </motion.ul>
    );
};

// Сумма проекта этапа – крупно над шкалой; этапы сменяют друг друга в одной ячейке
const Range: FC<{ time: MotionValue<number>, t: IPayTimes, s: number, animated: boolean }> = ({ time, t, s: si, animated }) => {
    const style = useStageShown(time, t, si);
    const stage = stages[si];
    return (
        <motion.p className={s.rangeItem} style={animated ? style : undefined}>
            <span className={`${ralewayBold.className} ${s.sum}`}>{stage.range}</span>
            {stage.note && <span className={s.note}>{stage.note}</span>}
        </motion.p>
    );
};

const PayBody: FC<{ time: MotionValue<number>, mode: ISceneMode, onLen: (len: number) => void }> = ({ time, mode, onLen }) => {
    const bar = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: 860, h: 900 });
    useLayoutEffect(() => {
        const el = bar.current;
        if (!el) return;
        const measure = () => setSize({ w: el.offsetWidth, h: window.innerHeight });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);
    const t = useMemo(() => payTimes(shares, size.w, size.h), [size]);
    useEffect(() => onLen(t.path), [onLen, t.path]);

    const animated = mode.sticky;
    const draw = useTransform(time, (v) => `inset(0 ${(1 - move(k(v, t.draw))) * 100}% 0 0)`);
    const headOn = useTransform(time, (v) => easeOut(span(v, t.head, .1)));
    // Без движения – все три этапа списком, шкала – последнего; в сцене – по одному
    const shown = animated ? stages.map((_, i) => i) : [stages.length - 1];

    return (
        <>
            <motion.div className={s.head} style={animated ? { opacity: headOn } : undefined}>
                <h2 id="payment-title" className={`${ralewayBold.className} ${x.title}`}>{payment.title}</h2>
                <p className={x.description}>{payment.text}</p>
            </motion.div>

            <div className={`${s.scale} ${animated ? '' : s.still}`}>
                {animated ? (
                    <div className={s.range}>
                        {stages.map((_, i) => <Range key={i} time={time} t={t} s={i} animated />)}
                    </div>
                ) : null}
                <div ref={bar} className={s.bar}>
                    <motion.div className={s.barInner} style={animated ? { clipPath: draw } : undefined}>
                        {Array.from({ length: N }, (_, j) => <Segment key={j} time={time} t={t} j={j} />)}
                    </motion.div>
                </div>
                {animated && (
                    <div className={s.labelStack}>
                        {shown.map((i) => <Labels key={i} time={time} t={t} s={i} animated last={i === stages.length - 1} />)}
                    </div>
                )}
            </div>

            {/* Без движения: три суммы списком под шкалой последнего этапа */}
            {!animated && (
                <dl className={s.list}>
                    {stages.map((stage) => (
                        <div key={stage.range} className={s.listRow}>
                            <dt className={ralewayBold.className}>{stage.range}</dt>
                            <dd>{stage.note ?? stage.parts.map((part) => `${part.share}% ${part.label}`).join(', ')}</dd>
                        </div>
                    ))}
                </dl>
            )}

            <p className={`${ralewayBold.className} ${s.refund}`}>
                <Rise progress={time} from={t.refund} dur={TEXT}>{payment.refund}</Rise>
            </p>
        </>
    );
};

// «Оплата» (SERVICES_PLAN У5б, этап 2) – одна шкала, как «Каждый месяц» на /ai: над ней сумма проекта, под ней –
// доли платежей. Шкала прорисовывается слева направо (до 60 000 ₽ – 50/50), потом перестраивается: края долей
// съезжают, из правого края вырастают новые (25/25/50, затем по этапам). В конце – возврат предоплаты
const PaymentScale: FC = () => {
    const [len, setLen] = useState(2);
    return (
        <Scene labelledBy="payment-title" len={len}>
            {(time, mode) => <PayBody time={time} mode={mode} onLen={setLen} />}
        </Scene>
    );
};

export default PaymentScale;
