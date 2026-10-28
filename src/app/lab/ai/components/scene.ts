"use client";

import { RefObject, useCallback, useLayoutEffect } from "react";
import { cubicBezier, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

// Черновик /lab/ai (SERVICES_PLAN У4): общее для сцен обоих вариантов. Приёмы – как у сцены первого экрана главной
// (HeroExpand): липкий экран, прогресс от скролла, сглаженный пружиной, потолок отставания, замеры без transform

// Сглаживание: щелчки колеса не дёргают анимацию, без перелёта, догоняет за ~0,3 с (как SMOOTH в HeroExpand)
export const SMOOTH = { stiffness: 170, damping: 30, restDelta: .0001 };

export const ease = cubicBezier(.4, 0, .2, 1);
export const easeOut = cubicBezier(.16, 1, .3, 1);
export const flyEase = cubicBezier(.3, .5, .5, 1);
export const spreadEase = cubicBezier(.2, .9, .3, 1);

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
// Доля отрезка [from, from + dur] к моменту v
export const span = (v: number, from: number, dur: number) => clamp01((v - from) / dur);

// Чуть перелетает цель и возвращается – как раздача колоды в «Избранных кейсах»
export const easeOutBack = (k: number) => {
    const c = 1.2;
    return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};

// Положение элемента внутри root без transform: сумма offsetLeft/Top по цепочке offsetParent
export const offsetIn = (el: HTMLElement, root: HTMLElement) => {
    let x = 0;
    let y = 0;
    let node: HTMLElement | null = el;
    while (node && node !== root) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
    }
    return { x, y };
};

interface ISceneRefs {
    scene: RefObject<HTMLElement | null>,
    // Путь анимации – сцена без запаса липкости
    path: RefObject<HTMLElement | null>,
    screen: RefObject<HTMLElement | null>
}

// Потолок отставания пружины от скролла, в экранах: при рывке (ползунок, End) она перескакивает до него.
// Меньше запаса липкости сцены (--hold в scene.module.scss)
const LAG_CAP = .3;

// Прогресс липкой сцены 0–1, сглаженный. measure – замер заново (ресайз, шрифты); onMeasure – замеры самой сцены
export const useStickyScene = ({ scene, path, screen }: ISceneRefs, onMeasure?: () => void) => {
    const sceneTop = useMotionValue(0);
    const sceneLen = useMotionValue(1);
    const lagCap = useMotionValue(1);
    const { scrollY } = useScroll();
    const raw = useTransform([scrollY, sceneTop, sceneLen], ([y, top, len]: number[]) => clamp01((y - top) / len));
    const progress = useSpring(raw, SMOOTH);

    useMotionValueEvent(scrollY, 'change', (y) => {
        const p = (y - sceneTop.get()) / sceneLen.get();
        const v = progress.get();
        const lo = clamp01(p - lagCap.get());
        const hi = clamp01(p + lagCap.get());
        if (v >= lo && v <= hi) return;
        progress.jump(v < lo ? lo : hi);
        progress.set(clamp01(p));
    });

    const measure = useCallback(() => {
        if (!scene.current || !path.current || !screen.current) return;
        scene.current.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
        // offsetTop, а не getBoundingClientRect: страница въезжает на 20px (template.tsx), замер во время въезда сбивал бы путь
        sceneTop.set(offsetIn(scene.current, document.body).y);
        const len = Math.max(1, path.current.offsetHeight - screen.current.offsetHeight);
        sceneLen.set(len);
        lagCap.set(LAG_CAP * screen.current.offsetHeight / len);
        onMeasure?.();
    }, [scene, path, screen, sceneTop, sceneLen, lagCap, onMeasure]);

    useLayoutEffect(() => {
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        [scene.current, path.current, screen.current].forEach((el) => el && observer.observe(el));
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [measure, scene, path, screen]);

    // Прокрутить к доле пути сцены (клик по шару – сцена проигрывается сама, плавным скроллом страницы)
    const scrollToProgress = useCallback((at: number) => {
        window.scrollTo({ top: sceneTop.get() + at * sceneLen.get(), behavior: 'smooth' });
    }, [sceneTop, sceneLen]);

    return { progress, measure, scrollToProgress };
};
