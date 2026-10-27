"use client";

import { FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";

import s from './KeyScreens.module.scss'
import { ICaseScreen } from "@/interfaces/portfolio";
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cameraOffset } from "./caseMath";
import Rise from "./Rise";

interface IProps {
    name: string,
    accent: string,
    screens: ICaseScreen[],
    video?: { src: string, poster: string, ratio?: number }
}

// Активный шаг: step -1 — окно ещё не прилипло, показываем общий вид; point — номер пункта в шаге с нуля;
// pre — следующий шаг уже ближе всех к линии чтения, но его текст ещё не дошёл до места
interface IActive {
    step: number,
    point: number,
    pre: boolean
}

// Картинки шагов: шаги с одной и той же картинкой показываются в одном слое, камера едет между метками
interface ILayer {
    src: string,
    fit?: 'width',
    steps: number[]
}

// Пропорции видео кейса по умолчанию: под них подстраивается высота окна
const VIDEO_RATIO = 672 / 1440;
const BAR_H = 42;

const pad = (v: number) => String(v).padStart(2, '0');

// «Ключевые экраны»: слева шаги с пунктами, справа прилипшее окно. При скролле окно показывает экран текущего шага,
// камера наезжает на метку текущего пункта; у кейса с видео скролл проматывает запись по отрезкам шагов
const KeyScreens: FC<IProps> = ({ name, accent, screens, video }) => {
    const reduceMotion = usePrefersReducedMotion();
    const mobile = useMediaQuery('(max-width: 899px)');

    const storyRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

    const [active, setActive] = useState<IActive>({ step: -1, point: 0, pre: false });
    const [hover, setHover] = useState<string | null>(null);
    const [view, setView] = useState({ w: 0, h: 0 });
    const [vh, setVh] = useState(800);
    const [frameW, setFrameW] = useState(0);
    const [ratios, setRatios] = useState<Record<string, number>>({});
    // Последнее положение камеры каждого слоя: уходящий слой гаснет, не сдвигаясь
    const lastCam = useRef<Record<string, string>>({});

    const activeRef = useRef(active);
    activeRef.current = active;
    // Время видео, к которому подтягивается кадр
    const videoTarget = useRef<number | null>(null);

    const layers: ILayer[] = [];
    screens.forEach((screen, j) => {
        if (!screen.image) return;
        const layer = layers.find((l) => l.src === screen.image!.src && l.fit === screen.image!.fit);
        if (layer) layer.steps.push(j);
        else layers.push({ src: screen.image.src, fit: screen.image.fit, steps: [j] });
    });

    // Окно с видео подстраивается по высоте под запись и встаёт по центру экрана
    const videoFrameH = video && frameW ? Math.round(frameW * (video.ratio ?? VIDEO_RATIO) + BAR_H) : 0;
    const frameTop = video && videoFrameH
        ? (mobile ? 12 : Math.max(Math.round(vh * 0.12), Math.round((vh - videoFrameH) / 2)))
        : null;
    // Где прилипает текст шага: под окном на телефоне, вровень с окном у видео
    const innerTop = frameTop != null ? (mobile ? frameTop + videoFrameH + 28 : frameTop) : null;
    const stickLine = innerTop ?? (mobile ? vh * 0.46 + 28 : vh * 0.22);

    useLayoutEffect(() => {
        const measure = () => {
            setVh(window.innerHeight);
            if (frameRef.current) setFrameW(frameRef.current.getBoundingClientRect().width);
            if (viewRef.current) setView({ w: viewRef.current.clientWidth, h: viewRef.current.clientHeight });
        };
        measure();
        const observer = new ResizeObserver(measure);
        if (viewRef.current) observer.observe(viewRef.current);
        if (frameRef.current) observer.observe(frameRef.current);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);

    // Какой шаг и пункт сейчас у линии чтения — середина экрана, на телефоне ниже, под окном
    const tick = useCallback(() => {
        const story = storyRef.current, frame = frameRef.current;
        if (!story || !frame) return;
        const steps = stepRefs.current.filter((el): el is HTMLDivElement => !!el);
        if (!steps.length) return;
        const h = window.innerHeight;
        const target = mobile ? h * 0.7 : h * 0.5;

        let best = 0, bestDist = Infinity, point = 0;
        steps.forEach((el, j) => {
            const r = el.getBoundingClientRect();
            const dist = r.top > target ? r.top - target : r.bottom < target ? target - r.bottom : 0;
            if (dist < bestDist) {
                bestDist = dist;
                best = j;
                const n = Math.max(1, screens[j].points.length);
                point = Math.min(n - 1, Math.max(0, Math.floor((target - r.top) / r.height * n)));
            }
        });

        // Видео: пока текст шага прилип, скролл проходит его отрезок записи
        if (video) {
            let t = screens[0].seg?.[0] ?? 0;
            steps.forEach((el, j) => {
                const seg = screens[j].seg;
                if (!seg) return;
                const r = el.getBoundingClientRect();
                const q = stickLine - (r.top + 24);
                if (q <= 0) return;
                const inner = el.firstElementChild as HTMLElement | null;
                const span = j < steps.length - 1
                    ? steps[j + 1].getBoundingClientRect().top - r.top
                    : r.height - 48 - (inner?.offsetHeight ?? 0);
                t = seg[0] + (seg[1] - seg[0]) * Math.min(1, q / Math.max(1, span));
            });
            videoTarget.current = t;
        }

        const frameStuck = frame.getBoundingClientRect().top <= parseFloat(getComputedStyle(frame).top) + 2;
        if (!frameStuck || steps[0].getBoundingClientRect().top + 24 > stickLine + 6) {
            best = -1;
            point = 0;
        }
        let pre = false;
        if (best > 0) {
            const inner = steps[best].firstElementChild as HTMLElement | null;
            if (inner && inner.getBoundingClientRect().top > parseFloat(getComputedStyle(inner).top) + 2) pre = true;
        }

        const cur = activeRef.current;
        if (best !== cur.step || point !== cur.point || pre !== cur.pre) {
            setActive({ step: best, point, pre });
            setHover(null);
        }
    }, [mobile, screens, stickLine, video]);

    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(() => { raf = 0; tick(); });
        };
        tick();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [tick]);

    // Кадр видео плавно догоняет нужное время: каждый кадр проходим пятую часть разницы
    useEffect(() => {
        if (!video) return;
        let raf = 0;
        let current: number | null = null;
        const loop = () => {
            raf = requestAnimationFrame(loop);
            const v = videoRef.current;
            if (!v || v.readyState < 1) return;
            const target = Math.min((v.duration || 99) - 0.04, videoTarget.current ?? screens[0].seg?.[0] ?? 0);
            if (!v.paused) v.pause();
            if (current == null) current = target;
            const d = target - current;
            current = reduceMotion || Math.abs(d) < 0.01 ? target : current + d * 0.2;
            if (!v.seeking && Math.abs(v.currentTime - current) > 0.02) v.currentTime = current;
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [video, screens, reduceMotion]);

    const overview = active.step < 0 || active.pre;
    const j = Math.max(0, active.step);
    // Наведённый пункт важнее пункта у линии чтения, но только в текущем шаге
    const key = hover && +hover.split('-')[0] === j ? hover : `${j}-${active.point + 1}`;
    const pointN = overview ? 0 : +key.split('-')[1] || 1;

    const camera = (layer: ILayer, on: boolean) => {
        const ratio = ratios[layer.src];
        const { w: W, h: H } = view;
        if (!ratio || !W) return null;
        // Заполнить окно или вписать по ширине
        const w = layer.fit === 'width' ? W : Math.max(W, H / ratio);
        const h = w * ratio;
        const mark = on && !overview ? screens[j].points[pointN - 1]?.mark : undefined;
        const zoom = mark?.zoom ?? 1;
        const transform = `translate(${cameraOffset(w, W, mark?.cx ?? 0.5, zoom).toFixed(1)}px,${cameraOffset(h, H, mark?.cy ?? 0, zoom).toFixed(1)}px) scale(${zoom})`;
        if (on) lastCam.current[layer.src] = transform;
        return { w, h, zoom, transform: on ? transform : lastCam.current[layer.src] ?? transform };
    };

    return (
        <section className={s.section} aria-labelledby="screens-title">
            <Rise>
                <h2 id="screens-title" className={`${ralewayBold.className} ${s.title}`}>Ключевые экраны</h2>
            </Rise>

            <div
                ref={storyRef}
                className={s.story}
                onPointerOver={(e) => {
                    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-pt]');
                    const k = li?.dataset.pt ?? null;
                    if (k !== hover) setHover(k);
                }}
                onPointerLeave={() => setHover(null)}
            >
                <div
                    ref={frameRef}
                    className={`${s.frame} ${video ? s.frameVideo : ''}`}
                    style={frameTop != null ? { top: frameTop, height: videoFrameH } : undefined}
                >
                    <div className={s.bar}>
                        <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
                        <span className={`${allerta.className} ${s.count}`}>
                            {overview ? '' : `${pad(j + 1)} / ${pad(screens.length)}`}
                        </span>
                    </div>
                    <div ref={viewRef} className={s.view}>
                        {layers.map((layer) => {
                            const on = layer.steps.includes(j);
                            const cam = camera(layer, on);
                            return (
                                <div key={layer.src + layer.fit} className={`${s.layer} ${on ? s.layerOn : ''}`}>
                                    <div
                                        className={s.cam}
                                        style={cam ? { width: cam.w, height: cam.h, transform: cam.transform } : { width: '100%', height: '100%' }}
                                    >
                                        <Image
                                            src={layer.src}
                                            alt={`${name}: ${screens[layer.steps[0]].title}`}
                                            fill
                                            sizes="(max-width: 899px) 100vw, 900px"
                                            onLoad={(e) => {
                                                const img = e.currentTarget;
                                                if (img.naturalWidth) setRatios((r) => ({ ...r, [layer.src]: img.naturalHeight / img.naturalWidth }));
                                            }}
                                        />
                                        {layer.steps.flatMap((st) => screens[st].points.map((p, k) => {
                                            if (!p.mark) return null;
                                            const shown = on && !overview && st === j && k + 1 === pointN;
                                            return (
                                                <span
                                                    key={`${st}-${k}`}
                                                    className={s.badge}
                                                    aria-hidden="true"
                                                    style={{
                                                        display: shown ? 'flex' : 'none',
                                                        left: `${p.mark.x * 100}%`,
                                                        top: `${p.mark.y * 100}%`,
                                                        background: accent,
                                                        boxShadow: `0 0 0 5px color-mix(in srgb, ${accent} 30%, transparent), 0 6px 16px rgba(0,0,0,0.3)`,
                                                        transform: `scale(${(1 / (cam?.zoom ?? 1)).toFixed(3)})`
                                                    }}
                                                >
                                                    {k + 1}
                                                </span>
                                            );
                                        }))}
                                    </div>
                                </div>
                            );
                        })}
                        {video && (
                            <div className={s.videoLayer}>
                                <video
                                    ref={videoRef}
                                    src={video.src}
                                    poster={video.poster}
                                    muted
                                    playsInline
                                    preload="auto"
                                    aria-label={`${name}: запись сайта`}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className={s.steps}>
                    {screens.map((screen, k) => {
                        const n = Math.max(1, screen.points.length);
                        const minHeight = Math.round(Math.max(
                            mobile ? 0.52 * vh : Math.min(0.7 * vh, 620),
                            (n + 0.6) * (mobile ? 0.3 : 0.34) * vh,
                            screen.seg ? (screen.seg[1] - screen.seg[0]) * 0.14 * vh + 320 : 0
                        ));
                        return (
                            <div
                                key={screen.title}
                                ref={(el) => { stepRefs.current[k] = el; }}
                                className={s.step}
                                style={{ minHeight, opacity: !overview && k === j ? 1 : 0.3 }}
                            >
                                <div className={s.stepInner} style={innerTop != null ? { top: innerTop } : undefined}>
                                    <div className={s.stepHead}>
                                        <span className={`${allerta.className} ${s.num}`}>{pad(k + 1)}</span>
                                        <span className={s.goal}>{screen.goal}</span>
                                    </div>
                                    <h3 className={`${ralewayBold.className} ${s.stepTitle}`}>{screen.title}</h3>
                                    <p className={s.text}>{screen.text}</p>
                                    {screen.points.length > 0 && (
                                        <ol className={s.points}>
                                            {screen.points.map((p, i) => {
                                                const pk = `${k}-${i + 1}`;
                                                const on = !overview && pk === key;
                                                return (
                                                    <li
                                                        key={pk}
                                                        data-pt={pk}
                                                        className={s.point}
                                                        style={{ opacity: overview ? 1 : k === j && !on ? 0.5 : 1 }}
                                                    >
                                                        <span
                                                            className={s.pointNum}
                                                            style={on ? { background: accent, borderColor: accent, color: '#fff' } : undefined}
                                                        >
                                                            {i + 1}
                                                        </span>
                                                        <span className={s.pointText}>{p.text}</span>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    )
}

export default KeyScreens
