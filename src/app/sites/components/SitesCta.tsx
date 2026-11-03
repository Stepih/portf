"use client";

import { CSSProperties, FC, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

import TgIcon from '@/assets/_img/icons/tg-white.svg'

import sc from '@/app/ai/components/scene.module.scss'
import p from './Plate.module.scss'
import s from './SitesCta.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import Rise from "@/app/ai/components/Rise";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { easeOut, lerp, move, offsetIn, span, useSceneTime } from "@/app/ai/components/scene";
import { head, sections } from "@/data/sitesPage";
import { ctaTimes, end, ICtaTimes, W } from "./scenes/times";
import { faqLineTook, faqListEl } from "./scenes/handoff";

interface IProps {
    tgHref: string
}

// Кнопки финала: заявка (залита) и Telegram
const buttons = (tgHref: string, wrap: (label: ReactNode) => ReactNode = (label) => label) => [
    <ContactLink key="cta" className={`${p.button} ${p.primary}`}>{wrap(head.cta)}</ContactLink>,
    <a key="tg" href={tgHref} target="_blank" rel="noopener noreferrer" className={p.button}>
        {wrap(<><TgIcon className={p.icon} aria-hidden="true" />{head.tg}</>)}
    </a>,
];

// Финал обычным разделом (телефон, низкое окно, «уменьшить движение»): заголовок, форма главной (залита)
// и Telegram, под ними – когда отвечу
const Still: FC<IProps> = ({ tgHref }) => (
    <section className={s.cta} aria-labelledby="sites-cta-title">
        <h2 id="sites-cta-title" className={`${ralewayBold.className} ${p.title}`}>{sections.cta.title}</h2>
        <div className={`${ralewayBold.className} ${s.buttons}`} data-goal-place="sites_final">
            {buttons(tgHref)}
        </div>
        <p className={s.note}>{sections.cta.text}</p>
    </section>
);

// ---------- Сцена ----------
// Шарик – 22px, дорастает до высоты кнопки
const RIDER = 22;

interface ISlot { dx: number, dy: number, w: number, h: number }
interface IGeo {
    // Нижняя линия списка FAQ в кадре, где экран встал, центр ряда кнопок – от левого верха экрана
    line: { x: number, y: number, w: number },
    row: { x: number, y: number },
    slots: ISlot[]
}
const NO_SLOT: ISlot = { dx: 0, dy: 0, w: 0, h: 48 };
const noTimes = ctaTimes({ line: 800, lift: 300, apart: 120, stretch: 60, clearRow: 0, clearTitle: 0 }, 900);
const k = (v: number, [a, d]: W) => span(v, a, d);

// Ближайший липкий предок – экран сцены FAQ
const stickyOf = (el: HTMLElement): HTMLElement | null => {
    let node = el.parentElement;
    while (node && getComputedStyle(node).position !== 'sticky') node = node.parentElement;
    return node;
};

// Кнопка, пока она – круг: стоит в центре ряда и обрезана до круга своей высоты; кружки разъезжаются
// и вытягиваются в таблетки (как FinalCta на /ai)
const Morph: FC<{ time: MotionValue<number>, t: ICtaTimes, slot: ISlot, children: ReactNode }> = ({ time, t, slot, children }) => {
    const x = useTransform(time, (v) => slot.dx * (1 - move(k(v, t.apart))));
    const y = useTransform(time, (v) => slot.dy * (1 - move(k(v, t.apart))));
    // Кружки сменяют шарик в один кадр: залитый кружок – точь-в-точь шарик, второй лежит под ним
    const opacity = useTransform(time, (v) => v >= end(t.grow) ? 1 : 0);
    const clipPath = useTransform(time, (v) =>
        `inset(0 ${(Math.max(0, slot.w - slot.h) / 2 * (1 - move(k(v, t.stretch)))).toFixed(2)}px round 24px)`);
    return <motion.span className={s.morph} style={{ x, y, opacity, clipPath }}>{children}</motion.span>;
};

const Scene: FC<IProps & { list: HTMLElement }> = ({ tgHref, list }) => {
    const scene = useRef<HTMLElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const row = useRef<HTMLDivElement>(null);
    const title = useRef<HTMLHeadingElement>(null);
    const slots = useRef<(HTMLSpanElement | null)[]>([]);
    const [g, setG] = useState<(IGeo & { t: ICtaTimes }) | null>(null);
    const [live, setLive] = useState(false);

    const { scrollY } = useScroll();
    const pinY = useMotionValue(0);
    const screenH = useMotionValue(1);
    const raw = useTransform([scrollY, pinY, screenH], ([y, pin, h]: number[]) => (y - pin) / h);
    const time = useSceneTime(raw);
    const t = g?.t ?? noTimes;

    const measure = useCallback(() => {
        const sec = scene.current;
        const scr = screen.current;
        const r = row.current;
        const ttl = title.current;
        const faqScreen = stickyOf(list);
        const faqScene = faqScreen?.parentElement;
        if (!sec || !scr || !r || !ttl || !faqScreen || !faqScene) return;
        sec.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
        // Экран встаёт в кадре, где экран FAQ отпускает скролл: сцена заходит на FAQ ровно настолько
        const release = offsetIn(faqScene, document.body).y + faqScene.offsetHeight - faqScreen.offsetHeight;
        const natural = offsetIn(sec, document.body).y - (parseFloat(sec.style.marginTop) || 0);
        sec.style.marginTop = `${release - natural}px`;
        const pin = offsetIn(sec, document.body).y;
        const h = scr.offsetHeight;
        // Оба экрана – во всю ширину окна и на всю высоту: координаты в экране FAQ – те же, что в экране финала
        const at = offsetIn(list, faqScreen);
        const rowAt = offsetIn(r, scr);
        const titleAt = offsetIn(ttl, scr);
        const cx = r.offsetWidth / 2;
        const cy = r.offsetHeight / 2;
        const geo: IGeo = {
            line: { x: at.x, y: at.y + list.offsetHeight - 1.5, w: list.offsetWidth },
            row: { x: rowAt.x + cx, y: rowAt.y + cy },
            slots: slots.current.map((el) => el
                ? { dx: cx - (el.offsetLeft + el.offsetWidth / 2), dy: cy - (el.offsetTop + el.offsetHeight / 2), w: el.offsetWidth, h: el.offsetHeight }
                : NO_SLOT)
        };
        // FAQ уходит вверх со скоростью скролла: его нижняя линия поднимается над рядом и заголовком с запасом 12px
        const clear = (top: number) => (geo.line.y - top + 12) / Math.max(1, h);
        const tm = ctaTimes({
            line: geo.line.w,
            lift: Math.hypot(geo.row.x - (geo.line.x + geo.line.w / 2), geo.row.y - geo.line.y),
            apart: Math.max(0, ...geo.slots.map((sl) => Math.hypot(sl.dx, sl.dy))),
            stretch: Math.max(0, ...geo.slots.map((sl) => (sl.w - sl.h) / 2)),
            clearRow: clear(rowAt.y),
            clearTitle: clear(titleAt.y)
        }, h);
        setG({ ...geo, t: tm });
        pinY.set(pin);
        screenH.set(h);
    }, [list, pinY, screenH]);

    useLayoutEffect(() => {
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        // Список меняет высоту, когда раскрывают другой вопрос; обёртка разделов – когда сцены выше пересчитали длину
        [scene.current, list, scene.current?.parentElement].forEach((el) => el && observer.observe(el));
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [measure, list]);

    // Экран встал – линию у списка FAQ забирает финал (по скроллу: в этот кадр список и копия совпадают)
    useMotionValueEvent(raw, 'change', (v) => faqLineTook.set(v >= 0 ? 1 : 0));
    useEffect(() => {
        faqLineTook.set(raw.get() >= 0 ? 1 : 0);
        return () => faqLineTook.set(0);
    }, [raw]);
    // Кнопки нажимаются, когда у них проявились подписи: до того экран пропускает клики к FAQ под ним
    useMotionValueEvent(time, 'change', (v) => setLive(v >= t.label[0] + t.label[1] * .5));

    // Tab до кнопок раньше, чем они собрались: сцена доезжает до собранного финала (как колода кейсов)
    const onFocus = () => {
        if (live) return;
        window.scrollTo({ top: pinY.get() + (end(t.label) + .05) * screenH.get(), behavior: 'smooth' });
    };

    // Линия: чернеет и толстеет, концы сходятся к середине
    const lineX = useTransform(time, (v) => g ? g.line.x + g.line.w / 2 * move(k(v, t.shrink)) : 0);
    const lineW = useTransform(time, (v) => g ? g.line.w * (1 - move(k(v, t.shrink))) : 0);
    const ink = useTransform(time, (v) => k(v, t.ink));
    const thick = useTransform(ink, (i) => 1 + i);
    const lineOn = useTransform([raw, time], ([r, v]: number[]) => r >= 0 && v < end(t.shrink) ? 1 : 0);

    // Шарик: вырастает на середине линии, поднимается к центру ряда и дорастает до высоты кнопки
    const slot0 = g?.slots[0] ?? NO_SLOT;
    const ballX = useTransform(time, (v) => g ? lerp(g.line.x + g.line.w / 2, g.row.x, move(k(v, t.lift))) : 0);
    const ballY = useTransform(time, (v) => g ? lerp(g.line.y, g.row.y, move(k(v, t.lift))) : 0);
    const ballScale = useTransform(time, (v) => easeOut(k(v, t.ball)) * lerp(1, slot0.h / RIDER, move(k(v, t.grow))));
    const ballOn = useTransform([raw, time], ([r, v]: number[]) => r >= 0 && v < end(t.grow) ? 1 : 0);

    const label = useTransform(time, (v) => k(v, t.label));
    const note = useTransform(time, (v) => k(v, t.note));

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${s.scene}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${t.path * 100}vh)` } as CSSProperties}
            aria-labelledby="sites-cta-title"
            data-cta-scene=""
        >
            <div ref={screen} className={`${sc.screen} ${s.screen} ${live ? s.live : ''}`}>
                <motion.span className={s.line} style={{ x: lineX, y: g?.line.y ?? 0, width: lineW, scaleY: thick, opacity: lineOn }} aria-hidden="true">
                    <motion.span className={s.ink} style={{ opacity: ink }} />
                </motion.span>
                <motion.span className={s.ball} style={{ x: ballX, y: ballY, scale: ballScale, opacity: ballOn }} aria-hidden="true" />
                <div className={`${s.cta} ${s.staged}`}>
                    <h2 ref={title} id="sites-cta-title" className={`${ralewayBold.className} ${p.title}`}>
                        <Rise progress={time} from={t.title[0]} dur={t.title[1]}>{sections.cta.title}</Rise>
                    </h2>
                    <div ref={row} className={`${ralewayBold.className} ${s.buttons}`} data-goal-place="sites_final" onFocus={onFocus}>
                        {buttons(tgHref, (l) => <motion.span className={s.label} style={{ opacity: label }}>{l}</motion.span>).map((item, i) => (
                            <span key={i} ref={(el) => { slots.current[i] = el }} className={s.slot} style={{ zIndex: 2 - i }}>
                                <Morph time={time} t={t} slot={g?.slots[i] ?? NO_SLOT}>{item}</Morph>
                            </span>
                        ))}
                    </div>
                    <motion.p className={s.note} style={{ opacity: note }}>{sections.cta.text}</motion.p>
                </div>
            </div>
        </section>
    );
};

// Финал (SERVICES_PLAN У5б, 5б), как CtaScene на /ai: пока FAQ – липкая сцена, финал – липкий экран со стыком от него
// (нижняя линия FAQ стягивается в шарик, шарик делится на кнопки); иначе – обычный раздел, как FAQ на телефоне
// и в низком окне. Без движения – обычный раздел
const SitesCta: FC<IProps> = ({ tgHref }) => {
    const reduceMotion = usePrefersReducedMotion();
    const [list, setList] = useState<HTMLElement | null>(null);
    useEffect(() => setList(faqListEl.get()), []);
    useMotionValueEvent(faqListEl, 'change', setList);

    return list && !reduceMotion ? <Scene tgHref={tgHref} list={list} /> : <Still tgHref={tgHref} />;
};

export default SitesCta;
