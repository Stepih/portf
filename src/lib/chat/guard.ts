// Защита демо-чата от накрутки (CONVERSION_PLAN К3.2). Отличить конкурента от клиента по вопросу нельзя,
// поэтому цель – ограничить худший случай в рублях: потолок расходов на сутки, лимиты на IP и на диалог.
// Все проверки идут до вызова модели и ничего не стоят

import { createHash } from "crypto";
import { CHAT_LIMITS } from "./request";
import type { IChatStore } from "./store";

export const CHAT_GUARD = {
    // Вопросов с одного IP за 10 минут и за сутки (выбор владельца – 30 в сутки)
    ipPerWindow: 15,
    ipWindowMin: 10,
    ipPerDay: 30,
    // Вопросов в одном диалоге: общий с окном чата, поэтому лежит в request.ts
    perDialog: CHAT_LIMITS.dialog,
    // Бюджет чата на всех посетителей за сутки по Москве, ₽ (владелец, 22.10.2026): около 1000 вопросов
    dailyBudgetRub: 50,
    // При какой доле бюджета слать владельцу уведомление в Telegram (раз в сутки на каждый порог)
    alertShares: [0.8, 1],
    // Сколько хранится готовый ответ на одинаковый первый вопрос, с
    answerTtlSec: 24 * 60 * 60,
} as const;

export type ChatLimitReason = 'ip' | 'dialog' | 'budget';

// Деньги в счётчиках – целые десятитысячные доли рубля: Redis INCRBY работает только с целыми
const UNITS_PER_RUB = 10_000;
export const toUnits = (rub: number) => Math.ceil(rub * UNITS_PER_RUB);
export const fromUnits = (units: number) => units / UNITS_PER_RUB;

const DAY_SEC = 24 * 60 * 60;

// Сутки по Москве (UTC+3): бюджет обнуляется в полночь по Москве
export const moscowDay = (now: number) => new Date(now + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Считает вопрос и отвечает, превышен ли лимит по IP. Окно 10 минут фиксированное: на стыке окон
// можно успеть до двух лимитов подряд, суточный лимит это не меняет
export const hitIpLimit = async (store: IChatStore, ip: string, now: number): Promise<boolean> => {
    const windowMs = CHAT_GUARD.ipWindowMin * 60 * 1000;
    const [inWindow, inDay] = await Promise.all([
        store.incr(`chat:ip:${ip}:w:${Math.floor(now / windowMs)}`, 1, windowMs / 1000),
        store.incr(`chat:ip:${ip}:d:${moscowDay(now)}`, 1, 2 * DAY_SEC),
    ]);
    return inWindow > CHAT_GUARD.ipPerWindow || inDay > CHAT_GUARD.ipPerDay;
};

type BudgetReservation =
    | { ok: true; settle: (actualUnits: number) => Promise<number> }
    | { ok: false; spentUnits: number };

// Резерв на худший случай до вызова модели: так параллельные запросы не проскочат за бюджет.
// settle – после ответа: списывает фактическую цену вместо резерва и возвращает, сколько потрачено за сутки
export const reserveBudget = async (store: IChatStore, units: number, now: number): Promise<BudgetReservation> => {
    const key = `chat:budget:${moscowDay(now)}`;
    const budget = toUnits(CHAT_GUARD.dailyBudgetRub);
    const spent = await store.incr(key, units, 2 * DAY_SEC);
    if (spent > budget) {
        await store.incr(key, -units, 2 * DAY_SEC);
        return { ok: false, spentUnits: spent - units };
    }
    return { ok: true, settle: (actualUnits) => store.incr(key, actualUnits - units, 2 * DAY_SEC) };
};

// Порог бюджета, о котором пора сообщить владельцу; каждый – раз в сутки. null – сообщать нечего
export const budgetAlert = async (store: IChatStore, spentUnits: number, now: number): Promise<number | null> => {
    const share = spentUnits / toUnits(CHAT_GUARD.dailyBudgetRub);
    const reached = CHAT_GUARD.alertShares.filter((s) => share >= s);
    if (!reached.length) return null;
    const top = reached[reached.length - 1];
    return (await store.setIfAbsent(`chat:alert:${moscowDay(now)}:${top}`, '1', 2 * DAY_SEC)) ? top : null;
};

// Ключ готового ответа: зависит от промпта (поменялся промпт – старые ответы не годятся) и вопроса без
// регистра, лишних пробелов и знаков в конце: «Сколько стоит лендинг?» и «сколько стоит лендинг» – один вопрос
export const answerKey = (prompt: string, question: string) => {
    const normalized = question.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').replace(/[\s?!.…]+$/, '').trim();
    return `chat:ans:${createHash('sha256').update(prompt).update('\n').update(normalized).digest('hex')}`;
};
