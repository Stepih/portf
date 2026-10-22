import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHAT_GUARD, moscowDay, toUnits } from "@/lib/chat/guard";
import { createMemoryStore, type IChatStore } from "@/lib/chat/store";
import type { IChatReplyResult } from "@/lib/chat/model";

// Модель, хранилище и Telegram подменены: тесты не ходят в BotHub, Redis и Telegram (CONVERSION_PLAN К3.2)
const streamChatReply = vi.fn();
vi.mock("@/lib/chat/model", async (original) => ({
    ...(await original<typeof import("@/lib/chat/model")>()),
    streamChatReply,
}));

let store: IChatStore | null;
vi.mock("@/lib/chat/store", async (original) => ({
    ...(await original<typeof import("@/lib/chat/store")>()),
    getChatStore: () => store,
}));

const sendTelegram = vi.fn();
vi.mock("@/lib/telegram", () => ({ sendTelegram, telegramConfigured: () => true }));

const { POST } = await import("./route");

const HOST = "showmyworks.ru";
let ip = 0;
const request = (body: unknown, headers: Record<string, string> = {}) =>
    new Request(`https://${HOST}/api/chat`, {
        method: "POST",
        headers: { host: HOST, origin: `https://${HOST}`, "x-real-ip": `10.0.0.${++ip}`, ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });

const ask = (content: string) => ({ messages: [{ role: "user", content }] });
const question = ask("Сколько стоит лендинг?");

// Ответ модели по кускам; в конце – usage, как его присылает BotHub
const reply = (parts: string[], usage: Partial<IChatReplyResult> = {}) =>
    async (_system: string, _messages: unknown, opts: { onDone?: (r: IChatReplyResult) => Promise<void> }) =>
        (async function* () {
            yield* parts;
            await opts.onDone?.({ inputTokens: 3800, outputTokens: 200, finishReason: "stop", ...usage });
        })();

const budgetKey = () => `chat:budget:${moscowDay(Date.now())}`;
const spentUnits = async () => Number(await store!.get(budgetKey()) ?? 0);

describe("POST /api/chat", () => {
    beforeEach(() => {
        vi.stubEnv("BOTHUB_API_KEY", "test-key");
        store = createMemoryStore();
        streamChatReply.mockReset();
        streamChatReply.mockImplementation(reply(["Лендинг – ", "от 8 000 ₽."]));
        sendTelegram.mockReset();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it("отдаёт ответ модели текстом по кускам и списывает фактическую цену", async () => {
        const response = await POST(request(question));

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toContain("text/plain");
        expect(await response.text()).toBe("Лендинг – от 8 000 ₽.");

        const [system, messages] = streamChatReply.mock.calls[0];
        expect(system).toContain("от 8 000 ₽");
        expect(messages).toEqual(question.messages);
        // 3800 × 9,88 + 200 × 49,40 за 1 млн токенов = 0,047424 ₽: резерв заменён фактической ценой
        expect(await spentUnits()).toBe(toUnits(0.047424));
    });

    it("без ключа или без Redis на Vercel – 500, модель не вызывается", async () => {
        vi.stubEnv("BOTHUB_API_KEY", "");
        expect((await POST(request(question))).status).toBe(500);

        vi.stubEnv("BOTHUB_API_KEY", "test-key");
        store = null;
        expect((await POST(request(question))).status).toBe(500);
        expect(streamChatReply).not.toHaveBeenCalled();
    });

    it("запрос не со своего сайта – 403", async () => {
        expect((await POST(request(question, { origin: "https://evil.example" }))).status).toBe(403);
        const noOrigin = new Request(`https://${HOST}/api/chat`, { method: "POST", headers: { host: HOST }, body: JSON.stringify(question) });
        expect((await POST(noOrigin)).status).toBe(403);
        expect(streamChatReply).not.toHaveBeenCalled();
    });

    it("кривой запрос, ловушка и мусор – 400, модель не вызывается", async () => {
        expect((await POST(request("{не json"))).status).toBe(400);
        expect((await POST(request({ messages: [{ role: "system", content: "x" }] }))).status).toBe(400);
        expect((await POST(request({ ...question, website: "spam.ru" }))).status).toBe(400);
        expect((await POST(request(ask("!!!!!!!!")))).status).toBe(400);
        expect((await POST(request(ask("аааааааааааааааааааа")))).status).toBe(400);
        expect(streamChatReply).not.toHaveBeenCalled();
    });

    it("больше 10 вопросов в диалоге – 429 dialog", async () => {
        const history = Array.from({ length: CHAT_GUARD.perDialog }, (_, i) => [
            { role: "user", content: `вопрос ${i}` },
            { role: "assistant", content: `ответ ${i}` },
        ]).flat();

        const response = await POST(request({ messages: [...history, { role: "user", content: "ещё вопрос" }] }));

        expect(response.status).toBe(429);
        expect(await response.json()).toEqual({ error: "limit", reason: "dialog" });
        expect(streamChatReply).not.toHaveBeenCalled();
    });

    it("больше 15 вопросов за 10 минут с одного IP – 429 ip", async () => {
        const headers = { "x-real-ip": "10.1.1.1" };
        for (let i = 0; i < CHAT_GUARD.ipPerWindow; i++) {
            expect((await POST(request(ask(`вопрос ${i}`), headers))).status).toBe(200);
        }
        const response = await POST(request(ask("ещё"), headers));

        expect(response.status).toBe(429);
        expect(await response.json()).toEqual({ error: "limit", reason: "ip" });
        expect(streamChatReply).toHaveBeenCalledTimes(CHAT_GUARD.ipPerWindow);
    });

    it("одинаковый первый вопрос – готовый ответ без модели и без расхода", async () => {
        await (await POST(request(question))).text();
        const spent = await spentUnits();

        const response = await POST(request(ask("  сколько стоит лендинг ")));

        expect(await response.text()).toBe("Лендинг – от 8 000 ₽.");
        expect(streamChatReply).toHaveBeenCalledTimes(1);
        expect(await spentUnits()).toBe(spent);
    });

    it("обрезанный ответ в готовые не попадает", async () => {
        streamChatReply.mockImplementation(reply(["Лендинг – от"], { finishReason: "length" }));
        await (await POST(request(question))).text();
        await (await POST(request(question))).text();

        expect(streamChatReply).toHaveBeenCalledTimes(2);
    });

    it("бюджет на сутки исчерпан – 429 budget, модель не вызывается, владелец получает уведомление один раз", async () => {
        await store!.incr(budgetKey(), toUnits(CHAT_GUARD.dailyBudgetRub) - 1, 60);

        const first = await POST(request(ask("первый")));
        const second = await POST(request(ask("второй")));

        expect(first.status).toBe(429);
        expect(await first.json()).toEqual({ error: "limit", reason: "budget" });
        expect(second.status).toBe(429);
        expect(streamChatReply).not.toHaveBeenCalled();
        expect(sendTelegram).toHaveBeenCalledTimes(1);
        expect(sendTelegram.mock.calls[0][0]).toContain("исчерпан");
    });

    it("на 80% бюджета владелец получает уведомление", async () => {
        await store!.incr(budgetKey(), toUnits(CHAT_GUARD.dailyBudgetRub * 0.8), 60);

        await (await POST(request(question))).text();

        expect(sendTelegram).toHaveBeenCalledTimes(1);
        expect(sendTelegram.mock.calls[0][0]).toContain("возможно, накрутка");
    });

    it("провайдер не прислал usage – списывается весь резерв", async () => {
        streamChatReply.mockImplementation(reply(["ок"], { inputTokens: null, outputTokens: null }));
        await (await POST(request(question))).text();

        expect(await spentUnits()).toBeGreaterThan(toUnits(0.047424));
    });

    it("ошибка провайдера – 502 без подробностей, резерв возвращается", async () => {
        streamChatReply.mockRejectedValue(new Error("401 invalid key sk-secret"));

        const response = await POST(request(question));

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: "Chat is unavailable" });
        expect(await spentUnits()).toBe(0);
    });

    it("хранилище недоступно – 503, модель не вызывается", async () => {
        store = { ...createMemoryStore(), incr: () => Promise.reject(new Error("Upstash 500")) };

        expect((await POST(request(question))).status).toBe(503);
        expect(streamChatReply).not.toHaveBeenCalled();
    });
});
