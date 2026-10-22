import { getClientIp } from '@/lib/clientIp';
import { createRateLimiter } from '@/lib/rateLimit';
import { sendTelegram, telegramConfigured } from '@/lib/telegram';
import { HONEYPOT_FIELD, validateFeedback } from '@/lib/validation/feedback';
import { leadMessageText } from '@/scripts/leadSource';

// Rate-limit в памяти, 5 заявок за 10 минут с одного IP. На Vercel у каждого экземпляра функции свой счётчик,
// защита слабее, чем в одном контейнере, но заявка ничего не стоит – общий Redis здесь не нужен
const isRateLimited = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

const json = (body: object, status: number) => Response.json(body, { status });

export async function POST(req: Request) {
    if (!telegramConfigured()) {
        console.error('sendMessage: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set');
        return json({ error: 'Failed to send message' }, 500);
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

    // Заполненная ловушка — бот. Отвечаем успехом, чтобы он не подбирал обход
    if (typeof body === 'object' && body !== null && (body as Record<string, unknown>)[HONEYPOT_FIELD]) {
        return json({ message: 'Message sent successfully' }, 200);
    }

    const result = validateFeedback(body);
    if (!result.ok) {
        return json({ error: result.error }, 400);
    }

    const text = leadMessageText(result.data, body as Record<string, unknown>);

    try {
        await sendTelegram(text);
        return json({ message: 'Message sent successfully' }, 200);
    } catch (error) {
        // Подробности только в лог, клиенту — общая ошибка
        console.error('sendMessage: Telegram request failed', error);
        return json({ error: 'Failed to send message' }, 500);
    }
}
