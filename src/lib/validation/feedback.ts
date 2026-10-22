// Правила формы заявки: общие для клиента (maxLength полей) и для /api/sendMessage

export const FEEDBACK_LIMITS = {
    name: 50,
    contact: 30,
    message: 2000,
} as const;

// Имя скрытого поля-ловушки: человек его не видит, бот заполняет
export const HONEYPOT_FIELD = 'website';

export interface IFeedback {
    name: string;
    contact: string;
    message: string;
}

type FeedbackResult =
    | { ok: true; data: IFeedback }
    | { ok: false; error: string };

const readString = (value: unknown) => (typeof value === 'string' ? value.trim() : undefined);

export const validateFeedback = (body: unknown): FeedbackResult => {
    if (typeof body !== 'object' || body === null) return { ok: false, error: 'Invalid body' };

    const raw = body as Record<string, unknown>;
    const name = readString(raw.name);
    const contact = readString(raw.contact);
    // Комментарий необязателен
    const message = raw.message === undefined ? '' : readString(raw.message);

    if (!name || !contact || message === undefined) return { ok: false, error: 'Missing required fields' };

    if (
        name.length > FEEDBACK_LIMITS.name ||
        contact.length > FEEDBACK_LIMITS.contact ||
        message.length > FEEDBACK_LIMITS.message
    ) {
        return { ok: false, error: 'Field too long' };
    }

    return { ok: true, data: { name, contact, message } };
};

// Что можно набрать в поле «Телефон» (CONVERSION_PLAN К1.2): цифры, «+», пробелы, скобки и дефис –
// чтобы проходил номер в любом привычном виде, например «+7 (999) 123-45-67». Проверяется только в браузере
// Что можно набрать в поле «Имя»: только буквы, до 25 без пробелов. Проверяется только в браузере
export const isNameInput = (text: string) => /^[A-Za-zА-Яа-яё]{0,25}$/.test(text.replace(/\s+/g, ''));

export const isPhoneInput = (text: string) => /^[0-9+()\s-]{0,25}$/.test(text);
