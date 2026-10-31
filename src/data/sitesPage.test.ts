import { describe, expect, it } from "vitest";
import { build, buildUi, commonTopics, faq, head, moreOptions, nav, projectPath, sitesDetails } from "./sitesPage";
import { services } from "./offer";
import { portfolioWorks } from "./portfolio";
import { portfolioCases } from "./portfolioCases";

// Все клиентские строки страницы /sites одной строкой – для проверок по тексту
const allText = (): string => JSON.stringify({ head, sitesDetails, build, buildUi, projectPath, commonTopics, moreOptions, faq });

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

    // У5а: у каждого вида сайта – выноски сцены сборки; путь проекта начинается с бесплатных шагов подряд
    it("сцена сборки и путь проекта", () => {
        expect(Object.keys(build)).toEqual(Object.keys(sitesDetails));
        for (const item of Object.values(build)) expect(item.callouts.length).toBeGreaterThanOrEqual(3);
        const free = projectPath.steps.map((step) => !!step.free);
        expect(free[0]).toBe(true);
        expect(free.indexOf(false)).toBe(free.lastIndexOf(true) + 1);
    });

    // V6: перед тире в подписях сцены – неразрывный пробел, тире не уходит в начало строки
    it("в выносках и шагах перед тире – неразрывный пробел", () => {
        const lines = [head.hint, ...Object.values(build).flatMap((item) => item.callouts), ...projectPath.steps.map((step) => step.text)];
        for (const line of lines) expect(line).not.toMatch(/ –/);
    });

    it("шкалы оплаты – по 100%", () => {
        for (const topic of commonTopics) {
            for (const split of topic.splits ?? []) expect(split.reduce((a, b) => a + b, 0)).toBe(100);
        }
    });
});
