// Вызов модели демо-чата через BotHub (CONVERSION_PLAN К3.2). Весь обмен с провайдером – только здесь:
// чтобы сменить модель, достаточно поменять CHAT_MODEL

import OpenAI from "openai";
import type { IChatMessage } from "./request";

// Модель ещё не выбрана: значение временное, до сравнения 2–3 дешёвых моделей с разрешения владельца
export const CHAT_MODEL = 'gpt-4.1-mini';

// Предел длины ответа в токенах: 2–4 предложения укладываются с запасом, а цена ответа ограничена
export const CHAT_MAX_TOKENS = 400;

let client: OpenAI | undefined;

// Ключ и адрес из env: локально .env.local, на проде env Docker-контейнера
const getClient = (): OpenAI => {
    const apiKey = process.env.BOTHUB_API_KEY;
    if (!apiKey) throw new Error('BOTHUB_API_KEY is not set');
    client ??= new OpenAI({ apiKey, baseURL: process.env.BOTHUB_BASE_URL || 'https://openai.bothub.chat/v1' });
    return client;
};

// Ответ модели по кускам текста. Ошибка запроса бросается до первого куска, поэтому роут успевает ответить кодом ошибки
export const streamChatReply = async (
    system: string,
    messages: IChatMessage[],
    { model = CHAT_MODEL, signal }: { model?: string; signal?: AbortSignal } = {}
): Promise<AsyncIterable<string>> => {
    const stream = await getClient().chat.completions.create(
        {
            model,
            messages: [{ role: 'system', content: system }, ...messages],
            max_tokens: CHAT_MAX_TOKENS,
            temperature: 0.3,
            stream: true,
        },
        { signal }
    );

    return (async function* () {
        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) yield text;
        }
    })();
};
