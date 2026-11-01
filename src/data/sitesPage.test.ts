import { describe, expect, it } from "vitest";
import { build, buildUi, casesDeck, commonTopics, faq, head, moreOptions, morePills, payment, projectPath, sitesDetails, terms } from "./sitesPage";
import { services } from "./offer";
import { portfolioWorks } from "./portfolio";
import { portfolioCases } from "./portfolioCases";

// Все клиентские строки страницы /sites одной строкой – для проверок по тексту
const allText = (): string => JSON.stringify({ head, sitesDetails, build, buildUi, projectPath, commonTopics, moreOptions, faq, casesDeck, payment, terms, morePills });

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

    it("виды сайтов – те же услуги, что карточки сайтов на главной, и ссылки «Что входит →» ведут на их якоря", () => {
        const sites = services.filter((service) => service.id !== 'ai');
        expect(Object.keys(sitesDetails)).toEqual(sites.map((service) => service.id));
        for (const service of sites) expect(service.more).toMatch(new RegExp(`/sites#${service.id}$`));
    });

    // У5б: опции таблетками в окне – до 5, только с ценой и без повторов; остальные – тихой строкой
    it("таблетки опций: до 5 на вид, у каждой есть цена", () => {
        for (const [id, item] of Object.entries(build)) {
            const options = sitesDetails[id as keyof typeof sitesDetails].options;
            expect(item.pills.length).toBeGreaterThan(0);
            expect(item.pills.length).toBeLessThanOrEqual(5);
            const ids = item.pills.map((pill) => pill.option);
            expect(new Set(ids).size).toBe(ids.length);
            for (const pill of item.pills) expect(options[pill.option]?.price).toBeTruthy();
        }
    });

    // Счётчик сайта компании сходится с примером расчёта: 30 000 + 9 000 + 4 × 2 000 = от 47 000 ₽
    it("счётчик суммы сходится с примером расчёта", () => {
        const sum = build.corporate.sum!;
        const value = (text: string) => text.replace(/\s/g, '').split('×').map(Number).reduce((a, b) => a * b, 1);
        let total = 0;
        sum.terms.forEach((term, i) => {
            total += value(term.value);
            expect(sum.totals[i]).toBe(total);
        });
        const example = sitesDetails.corporate.example!.total.replace(/\D/g, '');
        expect(String(total)).toBe(example);
    });

    // У5а: у каждого вида сайта – выноски сцены сборки; путь проекта начинается с бесплатных шагов подряд
    it("сцена сборки и путь проекта", () => {
        expect(Object.keys(build)).toEqual(Object.keys(sitesDetails));
        for (const item of Object.values(build)) {
            expect(item.callouts.length).toBeGreaterThanOrEqual(3);
            // Группа – на шаге окна или сразу после сборки, шаги по порядку
            const steps = item.callouts.map((group) => group.at);
            expect(steps).toEqual([...steps].sort((a, b) => a - b));
            expect(Math.max(...steps)).toBeLessThanOrEqual(item.steps);
        }
        const free = projectPath.steps.map((step) => !!step.free);
        expect(free[0]).toBe(true);
        expect(free.indexOf(false)).toBe(free.lastIndexOf(true) + 1);
    });

    // V6: перед тире в подписях сцены – неразрывный пробел, тире не уходит в начало строки
    it("в выносках и шагах перед тире – неразрывный пробел", () => {
        const lines = [
            head.hint, ...Object.values(build).flatMap((item) => item.callouts.flatMap((group) => group.items)), ...projectPath.steps.map((step) => step.text),
            casesDeck.text, payment.refund, ...payment.stages.flatMap((stage) => stage.parts.map((part) => part.label ?? '')),
            ...terms.columns.flatMap((col) => [...col.items, ...(col.notes ?? [])]), morePills.quiet,
        ];
        for (const line of lines) expect(line).not.toMatch(/ –/);
    });

    it("шкалы оплаты – по 100%", () => {
        for (const topic of commonTopics) {
            for (const split of topic.splits ?? []) expect(split.reduce((a, b) => a + b, 0)).toBe(100);
        }
    });

    // У5б, этап 2: нижняя часть сценами – строки короткие, по одному фокусу на экран
    it("нижняя часть: путь 5–6 шагов, колонки до 6 пунктов, «Ещё делаю» до 6 таблеток с ценой, у кейсов – подпись", () => {
        expect(projectPath.steps.length).toBeGreaterThanOrEqual(5);
        expect(projectPath.steps.length).toBeLessThanOrEqual(6);
        expect(terms.columns.map((col) => col.title)).toEqual(['Входит в каждый сайт', 'Не входит', 'Остаётся вам']);
        for (const col of terms.columns) expect(col.items.length).toBeLessThanOrEqual(6);
        expect(morePills.pills.length).toBeLessThanOrEqual(6);
        for (const pill of morePills.pills) expect(pill.price).toBeTruthy();
        // Кейсы без повторов – у каждого есть подпись хотя бы в одном разделе
        const ids = [...new Set(Object.values(sitesDetails).flatMap((item) => item.cases.map((c) => c.id)))];
        for (const id of ids) {
            const texts = Object.values(sitesDetails).flatMap((item) => item.cases.filter((c) => c.id === id && c.text));
            expect(texts.length, id).toBeGreaterThan(0);
        }
    });

    // Факты с суммами, которых не будет в FAQ (этап 3), остаются на странице: хостинг, работа по часу, поддержка
    it("хостинг, работа по часу и поддержка – в колонках или «Ещё делаю»", () => {
        const text = JSON.stringify({ terms, morePills }).replace(/\u00a0| /g, ' ');
        for (const fact of ['от 300 ₽', '1 500 ₽/час', '1 000 ₽/час', 'Поддержка']) expect(text).toContain(fact);
        expect(JSON.stringify(projectPath)).toMatch(/2 недели/);
    });

    it("шкала оплаты: три суммы, у каждой доли – по 100%", () => {
        expect(payment.stages.map((stage) => stage.range.replace(/\s/g, ' '))).toEqual(['до 60 000 ₽', '60 000–⁠100 000 ₽', 'от 100 000 ₽']);
        for (const stage of payment.stages) expect(stage.parts.reduce((a, part) => a + part.share, 0)).toBe(100);
    });
});
