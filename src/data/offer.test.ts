import { describe, expect, it } from "vitest";
import { heroSlides, heroTitleSlide, industryChipCount, offerFaq, offerTitle, offerTrustLine, services } from "./offer";
import { portfolioWorks } from "./portfolio";

describe("offer", () => {
    it("надписи слайдов – только латиница: у Allerta Stencil нет кириллицы", () => {
        for (const slide of heroSlides) expect(slide.headline).toMatch(/^[\x20-\x7E’]+$/);
    });

    it("подпись слайда h1 – оффер, подписи в одну строку", () => {
        expect(heroSlides[heroTitleSlide].caption).toBe(offerTitle);
        for (const slide of heroSlides) expect(slide.caption.length).toBeLessThanOrEqual(50);
    });

    it("кейсы-примеры услуг есть в портфолио", () => {
        const ids = portfolioWorks.map((w) => w.id);
        for (const service of services) {
            for (const id of service.caseIds) expect(ids).toContain(id);
        }
    });

    it("id услуг не повторяются", () => {
        const ids = services.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    // SERVICES_PLAN У2: звонки и документы не продаются по цене заявок; ступени называются по задачам (copy_choices)
    it("у ИИ две ступени цены, без «лёгкий / простой / сложный»", () => {
        const ai = services.find((s) => s.id === 'ai')!;
        expect(ai.tiers).toHaveLength(2);
        for (const tier of ai.tiers!) {
            expect(tier.price).toMatch(/^от \d/);
            expect(`${tier.title} ${tier.condition}`).not.toMatch(/л[её]гк|прост|сложн/i);
        }
    });

    it("строка доверия собирается из чисел портфолио", () => {
        const line = offerTrustLine({
            count: 3,
            years: { from: 2024, to: 2026 },
            industries: [{ id: 'construction', label: '', audience: '' }, { id: 'travel', label: '', audience: '' }]
        });
        expect(line).toBe('3 проекта · 2024–2026 · стройка, туризм');
        expect(offerTrustLine({ count: 1, years: { from: 2026, to: 2026 }, industries: [] })).toBe('1 проект · 2026');
    });

    it("лишние отрасли сворачиваются в «и др.»", () => {
        const industries = (['construction', 'beauty', 'travel'] as const).map((id) => ({ id, label: '', audience: '' }));
        const stats = { count: 5, years: { from: 2023, to: 2026 }, industries };
        expect(offerTrustLine(stats, 2)).toBe('5 проектов · 2023–2026 · стройка, бьюти и др.');
        expect(offerTrustLine(stats, 3)).toBe('5 проектов · 2023–2026 · стройка, бьюти, туризм');
    });

    it("в FAQ нет цен и вопросы не повторяются: цены – в «Услугах и ценах» (3.8)", () => {
        for (const item of offerFaq) expect(item.answer).not.toMatch(/₽/);
        const questions = offerFaq.map((f) => f.question);
        expect(new Set(questions).size).toBe(questions.length);
    });

    it("подпись числа на чипе отрасли склоняется по числу", () => {
        expect([1, 2, 5].map(industryChipCount)).toEqual(['1 проект', '2 проекта', '5 проектов']);
    });
});
