import type { ChatLimitReason } from "@/lib/chat/guard";

// Тексты окна демо-чата (CONVERSION_PLAN К3.2). Открывается кнопкой в карточке «ИИ-агенты и автоматизация»
// и шаром в правом нижнем углу (на всех страницах, кроме /music и /popup)

export const chatButtonTitle = 'Спросите ИИ-ассистента'
export const chatButtonText = 'Это демо: так агент отвечает клиентам на вашем сайте'
// Подпись шара: видна при наведении, скринридер читает всегда
export const chatFabLabel = 'Чат с ИИ-ассистентом'

export const chatTitle = 'ИИ-ассистент Степана'
export const chatSubtitle = 'Демо – отвечает по текстам этого сайта'
export const chatGreeting = 'Здравствуйте! Спросите, какой сайт или ИИ-агент вам подойдёт, сколько он стоит и сколько займёт работа.'
export const chatPlaceholder = 'Ваш вопрос'
export const chatSend = 'Отправить'
export const chatClose = 'Закрыть чат'

// После лимита – кнопки формы и Telegram под текстом
export const chatLimitText: Record<ChatLimitReason, string> = {
    dialog: 'В демо – до 10 вопросов в одном диалоге. Остальное Степан расскажет сам на бесплатном созвоне.',
    ip: 'Слишком много вопросов подряд. Задайте их Степану напрямую – он отвечает в течение часа.',
    budget: 'Демо-чат на сегодня закончил работу. Задайте вопрос Степану напрямую – он отвечает в течение часа.',
}

export const chatErrorText = {
    // 400: мусор или слишком длинный вопрос – можно спросить иначе
    invalid: 'Не получилось разобрать вопрос. Сформулируйте его словами, пожалуйста.',
    unavailable: 'Чат сейчас не отвечает. Напишите Степану в Telegram или оставьте контакт.',
    network: 'Нет соединения. Проверьте интернет и спросите ещё раз.',
    broken: 'Ответ оборвался. Спросите ещё раз или напишите Степану напрямую.',
}

// Заявка прямо в чате (решение владельца 22.10.2026): имя и телефон уходят в Telegram вместе с вопросами из чата
export const chatLeadTitle = 'Оставьте контакт – Степан свяжется в течение часа'
export const chatLeadSubmit = 'Отправить'
export const chatLeadSending = 'Отправляется...'
export const chatLeadBack = 'Вернуться к чату'
export const chatLeadSuccess = 'Контакт отправлен. Степан свяжется с вами в течение часа.'
export const chatLeadRequired = 'Заполните, пожалуйста, имя и телефон'
export const chatLeadError = 'Не удалось отправить, попробуйте ещё раз или напишите в Telegram'
export const chatLeadQuestions = 'Вопросы в чате:'
