// Счётчики защиты демо-чата (CONVERSION_PLAN К3.2): лимиты по IP, бюджет на сутки, готовые ответы.
// На Vercel у каждого экземпляра функции своя память, и она обнуляется при холодном старте, поэтому там нужен
// общий Redis (Upstash из Vercel Marketplace). Локально и в тестах хватает памяти процесса

export interface IChatStore {
    // Прибавляет by (можно отрицательное) и продлевает жизнь ключа; возвращает новое значение
    incr(key: string, by: number, ttlSec: number): Promise<number>;
    get(key: string): Promise<string | null>;
    // Записывает, только если ключа нет; true – записал
    setIfAbsent(key: string, value: string, ttlSec: number): Promise<boolean>;
}

export const createMemoryStore = (now: () => number = Date.now): IChatStore => {
    const data = new Map<string, { value: string; expires: number }>();

    const read = (key: string) => {
        const item = data.get(key);
        if (item && item.expires <= now()) {
            data.delete(key);
            return undefined;
        }
        return item;
    };

    // Чистим протухшие ключи, чтобы Map не рос бесконечно
    const sweep = () => {
        if (data.size < 10_000) return;
        for (const key of [...data.keys()]) read(key);
    };

    return {
        async incr(key, by, ttlSec) {
            sweep();
            const value = Number(read(key)?.value ?? 0) + by;
            data.set(key, { value: String(value), expires: now() + ttlSec * 1000 });
            return value;
        },
        async get(key) {
            return read(key)?.value ?? null;
        },
        async setIfAbsent(key, value, ttlSec) {
            if (read(key)) return false;
            sweep();
            data.set(key, { value, expires: now() + ttlSec * 1000 });
            return true;
        },
    };
};

// Upstash Redis по REST: команда – JSON-массив в теле POST, без SDK
export const createUpstashStore = (url: string, token: string): IChatStore => {
    const call = async (path: string, body: unknown) => {
        const response = await fetch(`${url}${path}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
            cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Upstash ${response.status}`);
        return response.json() as Promise<unknown>;
    };

    const result = (item: unknown) => {
        const { result: value, error } = (item ?? {}) as { result?: unknown; error?: string };
        if (error) throw new Error(`Upstash: ${error}`);
        return value;
    };

    return {
        async incr(key, by, ttlSec) {
            const items = await call('/pipeline', [['INCRBY', key, by], ['EXPIRE', key, ttlSec]]) as unknown[];
            return Number(result(items[0]));
        },
        async get(key) {
            const value = result(await call('', ['GET', key]));
            return value === null || value === undefined ? null : String(value);
        },
        async setIfAbsent(key, value, ttlSec) {
            return result(await call('', ['SET', key, value, 'EX', ttlSec, 'NX'])) === 'OK';
        },
    };
};

// Имена переменных зависят от того, как подключён Redis: Upstash напрямую или через Vercel Marketplace (KV_*)
const redisEnv = () => {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    return url && token ? { url, token } : undefined;
};

let store: IChatStore | undefined;

// null – на Vercel нет Redis: лимиты в памяти там не общие, и бюджет не гарантирован, поэтому чат не запускаем
export const getChatStore = (): IChatStore | null => {
    if (store) return store;
    const redis = redisEnv();
    if (redis) return (store = createUpstashStore(redis.url, redis.token));
    if (process.env.VERCEL) return null;
    return (store = createMemoryStore());
};
