import { useSearchParams } from "next/navigation";

import { IPortfolioIndustry } from "@/interfaces/portfolio";
import { findIndustry, INDUSTRY_PARAM } from "@/scripts/portfolioIndustry";

// Отрасль из адреса (?for=). На статической странице компонент с этим хуком оборачивают в Suspense,
// иначе useSearchParams отключает пререндер
export const usePortfolioIndustry = (): IPortfolioIndustry | null =>
    findIndustry(useSearchParams().get(INDUSTRY_PARAM));
