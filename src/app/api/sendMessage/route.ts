import fetch from 'node-fetch';

export async function POST(req: Request) {
  try {
    const { name, contact, message } = await req.json();

    // Проверка наличия необходимых данных
    if (!name || !contact || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Телеграм токен и чат ID
    const telegramBotToken = '7960195979:AAEYvMAlQ-zPa_ik_2i4-rHtSs6-_ktOq7U';
    const chatId = '556440318';

    // Сообщение для отправки
    const text = `Name: ${name}\nContact: ${contact}\nMessage: ${message}`;

    // Отправка сообщения в Telegram
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });

    const data:any = await response.json();

    if (!data.ok) {
      throw new Error(data.description);
    }

    // Успешный ответ
    return new Response(JSON.stringify({ message: 'Message sent successfully' }), { status: 200 });
  } catch (error: any) {
    // Обработка ошибки
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
