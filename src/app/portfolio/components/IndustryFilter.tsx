import { FC, useEffect, useRef } from "react";

import s from './IndustryFilter.module.scss'
import { IPortfolioIndustry, IPortfolioWork } from "@/interfaces/portfolio";
import { worksFor } from "@/scripts/portfolioIndustry";

interface IProps {
    works: IPortfolioWork[],
    industries: IPortfolioIndustry[],
    active: IPortfolioIndustry | null,
    onPick: (industry: IPortfolioIndustry | null) => void
}

// Кнопки отраслей над «Избранным»; отрасль без работ не показывается
const IndustryFilter: FC<IProps> = ({ works, industries, active, onPick }) => {
    const filters = [
        { industry: null, label: 'Все', count: works.length },
        ...industries
            .map((industry) => ({ industry, label: industry.label, count: worksFor(works, industry.id).length }))
            .filter((f) => f.count > 0)
    ];

    // На телефоне ряд кнопок прокручивается: выбранная кнопка из ссылки может оказаться за краем экрана
    const rowRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const row = rowRef.current;
        const button = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
        if (!row || !button || row.scrollWidth <= row.clientWidth) return;
        const shift = button.getBoundingClientRect().left - row.getBoundingClientRect().left;
        row.scrollLeft += shift - (row.clientWidth - button.offsetWidth) / 2;
    }, [active]);

    return (
        <div className={s.bar}>
            <span id="industry-title" className={s.caption}>Сфера бизнеса</span>
            <div ref={rowRef} className={s.filters} role="group" aria-labelledby="industry-title">
                {filters.map(({ industry, label, count }) => {
                    const pressed = (industry?.id ?? null) === (active?.id ?? null);
                    return (
                        <button
                            key={industry?.id ?? 'all'}
                            type="button"
                            className={`${s.filter} ${pressed ? s.active : ''}`}
                            aria-pressed={pressed}
                            onClick={() => onPick(industry)}
                        >
                            {label}
                            <span className={s.count}>{count}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default IndustryFilter
