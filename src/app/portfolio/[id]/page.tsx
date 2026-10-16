import { FC } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import s from './page.module.scss'
import { baseOpenGraph } from "@/data/metadata";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { portfolioPageURL } from "@/constants/urls";

import CaseHero from "./components/CaseHero";
import CaseInfo from "./components/CaseInfo";
import CaseFeatures from "./components/CaseFeatures";
import CaseMetrics from "./components/CaseMetrics";
import KeyScreens from "./components/KeyScreens";
import BeforeAfter from "./components/BeforeAfter";
import { CaseCta, CaseQuote, NextCase } from "./components/CaseOutro";

interface IProps {
    params: Promise<{ id: string }>
}

// Страницы есть только у работ с кейсом, остальные адреса — 404
export const dynamicParams = false;

export const generateStaticParams = () =>
    portfolioWorks.filter((work) => portfolioCases[work.id]).map((work) => ({ id: work.id }));

const findCase = (id: string) => {
    const work = portfolioWorks.find((w) => w.id === id);
    const data = portfolioCases[id];
    return work && data ? { work, data } : null;
}

export const generateMetadata = async ({ params }: IProps): Promise<Metadata> => {
    const found = findCase((await params).id);
    if (!found) return {};
    const { work, data } = found;
    const title = `${work.name} — кейс`;

    return {
        title,
        description: data.headline,
        openGraph: {
            ...baseOpenGraph,
            title,
            description: data.headline,
        },
    };
}

// Один шаблон на все кейсы: блоки без данных не показываются
const CasePage: FC<IProps> = async ({ params }) => {
    const { id } = await params;
    const found = findCase(id);
    if (!found) notFound();
    const { work, data } = found;

    // Следующий кейс по кругу в порядке списка
    const withCase = portfolioWorks.filter((w) => portfolioCases[w.id]);
    const next = withCase[(withCase.findIndex((w) => w.id === id) + 1) % withCase.length];

    const after = data.after ?? data.slides.find((slide) => slide.type === 'desktop')?.src;

    return (
        <div className={s.page}>
            <CaseHero
                name={work.name}
                year={work.year}
                kind={data.kind}
                role={data.role}
                headline={data.headline}
                tags={data.tags}
                accent={data.accent}
                url={data.url}
                slides={data.slides}
            />

            <div className={s.body}>
                <CaseInfo info={data.info} />
                {data.features && <CaseFeatures features={data.features} />}
                <CaseMetrics metrics={data.metrics} />
                <KeyScreens name={work.name} accent={data.accent} screens={data.screens} video={data.screensVideo} />
                {data.before && after && <BeforeAfter name={work.name} before={data.before} after={after} />}
                {data.quote && <CaseQuote {...data.quote} accent={data.accent} />}
                <CaseCta url={data.url} />
                <NextCase href={`${portfolioPageURL}/${next.id}`} name={next.name} kind={portfolioCases[next.id].kind} />
            </div>
        </div>
    )
}

export default CasePage
