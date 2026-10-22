"use client";

import { FC } from "react";

import s from './HomeCases.module.scss'
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { IPortfolioWork } from "@/interfaces/portfolio";
import WorkCard from "@/app/portfolio/components/WorkCard";

interface IProps {
    items: IPortfolioWork[]
}

// Одинаковая высота макета: в один ряд «ступеньки» из сетки портфолио выглядят случайными
const COVER_HEIGHT = 260;

const HomeCasesGrid: FC<IProps> = ({ items }) => {
    const mobile = useMediaQuery('(max-width: 899px)');

    return (
        <div className={s.grid}>
            {/* Без номера: «03 / 02 / 08» клиенту ничего не говорит (CONVERSION_PLAN К4.1) */}
            {items.map((work) => (
                <WorkCard key={work.id} work={{ ...work, coverHeight: COVER_HEIGHT }} mobile={mobile} />
            ))}
        </div>
    )
}

export default HomeCasesGrid
