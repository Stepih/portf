import { describe, expect, it } from "vitest";
import { serviceCases, withCase, withService } from "./services";
import { services } from "@/data/offer";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";

describe("withService", () => {
    it("добавляет услугу в параметр ссылки", () => {
        expect(withService('/popup', 'shop')).toBe('/popup?service=shop');
    });
});

describe("withCase", () => {
    it("добавляет кейс в параметр ссылки", () => {
        expect(withCase('/popup', 'icc')).toBe('/popup?case=icc');
    });
});

describe("serviceCases", () => {
    const works = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];

    it("берёт работы в порядке ids, без страницы кейса и неизвестные – пропускает", () => {
        expect(serviceCases(['c', 'b', 'x', 'a'], works, { a: {}, c: {} })).toEqual([
            { id: 'c', name: 'C' },
            { id: 'a', name: 'A' }
        ]);
    });

    it("у каждого id в offer.ts есть работа со страницей кейса", () => {
        for (const service of services) {
            expect(serviceCases(service.caseIds, portfolioWorks, portfolioCases)).toHaveLength(service.caseIds.length);
        }
    });
});
