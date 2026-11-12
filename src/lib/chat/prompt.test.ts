import { describe, expect, it } from "vitest";
import { deckAgents, monthlyRows } from "@/data/aiPage";
import { offerFaq, services } from "@/data/offer";
import { portfolioWorks } from "@/data/portfolio";
import { more, payment, sitesDetails } from "@/data/sitesPage";
import { buildChatPrompt, buildSystemPrompt, detectTopics, faqInBrief, plainText, sitePaths } from "./prompt";

const ask = (...questions: string[]) => questions.map((content) => ({ role: 'user' as const, content }));

describe("buildSystemPrompt – основа", () => {
    const prompt = buildSystemPrompt();

    it("цены и сроки всех услуг берутся из offer.ts", () => {
        for (const s of services) {
            expect(prompt).toContain(plainText(s.title));
            // У ИИ две ступени (SERVICES_PLAN У2): в промпте обе цены и оба срока, а не одна пара
            for (const p of s.tiers ?? [{ price: s.price, term: s.term }]) {
                expect(prompt).toContain(plainText(p.price));
                expect(prompt).toContain(plainText(p.term));
            }
            for (const e of s.examples ?? []) expect(prompt).toContain(plainText(e.text));
        }
    });

    // Вопросы FAQ главной, которые повторяет краткий слой (faqInBrief), в основу не идут
    it("FAQ главной и все работы портфолио попадают в основу", () => {
        for (const f of offerFaq) {
            const inBrief = faqInBrief.some((start) => plainText(f.question).startsWith(start));
            expect(prompt.includes(plainText(f.question))).toBe(!inBrief);
        }
        expect(faqInBrief.every((start) => offerFaq.some((f) => plainText(f.question).startsWith(start)))).toBe(true);
        for (const w of portfolioWorks) expect(prompt).toContain(w.name);
    });

    // Краткий слой (У6): ступени ИИ, расходы каждый месяц, данные, правки, оплата, гарантия – без добавок
    it("краткий слой условий – в основе", () => {
        for (const [, , sum] of monthlyRows) expect(prompt).toContain(plainText(sum));
        for (const stage of payment.stages) expect(prompt).toContain(plainText(stage.range));
        expect(prompt).toMatch(/Данные клиентов: .*российская модель/);
        expect(prompt).toMatch(/Если агент ошибается: Исправлю бесплатно/);
        expect(prompt).toMatch(/гарантия – 2 недели/);
        expect(prompt).toContain('Пилот: Неделя, один процесс');
    });

    it("подробностей страниц в основе нет", () => {
        expect(prompt).not.toContain(plainText(deckAgents[0].where));
        expect(prompt).not.toContain(plainText(sitesDetails.shop.onCall));
        expect(prompt).not.toContain(plainText(portfolioWorks[0].description));
    });

    // Адреса – только страницы этого сайта (решение владельца, У6): без внешних ссылок, Telegram и скрытых страниц
    it("адреса – только страницы сайта из списка", () => {
        expect(prompt).not.toMatch(/https?:\/\/|t\.me|\/music|\/media/);
        for (const path of prompt.match(/(?<![\w./])\/[a-z][\w\-/#]*/g) ?? []) expect(sitePaths).toContain(path);
        expect(sitePaths).toEqual(expect.arrayContaining(['/sites', '/sites#shop', '/ai', '/portfolio']));
        expect(prompt).toMatch(/Legiscan[^\n]*Кейс: \/portfolio\/legiscan/);
    });

    it("промпт одинаковый при каждой сборке", () => {
        expect(buildSystemPrompt()).toBe(prompt);
    });

    it("без невидимых символов вёрстки", () => {
        expect(prompt).not.toMatch(/[⁠  ]/);
    });

    // Основа уходит в каждый запрос: с кратким слоем она не длиннее промпта до У6 (9 267 символов)
    it("основа не разрастается", () => {
        expect(prompt.length).toBeLessThan(9500);
    });
});

describe("detectTopics", () => {
    it("тема по началу слов", () => {
        expect(detectTopics(ask('Сколько стоит лендинг?'))).toEqual(['sites']);
        expect(detectTopics(ask('Нужен интернет-магазин на 200 товаров'))).toEqual(['sites']);
        expect(detectTopics(ask('Можно бота для записи клиентов?'))).toEqual(['ai']);
        expect(detectTopics(ask('Сколько стоит такой ИИ-агент, как ты?'))).toEqual(['ai']);
        expect(detectTopics(ask('Покажите примеры работ'))).toEqual(['works']);
        expect(detectTopics(ask('Что за проект Legiscan?'))).toEqual(['works']);
        expect(detectTopics(ask('Расскажите про ONKEL.MOSCOW'))).toEqual(['works']);
        expect(detectTopics(ask('Сайт и агент для звонков вместе'))).toEqual(['sites', 'ai']);
    });

    it("слово внутри другого слова не считается", () => {
        // «ии» в «компаниями», «бот» в «работаете»
        expect(detectTopics(ask('Вы работаете с компаниями?'))).toEqual([]);
        expect(detectTopics(ask('Вы в каком городе?'))).toEqual([]);
    });

    it("уточняющий вопрос берёт тему прошлого вопроса клиента", () => {
        const messages = [
            { role: 'user' as const, content: 'Сколько стоит магазин?' },
            { role: 'assistant' as const, content: 'От 50 000 ₽, срок 2–3 недели.' },
            { role: 'user' as const, content: 'А что туда входит за эти деньги?' },
        ];
        expect(detectTopics(messages)).toEqual(['sites']);
    });

    it("старше двух вопросов клиента тема не тянется", () => {
        expect(detectTopics(ask('Сколько стоит лендинг?', 'Вы в каком городе?', 'А как с вами связаться?'))).toEqual([]);
    });

    it("ё и регистр не мешают", () => {
        expect(detectTopics(ask('ОТЧЁТ по маркетингу'))).toEqual(['ai']);
    });
});

describe("buildChatPrompt – основа и добавки", () => {
    const core = buildSystemPrompt();

    it("без темы – только основа", () => {
        expect(buildChatPrompt(ask('Вы в каком городе?'))).toBe(core);
    });

    it("сайты: опции, «не входит», FAQ и «Ещё делаю» со страницы /sites", () => {
        const prompt = buildChatPrompt(ask('Что входит в магазин?'));
        expect(prompt.startsWith(core)).toBe(true);
        for (const kind of Object.values(sitesDetails)) {
            for (const o of kind.options) expect(prompt).toContain(plainText(o.title));
        }
        expect(prompt).toContain(plainText(more.quiet));
        for (const row of [...more.columns.flatMap((c) => c.rows), more.wide]) expect(prompt).toContain(plainText(row.price));
        expect(prompt).toContain('Можно на Тильде?');
        expect(prompt).not.toContain(plainText(deckAgents[0].where));
    });

    it("ИИ: агенты второй ступени и FAQ со страницы /ai", () => {
        const prompt = buildChatPrompt(ask('Бот для проверки договоров'));
        for (const a of deckAgents) expect(prompt).toContain(plainText(a.where));
        expect(prompt).toContain('Можно заказать агента без сайта?');
    });

    it("работы: описания из портфолио", () => {
        const prompt = buildChatPrompt(ask('Какие кейсы у вас есть?'));
        for (const w of portfolioWorks) expect(prompt).toContain(plainText(w.description));
    });

    it("одинаковый вопрос – одинаковый промпт (кэш готовых ответов)", () => {
        expect(buildChatPrompt(ask('Сайт и бот'))).toBe(buildChatPrompt(ask('Сайт и бот')));
    });

    // Все три добавки сразу – редкий вопрос. 22 тыс. символов – около 8 тыс. токенов, верх предела CONVERSION_PLAN К3.2
    it("без невидимых символов и не больше 22 тыс. символов со всеми добавками", () => {
        const all = buildChatPrompt(ask('Сайт, бот и примеры работ'));
        expect(all).not.toMatch(/[⁠  ]/);
        expect(all.length).toBeLessThan(22000);
    });
});

describe("plainText", () => {
    it("убирает U+2060 и меняет неразрывный пробел на обычный", () => {
        expect(plainText("ИИ-⁠агент 1 000")).toBe("ИИ-агент 1 000");
    });
});
