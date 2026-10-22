// Вызов модели демо-чата через BotHub (CONVERSION_PLAN К3.2). Весь обмен с провайдером – только здесь:
// чтобы сменить модель, достаточно поменять CHAT_MODEL

import OpenAI from "openai";
import type { ChatCompletionContentPartText } from "openai/resources/chat/completions";
import type { IChatMessage } from "./request";

// Выбрана по прогону 1: не выдумывает факты (CONVERSION_PLAN К3.2)
export const CHAT_MODEL = 'claude-haiku-5.5';

// Цена CHAT_MODEL у BotHub, ₽ за 1 млн токенов (каталог на 22.10.2026). Сменили модель – поменяйте и цену:
// по ней считается бюджет чата на сутки
export const CHAT_PRICE_RUB = { input: 9.88, output: 49.40 };

// Цена ответа в рублях по токенам
export const replyCostRub = (inputTokens: number, outputTokens: number) =>
    (inputTokens * CHAT_PRICE_RUB.input + outputTokens * CHAT_PRICE_RUB.output) / 1e6;

// Предел длины ответа в токенах. Токенизатор Claude дробит русский текст: 4 предложения – 200–400 токенов,
// при 400 один ответ из 20 обрезался (прогон 2). Длину ответа держит промпт, предел – только страховка цены
export const CHAT_MAX_TOKENS = 600;

// Кэш системного промпта у провайдера. Выключен: в прогоне 2 BotHub на каждом запросе записывал кэш
// (+25% к цене ввода) и ни разу его не прочитал – запросы уходят в разные аккаунты провайдера
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

// Итог ответа: токены из usage (null – провайдер их не прислал) и почему модель остановилась
export interface IChatReplyResult {
    inputTokens: number | null;
    outputTokens: number | null;
    finishReason: string | null;
}

// Ответ модели по кускам текста. Ошибка запроса бросается до первого куска, поэтому роут успевает ответить кодом ошибки.
// onDone вызывается после последнего куска: по usage роут списывает фактическую цену из бюджета
export const streamChatReply = async (
    system: string,
    messages: IChatMessage[],
    { model = CHAT_MODEL, signal, onDone }: {
        model?: string;
        signal?: AbortSignal;
        onDone?: (result: IChatReplyResult) => Promise<void> | void;
    } = {}
): Promise<AsyncIterable<string>> => {
    const stream = await getClient().chat.completions.create(
        // include_usage: последним куском приходит расход токенов
        { ...chatParams(system, messages, model, CHAT_PROMPT_CACHE), stream: true, stream_options: { include_usage: true } },
        { signal }
    );

    return (async function* () {
        const result: IChatReplyResult = { inputTokens: null, outputTokens: null, finishReason: null };
        for await (const chunk of stream) {
            const choice = chunk.choices[0];
            if (choice?.delta?.content) yield choice.delta.content;
            if (choice?.finish_reason) result.finishReason = choice.finish_reason;
            if (chunk.usage) {
                result.inputTokens = chunk.usage.prompt_tokens;
                result.outputTokens = chunk.usage.completion_tokens;
            }
        }
        await onDone?.(result);
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
