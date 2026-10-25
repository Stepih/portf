"use client";

import { FC, useContext, useLayoutEffect, useRef, useState } from "react";

import h from './HomeCases.module.scss'
import s from './CaseCard.module.scss'
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { IPortfolioWork } from "@/interfaces/portfolio";
import { SceneAfterContext } from "../hero/sceneAfter";
import CaseCard, { IStack, ITiming } from "./CaseCard";

interface IProps {
    items: IPortfolioWork[]
}

// Колода: наклон и масштаб нижних карт; на телефоне карта лежит под предыдущей выше на DEAL_UP, px
const DEAL_TILT = 7;
const DEAL_SCALE = .94;
const DEAL_UP = 90;

// Окна на пути сцены после портала: крайние карты разъезжаются (правая чуть позже),
// текст выезжает, пока карты едут, – каскадом по карточкам и строкам, и готов, когда они легли
const sceneTiming = (i: number, middle: number): ITiming => ({
    dealFrom: i > middle ? .06 : 0,
    dealTo: i > middle ? .76 : .7,
    textFrom: .2 + i * .04,
    lineStep: .04,
    lineDur: .25,
});

// Верхняя карта колоды видна в дыре портала ещё до раздачи: её текст уже на месте, а не ждёт скролла (DESIGN_FIXES_2_PLAN, Д9)
const shownText = (timing: ITiming): ITiming => ({ ...timing, textFrom: -(3 * timing.lineStep + timing.lineDur) });

// Телефон: у каждой карточки свой прогресс, от появления снизу до 55% экрана
const ownTiming: ITiming = { dealFrom: 0, dealTo: .6, textFrom: .3, lineStep: .08, lineDur: .4 };

// Центр карточки в сетке без transform, px от левого верхнего угла сетки
interface IBox {
    x: number,
    y: number
}

// Сетка «Избранных кейсов» (ANIMATION_PLAN, 2Г): карты лежат колодой, скролл после портала раздаёт их по местам
const HomeCasesGrid: FC<IProps> = ({ items }) => {
    const shared = useContext(SceneAfterContext);
    const cards = useRef<(HTMLDivElement | null)[]>([]);
    const grid = useRef<HTMLDivElement>(null);
    const [boxes, setBoxes] = useState<IBox[]>([]);
    // Сетка в столбик (≤700px, как на главной) и мобильный вид карточки
    const column = useMediaQuery('(max-width: 700px)');
    const mobile = useMediaQuery('(max-width: 899px)');
    // Раздачу ведёт сцена – только на компьютере; на телефоне у сцены нет пути после портала
    const fromScene = shared !== null && !column;

    // offsetLeft/Top не видят transform: карты в колоде не сбивают замер
    useLayoutEffect(() => {
        if (!grid.current) return;
        const measure = () => setBoxes(cards.current.map((el) => el
            ? { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 }
            : { x: 0, y: 0 }));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(grid.current);
        return () => observer.disconnect();
    }, []);

    const middle = Math.floor(items.length / 2);

    // На компьютере – стопка на месте средней карты, нижние наклонены в свою сторону.
    // На телефоне каждая карта лежит под предыдущей и выезжает вниз
    const stackOf = (i: number): IStack | undefined => {
        if (!boxes[i]) return undefined;
        if (column) {
            if (i === 0) return undefined;
            return { x: 0, y: -DEAL_UP, rotate: i % 2 ? DEAL_TILT / 2 : -DEAL_TILT / 2, scale: DEAL_SCALE, z: items.length - i };
        }
        if (i === middle) return { x: 0, y: 0, rotate: 0, scale: 1, z: 2 };
        return {
            x: boxes[middle].x - boxes[i].x,
            y: boxes[middle].y - boxes[i].y,
            rotate: (i < middle ? -1 : 1) * DEAL_TILT,
            scale: DEAL_SCALE,
            z: 1,
        };
    };

    return (
        <div ref={grid} className={`${h.grid} ${s.grid}`}>
            {items.map((work, i) => (
                <div key={work.id} ref={(el) => { cards.current[i] = el; }} className={s.slot}>
                    {/* key: при смене режима (сцена или свой скролл) окна другие – карточка монтируется заново */}
                    <CaseCard
                        key={String(fromScene)}
                        work={work}
                        mobile={mobile}
                        shared={fromScene ? shared : null}
                        stack={stackOf(i)}
                        timing={fromScene ? (i === middle ? shownText(sceneTiming(i, middle)) : sceneTiming(i, middle)) : ownTiming}
                    />
                </div>
            ))}
        </div>
    )
}

export default HomeCasesGrid
