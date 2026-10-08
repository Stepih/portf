// Rate-limit в памяти по скользящему окну. Время передаётся явно, чтобы логику можно было проверить без таймеров
export const createRateLimiter = ({ limit, windowMs }: { limit: number; windowMs: number }) => {
    const requestsByKey = new Map<string, number[]>();

    // Учитывает запрос и отвечает, превышен ли лимит
    return (key: string, now: number): boolean => {
        // Чистим устаревшие записи, чтобы Map не рос бесконечно
        for (const [k, times] of requestsByKey) {
            if (times[times.length - 1] <= now - windowMs) requestsByKey.delete(k);
        }

        const recent = (requestsByKey.get(key) ?? []).filter(time => time > now - windowMs);
        recent.push(now);
        requestsByKey.set(key, recent);

        return recent.length > limit;
    };
};
