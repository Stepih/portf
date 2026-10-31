import { describe, expect, it } from "vitest";
import { commonTopics, faq, moreOptions, nav, sitesDetails } from "./sitesPage";
import { services } from "./offer";
import { portfolioWorks } from "./portfolio";
import { portfolioCases } from "./portfolioCases";

// Все клиентские строки страницы /sites одной строкой – для проверок по тексту
const allText = (): string => JSON.stringify({ sitesDetails, commonTopics, moreOptions, faq });

describe("sitesPage", () => {
    it("в FAQ нет сумм, вопросы не повторяются (SALES_PLAN 3.8)", () => {
        for (const item of faq) expect(item.answer).not.toMatch(/₽/);
        const questions = faq.map((item) => item.question);
        expect(new Set(questions).size).toBe(questions.length);
    });

    // SERVICES_PLAN, правило 4: договор не обещаем, пока нет оферты; «шаблонных решений нет» не пишем
    it("нет обещания договора и запрещённых формулировок", () => {
        const text = allText();
        expect(text).not.toMatch(/по договору|подписываем|оферт/i);
        expect(text).not.toMatch(/шаблонн/i);
        expect(text).not.toMatch(/владелец/i);
    });

    it("тире – «–», а не «—»", () => {
        expect(allText()).not.toMatch(/—/);
    });

    it("кейсы разделов – работы портфолио со страницей кейса", () => {
        const ids = portfolioWorks.map((work) => work.id);
        for (const details of Object.values(sitesDetails)) {
            for (const item of details.cases) {
                expect(ids).toContain(item.id);
                expect(portfolioCases).toHaveProperty(item.id);
            }
        }
    });

    it("разделы сайтов – те же услуги, что карточки сайтов на главной, и все в навигации", () => {
        const sites = services.filter((service) => service.id !== 'ai').map((service) => service.id);
        expect(Object.keys(sitesDetails)).toEqual(sites);
        const anchors = nav.map((item) => item.id);
        for (const id of sites) expect(anchors).toContain(id);
        expect(new Set(anchors).size).toBe(anchors.length);
    });
});
