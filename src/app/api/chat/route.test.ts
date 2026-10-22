import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Модель подменена: тесты не ходят в BotHub и не тратят токены (CONVERSION_PLAN К3.2)
const streamChatReply = vi.fn();
vi.mock("@/lib/chat/model", () => ({ streamChatReply }));

const { POST } = await import("./route");

// У каждого теста свой IP, чтобы не упираться в общий rate-limit роута
let ip = 0;
const request = (body: unknown, headers: Record<string, string> = {}) =>
    new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "x-forwarded-for": `10.0.0.${++ip}`, ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });

const question = { messages: [{ role: "user", content: "Сколько стоит лендинг?" }] };

async function* chunks(...parts: string[]) {
    yield* parts;
}

describe("POST /api/chat", () => {
    beforeEach(() => {
        vi.stubEnv("BOTHUB_API_KEY", "test-key");
        streamChatReply.mockReset();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it("отдаёт ответ модели текстом по кускам", async () => {
        streamChatReply.mockResolvedValue(chunks("Лендинг – ", "от 8 000 ₽."));

        const response = await POST(request(question));

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toContain("text/plain");
        expect(await response.text()).toBe("Лендинг – от 8 000 ₽.");

        const [system, messages] = streamChatReply.mock.calls[0];
        expect(system).toContain("от 8 000 ₽");
        expect(messages).toEqual(question.messages);
    });

    it("без ключа – 500, модель не вызывается", async () => {
        vi.stubEnv("BOTHUB_API_KEY", "");

        const response = await POST(request(question));

        expect(response.status).toBe(500);
        expect(streamChatReply).not.toHaveBeenCalled();
    });

    it("кривой запрос – 400, модель не вызывается", async () => {
        expect((await POST(request("{не json"))).status).toBe(400);
        expect((await POST(request({ messages: [{ role: "system", content: "x" }] }))).status).toBe(400);
        expect(streamChatReply).not.toHaveBeenCalled();
    });

    it("ошибка провайдера – 502 без подробностей", async () => {
        streamChatReply.mockRejectedValue(new Error("401 invalid key sk-secret"));

        const response = await POST(request(question));

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: "Chat is unavailable" });
    });

    it("больше 15 вопросов за 10 минут с одного IP – 429", async () => {
        streamChatReply.mockImplementation(async () => chunks("ок"));
        const headers = { "x-forwarded-for": "10.1.1.1" };

        for (let i = 0; i < 15; i++) expect((await POST(request(question, headers))).status).toBe(200);
        expect((await POST(request(question, headers))).status).toBe(429);
        expect(streamChatReply).toHaveBeenCalledTimes(15);
    });
});
