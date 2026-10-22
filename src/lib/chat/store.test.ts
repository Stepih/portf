import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryStore, createUpstashStore } from "./store";

describe("createMemoryStore", () => {
    it("incr считает и принимает отрицательное; ключ живёт ttl", async () => {
        let now = 0;
        const store = createMemoryStore(() => now);
        expect(await store.incr("k", 5, 10)).toBe(5);
        expect(await store.incr("k", -2, 10)).toBe(3);
        now = 10_000;
        expect(await store.get("k")).toBeNull();
        expect(await store.incr("k", 1, 10)).toBe(1);
    });

    it("setIfAbsent пишет только один раз", async () => {
        const store = createMemoryStore(() => 0);
        expect(await store.setIfAbsent("k", "a", 10)).toBe(true);
        expect(await store.setIfAbsent("k", "b", 10)).toBe(false);
        expect(await store.get("k")).toBe("a");
    });
});

// fetch подменён: в Upstash тесты не ходят
describe("createUpstashStore", () => {
    afterEach(() => vi.unstubAllGlobals());

    const mockFetch = (...results: unknown[]) => {
        const fetchMock = vi.fn();
        for (const r of results) fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(r)));
        vi.stubGlobal("fetch", fetchMock);
        return fetchMock;
    };

    it("incr – INCRBY и EXPIRE одним pipeline", async () => {
        const fetchMock = mockFetch([{ result: 7 }, { result: 1 }]);
        const store = createUpstashStore("https://redis.example", "token");

        expect(await store.incr("k", 2, 60)).toBe(7);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("https://redis.example/pipeline");
        expect(init.headers).toEqual({ Authorization: "Bearer token" });
        expect(JSON.parse(init.body)).toEqual([["INCRBY", "k", 2], ["EXPIRE", "k", 60]]);
    });

    it("get и setIfAbsent – SET … NX", async () => {
        const fetchMock = mockFetch({ result: null }, { result: "OK" }, { result: null });
        const store = createUpstashStore("https://redis.example", "token");

        expect(await store.get("k")).toBeNull();
        expect(await store.setIfAbsent("k", "v", 60)).toBe(true);
        expect(await store.setIfAbsent("k", "v", 60)).toBe(false);
        expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(["SET", "k", "v", "EX", 60, "NX"]);
    });

    it("ошибка Redis – исключение", async () => {
        mockFetch({ error: "WRONGPASS invalid password" });
        await expect(createUpstashStore("https://redis.example", "bad").get("k")).rejects.toThrow("WRONGPASS");
    });
});
