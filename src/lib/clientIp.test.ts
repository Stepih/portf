import { describe, expect, it } from "vitest";
import { getClientIp } from "./clientIp";

const req = (headers: Record<string, string>) => new Request("http://localhost/", { headers });

describe("getClientIp", () => {
    it("x-real-ip важнее x-forwarded-for", () => {
        expect(getClientIp(req({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "6.6.6.6, 1.1.1.1" }))).toBe("1.1.1.1");
    });

    // Первый адрес присылает клиент: подставив случайный, он обошёл бы лимиты
    it("без x-real-ip – последний адрес x-forwarded-for, а не первый", () => {
        expect(getClientIp(req({ "x-forwarded-for": "6.6.6.6, 2.2.2.2" }))).toBe("2.2.2.2");
        expect(getClientIp(req({ "x-forwarded-for": "3.3.3.3" }))).toBe("3.3.3.3");
    });

    it("без заголовков – unknown", () => {
        expect(getClientIp(req({}))).toBe("unknown");
    });
});
