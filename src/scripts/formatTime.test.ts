import { describe, expect, it } from "vitest";
import { formatTime } from "./formatTime";

describe("formatTime", () => {
    it("секунды дополняются нулём до двух цифр", () => {
        expect(formatTime(0)).toBe("0:00");
        expect(formatTime(5)).toBe("0:05");
    });

    it("минуты не дополняются и не ограничены 59", () => {
        expect(formatTime(185)).toBe("3:05");
        expect(formatTime(3600)).toBe("60:00");
    });

    it("дробная часть отбрасывается, а не округляется", () => {
        expect(formatTime(59.9)).toBe("0:59");
    });
});
