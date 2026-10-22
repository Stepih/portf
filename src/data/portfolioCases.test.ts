import { describe, expect, it } from "vitest";
import { portfolioCases } from "./portfolioCases";
import { portfolioWorks } from "./portfolio";

describe("portfolioCases", () => {
    // Длиннее поисковик обрезает: title около 60 символов, description около 160
    it("title и description кейса влезают в выдачу", () => {
        for (const data of Object.values(portfolioCases)) {
            expect(data.metaTitle.length).toBeLessThanOrEqual(60);
            expect(data.metaDescription.length).toBeLessThanOrEqual(160);
        }
    });

    it("title кейса начинается с названия работы", () => {
        for (const work of portfolioWorks) {
            const data = portfolioCases[work.id];
            if (data) expect(data.metaTitle.startsWith(`${work.name}: `)).toBe(true);
        }
    });
});
