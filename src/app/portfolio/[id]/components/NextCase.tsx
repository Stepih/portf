"use client";

import { FC, Suspense } from "react";

import s from './CaseOutro.module.scss'
import { allerta } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { PortfolioIndustry } from "@/interfaces/portfolio";
import { usePortfolioIndustry } from "@/hooks/usePortfolioIndustry";
import ArrowLink from "@/components/arrow-link/ArrowLink";
import PortfolioLink from "../../components/PortfolioLink";
import Rise from "./Rise";

export interface INextCase {
    id: string,
    name: string,
    kind: string
}

interface IProps {
    // Следующий кейс по общему списку
    next: INextCase,
    // Следующий кейс в подборке отрасли, если в ней больше одного кейса
    byIndustry: Partial<Record<PortfolioIndustry, INextCase>>
}

const NextCaseCard: FC<{ next: INextCase }> = ({ next }) => {
    return (
        <Rise>
            <PortfolioLink href={`${portfolioPageURL}/${next.id}`} className={`${s.card} ${s.next}`}>
                <ArrowLink />
                <span className={s.nextLabel}>Следующий кейс</span>
                <span className={`${allerta.className} ${s.nextName}`}>{next.name}</span>
                <span className={s.nextLabel}>{next.kind}</span>
            </PortfolioLink>
        </Rise>
    )
}

const IndustryNextCase: FC<IProps> = ({ next, byIndustry }) => {
    const industry = usePortfolioIndustry();
    return <NextCaseCard next={(industry && byIndustry[industry.id]) || next} />
}

// Карточка-ссылка на следующий кейс по кругу. Пришли из подборки отрасли (?for=) — следующий кейс из неё же
export const NextCase: FC<IProps> = (props) => {
    return (
        <Suspense fallback={<NextCaseCard next={props.next} />}>
            <IndustryNextCase {...props} />
        </Suspense>
    )
}
