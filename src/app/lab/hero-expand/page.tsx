import type { Metadata } from "next";

import HeroExpand from "./components/HeroExpand";
import HomeCases from "@/app/(home)/components/cases/HomeCases";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { industryCounts } from "@/scripts/portfolioIndustry";

export const metadata: Metadata = {
    title: "Демо: первый экран раскрывается в выбор отрасли",
    robots: { index: false, follow: false },
};

// Черновик анимации для главной, отдельно от неё: карточка первого экрана при скролле
// раскрывается на весь экран, внутри снизу по очереди выезжает «Выберите свою отрасль».
// Ниже кейсы, чтобы видеть, как сцена отпускает страницу
export default function HeroExpandDemo() {
    const chips = industryCounts(portfolioWorks, portfolioIndustries)
        .map(({ industry, count }) => ({ id: industry.id, label: industry.label, count }));

    return (
        <>
            <HeroExpand chips={chips} />
            <HomeCases />
        </>
    );
}
