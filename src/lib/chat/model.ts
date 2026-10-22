// Вызов модели демо-чата через BotHub (CONVERSION_PLAN К3.2). Весь обмен с провайдером – только здесь:
// чтобы сменить модель, достаточно поменять CHAT_MODEL

import OpenAI from "openai";
import type { ChatCompletionContentPartText } from "openai/resources/chat/completions";
import type { IChatMessage } from "./request";

// Выбрана по прогону 1: не выдумывает факты (CONVERSION_PLAN К3.2)
export const CHAT_MODEL = 'claude-haiku-5.5';

// Предел длины ответа в токенах: 2–4 предложения укладываются с запасом, а цена ответа ограничена
export const CHAT_MAX_TOKENS = 400;

// Кэш системного промпта у провайдера. Включается, только если прогон покажет, что BotHub его принимает
export const CHAT_PROMPT_CACHE = false;

let client: OpenAI | undefined;

// Ключ и адрес из env: локально .env.local, на проде env Docker-контейнера
const getClient = (): OpenAI => {
    const apiKey = process.env.BOTHUB_API_KEY;
    if (!apiKey) throw new Error('BOTHUB_API_KEY is not set');
    client ??= new OpenAI({ apiKey, baseURL: process.env.BOTHUB_BASE_URL || 'https://openai.bothub.chat/v1' });
    return client;
};

// Системный промпт. С cache – маркер cache_control в формате Anthropic внутри OpenAI-сообщения:
// промпт одинаковый во всех запросах, и Claude читает его из кэша дешевле, чем заново
const systemMessage = (system: string, cache: boolean) => {
    if (!cache) return { role: 'system' as const, content: system };
    const part: ChatCompletionContentPartText & { cache_control: { type: 'ephemeral' } } =
        { type: 'text', text: system, cache_control: { type: 'ephemeral' } };
    return { role: 'system' as const, content: [part] };
};

// Параметры запроса – общие для сайта и сравнения моделей (compare/), чтобы сравнивать ровно то, что увидит клиент.
// temperature не задаётся: Claude Haiku 5.5 принимает только значение по умолчанию
const chatParams = (system: string, messages: IChatMessage[], model: string, cache: boolean) => ({
    model,
    messages: [systemMessage(system, cache), ...messages],
    max_tokens: CHAT_MAX_TOKENS,
});

// Ответ модели по кускам текста. Ошибка запроса бросается до первого куска, поэтому роут успевает ответить кодом ошибки
export const streamChatReply = async (
    system: string,
    messages: IChatMessage[],
    { model = CHAT_MODEL, signal }: { model?: string; signal?: AbortSignal } = {}
): Promise<AsyncIterable<string>> => {
    const stream = await getClient().chat.completions.create(
        { ...chatParams(system, messages, model, CHAT_PROMPT_CACHE), stream: true },
        { signal }
    );

    return (async function* () {
        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) yield text;
        }
    })();
};

// Ответ целиком и расход токенов – только для сравнения моделей (compare/), на сайте не используется.
// usage – как прислал BotHub: в нём видно, сработал ли кэш и были ли скрытые рассуждения
export const chatReplyWithUsage = async (system: string, messages: IChatMessage[], model: string, cache = false) => {
    const response = await getClient().chat.completions.create({ ...chatParams(system, messages, model, cache), stream: false });
    return {
        text: response.choices[0]?.message?.content ?? '',
        finishReason: response.choices[0]?.finish_reason ?? '',
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        cachedTokens: response.usage?.prompt_tokens_details?.cached_tokens ?? 0,
        reasoningTokens: response.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
        usage: response.usage as unknown as Record<string, unknown> | undefined,
    };
};
