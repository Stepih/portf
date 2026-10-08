import { createRateLimiter } from '@/lib/rateLimit';
import { HONEYPOT_FIELD, validateFeedback } from '@/lib/validation/feedback';

// Rate-limit в памяти: прод работает в одном контейнере, этого достаточно. 5 заявок за 10 минут с одного IP
const isRateLimited = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

const getClientIp = (req: Request) =>
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

const json = (body: object, status: number) => Response.json(body, { status });

export async function POST(req: Request) {
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

    const { name, contact, message } = result.data;

    // Телеграм токен и чат ID
    const telegramBotToken = '7960195979:AAEYvMAlQ-zPa_ik_2i4-rHtSs6-_ktOq7U';
    const chatId = '556440318';

    // Сообщение для отправки
    const text = `Name: ${name}\nContact: ${contact}\nMessage: ${message}`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text })
        });

        const data = await response.json() as { ok: boolean; description?: string };

        if (!data.ok) {
            throw new Error(data.description);
        }

        return json({ message: 'Message sent successfully' }, 200);
    } catch (error) {
        // Подробности только в лог, клиенту — общая ошибка
        console.error('sendMessage: Telegram request failed', error);
        return json({ error: 'Failed to send message' }, 500);
    }
}
