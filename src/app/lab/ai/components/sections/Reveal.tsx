"use client";

import { FC, ReactNode, useEffect, useRef, useState } from "react";

import s from './Sections.module.scss'

interface IReveal {
    className?: string,
    children: ReactNode
}

// Тихое появление разделов ниже сцен: строки с линией сверху – линия прорисовывается слева направо, текст поднимается
// (в стилях – .item и .line внутри). Один раз, по времени, когда блок вошёл в экран. Пока скрипт не запустился, всё видно:
// прятать начинаем только после монтирования (armed)
const Reveal: FC<IReveal> = ({ className, children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [armed, setArmed] = useState(false);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        // Блок уже выше середины экрана (вернулись назад, перезагрузка внизу) – без появления
        if (el.getBoundingClientRect().top < window.innerHeight * .85) return;
        setArmed(true);
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            setShown(true);
            observer.disconnect();
        }, { rootMargin: '0px 0px -15% 0px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`${s.reveal} ${armed ? s.armed : ''} ${shown ? s.shown : ''} ${className ?? ''}`}>
            {children}
        </div>
    );
};

export default Reveal;
