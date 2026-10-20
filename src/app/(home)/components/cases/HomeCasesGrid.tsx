"use client";

import { FC } from "react";

import s from './HomeCases.module.scss'
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { IHomeCase } from "@/scripts/homeCases";
import WorkCard from "@/app/portfolio/components/WorkCard";

interface IProps {
    items: IHomeCase[]
}

// Одинаковая высота макета: в один ряд «ступеньки» из сетки портфолио выглядят случайными
const COVER_HEIGHT = 260;

const HomeCasesGrid: FC<IProps> = ({ items }) => {
    const mobile = useMediaQuery('(max-width: 899px)');

    return (
        <div className={s.grid}>
            {items.map(({ work, num }) => (
                <WorkCard key={work.id} work={{ ...work, coverHeight: COVER_HEIGHT }} num={num} mobile={mobile} />
            ))}
        </div>
    )
}

export default HomeCasesGrid
