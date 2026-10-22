import type { Metadata } from "next";
import Link from "next/link";

import HeroExpand, { PhotoVariant } from "./components/HeroExpand";
import s from "./components/HeroExpand.module.scss";
import HomeCases from "@/app/(home)/components/cases/HomeCases";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { industryCounts } from "@/scripts/portfolioIndustry";

export const metadata: Metadata = {
    title: "Демо: первый экран раскрывается в выбор отрасли",
    robots: { index: false, follow: false },
};

// Варианты фото для сравнения: ?photo=ride | pop | dock
const variants: { id: PhotoVariant, label: string }[] = [
    { id: 'ride', label: 'Уезжает вверх' },
    { id: 'pop', label: 'Сжимается' },
    { id: 'dock', label: 'Аватар над заголовком' },
];

// Черновик анимации для главной, отдельно от неё: карточка первого экрана при скролле
// раскрывается на весь экран, внутри снизу по очереди выезжает «Выберите свою отрасль».
// Ниже кейсы, чтобы видеть, как сцена отпускает страницу
export default async function HeroExpandDemo({ searchParams }: { searchParams: Promise<{ photo?: string }> }) {
    const { photo } = await searchParams;
    const photoVariant = variants.find((v) => v.id === photo)?.id ?? 'ride';
    const chips = industryCounts(portfolioWorks, portfolioIndustries)
        .map(({ industry, count }) => ({ id: industry.id, label: industry.label, count }));

    return (
        <>
            <nav className={s.switcher} aria-label="Вариант фото">
                {variants.map((v) => (
                    <Link key={v.id} href={`?photo=${v.id}`} className={v.id === photoVariant ? s.current : undefined} scroll={false}>
                        {v.label}
                    </Link>
                ))}
            </nav>

            {/* key: при смене варианта сцена монтируется заново и перемеряет фото */}
            <HeroExpand key={photoVariant} chips={chips} photoVariant={photoVariant} />
            <HomeCases />
        </>
    );
}
