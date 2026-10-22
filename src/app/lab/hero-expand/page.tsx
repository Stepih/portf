import type { Metadata } from "next";
import Link from "next/link";

import HeroExpand, { MarkVariant } from "./components/HeroExpand";
import s from "./components/HeroExpand.module.scss";
import HomeCases from "@/app/(home)/components/cases/HomeCases";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { industryCounts } from "@/scripts/portfolioIndustry";

export const metadata: Metadata = {
    title: "Демо: первый экран раскрывается в выбор отрасли",
    robots: { index: false, follow: false },
};

// Что в кружке над заголовком, для сравнения: ?mark=works | tiles
const variants: { id: MarkVariant, label: string }[] = [
    { id: 'works', label: 'Число работ' },
    { id: 'tiles', label: 'Значок' },
];

// Черновик анимации для главной, отдельно от неё: карточка первого экрана при скролле
// раскрывается на весь экран, внутри снизу по очереди выезжает «Выберите свою отрасль».
// Ниже кейсы, чтобы видеть, как сцена отпускает страницу
export default async function HeroExpandDemo({ searchParams }: { searchParams: Promise<{ mark?: string }> }) {
    const { mark: param } = await searchParams;
    const mark = variants.find((v) => v.id === param)?.id ?? variants[0].id;
    const chips = industryCounts(portfolioWorks, portfolioIndustries)
        .map(({ industry, count }) => ({ id: industry.id, label: industry.label, count }));

    return (
        <>
            <nav className={s.switcher} aria-label="Что в кружке над заголовком">
                {variants.map((v) => (
                    <Link key={v.id} href={`?mark=${v.id}`} className={v.id === mark ? s.current : undefined} scroll={false}>
                        {v.label}
                    </Link>
                ))}
            </nav>

            {/* key: при смене варианта сцена монтируется заново */}
            <HeroExpand key={mark} chips={chips} worksCount={portfolioWorks.length} mark={mark} />
            <HomeCases />
        </>
    );
}
