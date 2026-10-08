import type { Page } from '@playwright/test';

// Ошибки окружения, а не кода: headless Edge не доверяет сертификатам Метрики
const IGNORED = [/mc\.yandex\.|yandex\.net|ERR_CERT_AUTHORITY_INVALID/];

// Собирает ошибки консоли и необработанные исключения страницы
export const collectErrors = (page: Page): string[] => {
    const errors: string[] = [];

    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => {
        if (message.type() !== 'error') return;
        const text = `${message.text()} ${message.location().url}`;
        if (!IGNORED.some(re => re.test(text))) errors.push(`console: ${text}`);
    });

    return errors;
};
