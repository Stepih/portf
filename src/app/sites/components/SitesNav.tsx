"use client";

import { FC, useEffect, useRef, useState } from "react";

import s from './SitesNav.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";

interface IProps {
    items: { id: string, label: string }[]
}

// Навигация по разделам /sites (владелец, У5): липкая строка таблеток. Залита таблетка раздела, который сейчас
// под навигацией; на телефоне строка листается вбок и сама подводит залитую таблетку в кадр.
// Без JS – обычные якоря
const SitesNav: FC<IProps> = ({ items }) => {
    const [active, setActive] = useState<string | null>(null);
    const row = useRef<HTMLDivElement>(null);
    const links = useRef<Record<string, HTMLAnchorElement | null>>({});

    // Текущий раздел – последний, чей верх уже поднялся выше трети окна
    useEffect(() => {
        const sections = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => !!el);
        const update = () => {
            const line = window.innerHeight / 3;
            let current: string | null = null;
            for (const el of sections) {
                if (el.getBoundingClientRect().top <= line) current = el.id;
            }
            // Конец страницы: последний раздел короткий и до трети окна не доходит
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections.at(-1)?.id ?? current;
            setActive(current);
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [items]);

    // Залитая таблетка – в кадре строки. scrollTo строки, а не scrollIntoView: тот двигал бы и страницу
    useEffect(() => {
        const r = row.current;
        const link = active ? links.current[active] : null;
        if (!r || !link || r.scrollWidth <= r.clientWidth) return;
        const left = link.offsetLeft - (r.clientWidth - link.offsetWidth) / 2;
        r.scrollTo({ left, behavior: 'smooth' });
    }, [active]);

    return (
        <nav aria-label="Разделы страницы" className={s.nav}>
            <div ref={row} className={`${ralewayBold.className} ${s.row}`}>
                {items.map((item) => (
                    <a
                        key={item.id}
                        ref={(el) => { links.current[item.id] = el }}
                        href={`#${item.id}`}
                        className={`${s.link} ${active === item.id ? s.active : ''}`}
                        aria-current={active === item.id ? 'location' : undefined}
                    >
                        {item.label}
                    </a>
                ))}
            </div>
        </nav>
    )
}

export default SitesNav
