"use client";

import { FC, KeyboardEvent, PointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { useInView, useReducedMotion } from "framer-motion";

import s from './BeforeAfter.module.scss'
import { ICaseBefore } from "@/interfaces/portfolio";
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import Rise from "./Rise";

interface IProps {
    name: string,
    before: ICaseBefore,
    after: string
}

// Уже 600px сравнение становится вертикальным: «до» сверху, ползунок ездит вверх-вниз
const VERTICAL_MAX = 600;

// «До и после»: новая версия под старой, ползунок открывает «до» на нужную долю
const BeforeAfter: FC<IProps> = ({ name, before, after }) => {
    const reduceMotion = useReducedMotion();
    const boxRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    // pos — доля «до» в процентах; base — исходное положение ползунка
    const [pos, setPos] = useState(50);
    const [base, setBase] = useState(50);
    const [vertical, setVertical] = useState(false);
    const [aspect, setAspect] = useState(16 / 9);
    const [afterRatio, setAfterRatio] = useState(0);

    const inView = useInView(boxRef, { once: true, margin: '0px 0px -30% 0px' });
    const noSite = 'text' in before;

    // Пропорции блока по ширине: на телефоне выше, но не уже самой картинки «после»
    useLayoutEffect(() => {
        const box = boxRef.current;
        if (!box) return;
        const layout = () => {
            const w = box.clientWidth;
            const v = w > 0 && w < VERTICAL_MAX;
            setVertical(v);
            setAspect(Math.max(v ? 2 / 3 : w < 900 ? 4 / 3 : 16 / 9, afterRatio));
        };
        layout();
        const observer = new ResizeObserver(layout);
        observer.observe(box);
        return () => observer.disconnect();
    }, [afterRatio]);

    // В вертикальном режиме ползунок стоит под текстом «Сайта не было», чтобы текст был виден целиком
    useLayoutEffect(() => {
        const box = boxRef.current, panel = panelRef.current;
        const h = box?.clientHeight ?? 0;
        const next = vertical && panel && h ? Math.min(75, Math.max(50, (panel.scrollHeight + 16) / h * 100)) : 50;
        setBase(next);
        if (!dragging.current) setPos(next);
    }, [vertical, aspect]);

    const moveTo = useCallback((x: number, y: number) => {
        const box = boxRef.current;
        if (!box) return;
        const r = box.getBoundingClientRect();
        const p = vertical ? (y - r.top) / r.height * 100 : (x - r.left) / r.width * 100;
        setPos(Math.min(100, Math.max(0, p)));
    }, [vertical]);

    useEffect(() => {
        const onMove = (e: globalThis.PointerEvent) => { if (dragging.current) moveTo(e.clientX, e.clientY); };
        const onUp = () => { dragging.current = false; };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [moveTo]);

    // Подсказка при первом появлении: ползунок качается вокруг исходного положения и затухает
    useEffect(() => {
        if (!inView || reduceMotion) return;
        let raf = 0;
        const t0 = performance.now();
        const tick = (now: number) => {
            if (dragging.current) return;
            const t = Math.min(1, (now - t0) / 1800);
            setPos(base + Math.sin(t * Math.PI * 2) * 22 * (1 - t));
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // Качается один раз, смена base после этого его не перезапускает
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView, reduceMotion]);

    // По площади мышью можно тянуть сразу; пальцем — только за ползунок, иначе не проскроллить страницу
    const onAreaDown = (e: PointerEvent) => {
        if (e.button !== 0 || dragging.current) return;
        if (e.pointerType === 'mouse' || !vertical) {
            dragging.current = true;
            moveTo(e.clientX, e.clientY);
        }
    };

    const onHandleDown = (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragging.current = true;
        moveTo(e.clientX, e.clientY);
    };

    const onKey = (e: KeyboardEvent) => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 5 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -5 : 0;
        if (!d) return;
        e.preventDefault();
        setPos((p) => Math.min(100, Math.max(0, p + d)));
    };

    const rest = (100 - pos).toFixed(2);

    return (
        <section className={s.section} aria-labelledby="ba-title">
            <Rise className={s.head}>
                <h2 id="ba-title" className={`${ralewayBold.className} ${s.title}`}>До и после</h2>
                <span className={s.hint}>Потяните ползунок</span>
            </Rise>

            <Rise>
                <div
                    ref={boxRef}
                    className={`${s.box} ${vertical ? s.vertical : ''}`}
                    style={{ aspectRatio: aspect.toFixed(4) }}
                    onPointerDown={onAreaDown}
                >
                    <div className={s.after}>
                        <Image
                            src={after}
                            alt={`После: ${name}`}
                            width={0}
                            height={0}
                            sizes="(max-width: 1200px) 100vw, 1160px"
                            draggable={false}
                            onLoad={(e) => {
                                const img = e.currentTarget;
                                if (img.naturalHeight) setAfterRatio(img.naturalWidth / img.naturalHeight);
                            }}
                        />
                    </div>

                    <div className={s.before} style={{ clipPath: vertical ? `inset(0 0 ${rest}% 0)` : `inset(0 ${rest}% 0 0)` }}>
                        {noSite ? (
                            <div ref={panelRef} className={s.panel}>
                                <span className={`${allerta.className} ${s.panelTitle}`}>Сайта не было</span>
                                <p className={s.panelText}>«{before.text}»</p>
                                <span className={s.panelNote}>со слов клиента</span>
                                <ul className={s.channels}>
                                    {before.channels.map((ch) => <li key={ch} className={s.channel}>{ch}</li>)}
                                </ul>
                            </div>
                        ) : (
                            <Image
                                src={before.src}
                                alt={`До: ${name}`}
                                width={0}
                                height={0}
                                sizes="(max-width: 1200px) 100vw, 1160px"
                                draggable={false}
                            />
                        )}
                    </div>

                    <span className={`${s.label} ${s.labelBefore}`}>{noSite ? 'До: сайта не было' : 'До'}</span>
                    <span className={`${s.label} ${s.labelAfter}`}>После</span>

                    <div
                        className={s.handle}
                        role="slider"
                        tabIndex={0}
                        aria-label="Сравнение до и после"
                        aria-orientation={vertical ? 'vertical' : 'horizontal'}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(pos)}
                        style={vertical ? { top: `${pos.toFixed(2)}%` } : { left: `${pos.toFixed(2)}%` }}
                        onPointerDown={onHandleDown}
                        onKeyDown={onKey}
                    >
                        <span className={s.line} />
                        <span className={s.knob} aria-hidden="true">{vertical ? '↕' : '↔'}</span>
                    </div>
                </div>
            </Rise>
        </section>
    )
}

export default BeforeAfter
