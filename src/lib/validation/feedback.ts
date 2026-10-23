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

    if (!isPhoneComplete(contact)) return { ok: false, error: 'Invalid phone' };

    if (
        name.length > FEEDBACK_LIMITS.name ||
        contact.length > FEEDBACK_LIMITS.contact ||
        message.length > FEEDBACK_LIMITS.message
    ) {
        return { ok: false, error: 'Field too long' };
    }

    return { ok: true, data: { name, contact, message } };
};

// Что можно набрать в поле «Имя» (DESIGN_FIXES_3_PLAN Д14): буквы любого алфавита (с диакритикой), пробелы,
// дефис и апостроф – проходят «Анна-Мария», «Ёлкина», «O’Brien». До FEEDBACK_LIMITS.name символов. Цифры и эмодзи – нет.
// Одна проверка для формы заявки и формы в чате, только в браузере
const NAME_INPUT = new RegExp(String.raw`^[\p{L}\p{M}\s'’ʼ-]{0,${FEEDBACK_LIMITS.name}}$`, 'u');
export const isNameInput = (text: string) => NAME_INPUT.test(text);

// Что можно набрать в поле «Телефон» (CONVERSION_PLAN К1.2): цифры, «+», пробелы, скобки и дефис –
// чтобы проходил номер в любом привычном виде, например «+7 (999) 123-45-67». Проверяется только в браузере
export const isPhoneInput = (text: string) => /^[0-9+()\s-]{0,25}$/.test(text);

// Номер целиком – не меньше 10 цифр, «123» не проходит (DESIGN_FIXES_2_PLAN Д6). Проверяется и в браузере, и в /api/sendMessage
export const PHONE_MIN_DIGITS = 10;
export const isPhoneComplete = (text: string) => text.replace(/\D/g, '').length >= PHONE_MIN_DIGITS;
