// Сообщение владельцу в Telegram через бот заявок: заявки с формы и уведомления демо-чата о бюджете.
// Токен и чат берутся из env: локально .env.local, на проде – настройки хостинга

export const telegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

// Бросает ошибку, если env не задан или Telegram не принял сообщение
export const sendTelegram = async (text: string): Promise<void> => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set');

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
    });
    const data = await response.json() as { ok: boolean; description?: string };
    if (!data.ok) throw new Error(data.description);
};
