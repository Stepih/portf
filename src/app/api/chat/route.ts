import { buildSystemPrompt } from '@/lib/chat/prompt';
import { streamChatReply } from '@/lib/chat/model';
import { validateChatRequest } from '@/lib/chat/request';
import { createRateLimiter } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/clientIp';

// Демо-чат (CONVERSION_PLAN К3.2). Rate-limit в памяти, как у формы: прод – один контейнер.
// Главная защита расходов – лимит в кабинете BotHub, этот только отсекает перебор с одного IP. 15 вопросов за 10 минут
const isRateLimited = createRateLimiter({ limit: 15, windowMs: 10 * 60 * 1000 });

// Промпт собирается из статичных данных один раз на процесс
const systemPrompt = buildSystemPrompt();

const json = (body: object, status: number) => Response.json(body, { status });

export async function POST(req: Request) {
    if (!process.env.BOTHUB_API_KEY) {
        console.error('chat: BOTHUB_API_KEY is not set');
        return json({ error: 'Chat is unavailable' }, 500);
    }

    if (isRateLimited(getClientIp(req), Date.now())) {
        return json({ error: 'Too many requests' }, 429);
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Invalid body' }, 400);
    }

    const result = validateChatRequest(body);
    if (!result.ok) {
        return json({ error: result.error }, 400);
    }

    let reply: AsyncIterable<string>;
    try {
        // Клиент закрыл окно – запрос к модели обрывается, недописанный ответ не оплачивается
        reply = await streamChatReply(systemPrompt, result.messages, { signal: req.signal });
    } catch (error) {
        // Подробности только в лог, клиенту – общая ошибка
        console.error('chat: model request failed', error);
        return json({ error: 'Chat is unavailable' }, 502);
    }

    // Ответ – обычный текст по кускам, окно чата дописывает их по мере прихода
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                for await (const text of reply) controller.enqueue(encoder.encode(text));
                controller.close();
            } catch (error) {
                console.error('chat: stream failed', error);
                controller.error(error);
            }
        }
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}
