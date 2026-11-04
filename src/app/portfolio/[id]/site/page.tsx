import { FC } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";

interface IProps {
    params: Promise<{ id: string }>
}

// Страница есть только у кейсов с макетом в статике (поле demo)
export const dynamicParams = false;

export const generateStaticParams = () =>
    Object.entries(portfolioCases).filter(([, data]) => data.demo).map(([id]) => ({ id }));

const findDemo = (id: string) => {
    const work = portfolioWorks.find((w) => w.id === id);
    const src = portfolioCases[id]?.demo;
    return work && src ? { name: work.name, src } : null;
}

export const generateMetadata = async ({ params }: IProps): Promise<Metadata> => {
    const found = findDemo((await params).id);
    if (!found) return {};
    // Копия чужого сайта в поиске не нужна: в выдаче должен быть кейс
    return { title: `${found.name}: сайт`, robots: { index: false, follow: true } };
}

// Сайт во весь экран поверх шапки портфолио: во фрейме его стили, шрифты и плавный скролл не смешиваются с нашими
const CaseSitePage: FC<IProps> = async ({ params }) => {
    const found = findDemo((await params).id);
    if (!found) notFound();

    return (
        <iframe
            src={found.src}
            title={`${found.name} – сайт`}
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh', border: 0, zIndex: 50, background: '#0e0d0c' }}
        />
    );
}

export default CaseSitePage;
