import { getClientIp } from '@/lib/clientIp';
import { isGarbage, isSameOrigin } from '@/lib/chat/filters';
import { answerKey, budgetAlert, CHAT_GUARD, ChatLimitReason, fromUnits, hitIpLimit, reserveBudget, toUnits } from '@/lib/chat/guard';
import { CHAT_MAX_TOKENS, replyCostRub, streamChatReply } from '@/lib/chat/model';
import { buildSystemPrompt } from '@/lib/chat/prompt';
import { validateChatRequest } from '@/lib/chat/request';
import { getChatStore, IChatStore } from '@/lib/chat/store';
import { sendTelegram, telegramConfigured } from '@/lib/telegram';
import { HONEYPOT_FIELD } from '@/lib/validation/feedback';

// Демо-чат (CONVERSION_PLAN К3.2). Защита от накрутки – до вызова модели, по порядку: свой сайт, ловушка,
// формат, лимит диалога, мусор, лимиты IP, готовый ответ, бюджет на сутки. Худший случай – бюджет за сутки

// Промпт собирается из статичных данных один раз на процесс
const systemPrompt = buildSystemPrompt();

// Токенов во вводе – с запасом: токенизатор Claude даёт около 3,8 символа русского текста на токен
const estimateInputTokens = (chars: number) => Math.ceil(chars / 2.5);

const json = (body: object, status: number) => Response.json(body, { status });
// Лимит: окно чата по reason показывает свой текст и кнопки формы и Telegram
const limited = (reason: ChatLimitReason) => json({ error: 'limit', reason }, 429);
const unavailable = (status: number) => json({ error: 'Chat is unavailable' }, status);

const textResponse = (body: BodyInit) =>
    new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

// Уведомление владельцу о расходе бюджета. Ошибка Telegram не мешает чату – только в лог
const notifyBudget = async (store: IChatStore, spentUnits: number, now: number) => {
    const share = await budgetAlert(store, spentUnits, now);
    if (share === null || !telegramConfigured()) return;
    const spent = fromUnits(spentUnits).toFixed(2).replace('.', ',');
    const text = share >= 1
        ? `Демо-чат: бюджет на сегодня (${CHAT_GUARD.dailyBudgetRub} ₽) исчерпан, потрачено ${spent} ₽. До полуночи по Москве чат не отвечает и предлагает форму и Telegram.`
        : `Демо-чат: за сегодня потрачено ${spent} ₽ из ${CHAT_GUARD.dailyBudgetRub} ₽. Если столько клиентов не было – возможно, накрутка.`;
    try {
        await sendTelegram(text);
    } catch (error) {
        console.error('chat: budget alert failed', error);
    }
};

export async function POST(req: Request) {
    if (!process.env.BOTHUB_API_KEY) {
        console.error('chat: BOTHUB_API_KEY is not set');
        return unavailable(500);
    }

    const store = getChatStore();
    if (!store) {
        console.error('chat: on Vercel the chat needs Upstash Redis (UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN)');
        return unavailable(500);
    }

    if (!isSameOrigin(req)) {
        return json({ error: 'Forbidden' }, 403);
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Invalid body' }, 400);
    }

    // Заполненная ловушка – бот
    if (typeof body === 'object' && body !== null && (body as Record<string, unknown>)[HONEYPOT_FIELD]) {
        return json({ error: 'Invalid body' }, 400);
    }

    const result = validateChatRequest(body);
    if (!result.ok) {
        return json({ error: result.error }, 400);
    }

    if (result.questionCount > CHAT_GUARD.perDialog) {
        return limited('dialog');
    }

    const { messages } = result;
    const question = messages[messages.length - 1].content;
    if (isGarbage(question)) {
        return json({ error: 'Invalid message' }, 400);
    }

    const now = Date.now();
    // Готовый ответ – только на первый вопрос диалога: дальше ответ зависит от истории
    const cacheKey = messages.length === 1 ? answerKey(systemPrompt, question) : null;
    // Резерв на худший случай: весь ввод и ответ на max_tokens
    const inputChars = systemPrompt.length + messages.reduce((sum, m) => sum + m.content.length, 0);
    const reservedUnits = toUnits(replyCostRub(estimateInputTokens(inputChars), CHAT_MAX_TOKENS));

    let reservation;
    try {
        if (await hitIpLimit(store, getClientIp(req), now)) return limited('ip');

        const cached = cacheKey && await store.get(cacheKey);
        if (cached) return textResponse(cached);

        reservation = await reserveBudget(store, reservedUnits, now);
        if (!reservation.ok) {
            await notifyBudget(store, reservation.spentUnits + reservedUnits, now);
            return limited('budget');
        }
    } catch (error) {
        // Без счётчиков нет гарантии бюджета – чат не отвечает
        console.error('chat: store failed', error);
        return unavailable(503);
    }

    const { settle } = reservation;
    let answer = '';
    let reply: AsyncIterable<string>;
    try {
        // Клиент закрыл окно – запрос к модели обрывается, недописанный ответ не оплачивается
        reply = await streamChatReply(systemPrompt, messages, {
            signal: req.signal,
            // Фактическая цена вместо резерва; нет usage – резерв остаётся списанным
            onDone: async ({ inputTokens, outputTokens, finishReason }) => {
                const actual = inputTokens === null || outputTokens === null
                    ? reservedUnits
                    : toUnits(replyCostRub(inputTokens, outputTokens));
                await notifyBudget(store, await settle(actual), now);
                if (cacheKey && finishReason === 'stop' && answer.trim()) {
                    await store.setIfAbsent(cacheKey, answer, CHAT_GUARD.answerTtlSec);
                }
            }
        });
    } catch (error) {
        // Модель не ответила – резерв возвращается в бюджет. Подробности только в лог
        console.error('chat: model request failed', error);
        await settle(0).catch((e) => console.error('chat: budget refund failed', e));
        return unavailable(502);
    }

    // Ответ – обычный текст по кускам, окно чата дописывает их по мере прихода
    const encoder = new TextEncoder();
    return textResponse(new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                for await (const text of reply) {
                    answer += text;
                    controller.enqueue(encoder.encode(text));
                }
                controller.close();
            } catch (error) {
                console.error('chat: stream failed', error);
                controller.error(error);
            }
        }
    }));
}
