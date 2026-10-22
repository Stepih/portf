import { expect, test, type Page, type Request } from '@playwright/test';
import { chatButtonTitle, chatFabLabel, chatLeadSuccess, chatLimitText, chatPlaceholder } from '../src/data/chat';
import { formButton, offerTgButton } from '../src/data/offer';
import { hiddenPages, musicPageURL } from '../src/constants/urls';

// Демо-чат (CONVERSION_PLAN К3.2). /api/chat и /api/sendMessage подменены: к модели и в Telegram ничего не уходит
const ANSWER = 'Лендинг стоит от 8 000 ₽, срок 3–4 дня.';

const mockChat = async (page: Page, reply: { status?: number; body?: string; json?: object } = {}) => {
    const requests: Request[] = [];
    await page.route('**/api/chat', route => {
        requests.push(route.request());
        const { status = 200, body = ANSWER, json } = reply;
        return json
            ? route.fulfill({ status, json })
            : route.fulfill({ status, body, contentType: 'text/plain; charset=utf-8' });
    });
    return requests;
};

const openChat = async (page: Page) => {
    await page.goto('/');
    await page.getByRole('button', { name: chatButtonTitle }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    return dialog;
};

const askQuestion = async (page: Page, text: string) => {
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: chatPlaceholder }).fill(text);
    await dialog.getByRole('textbox', { name: chatPlaceholder }).press('Enter');
};

test('вопрос уходит в /api/chat, ответ и кнопки под ним видны', async ({ page }) => {
    const requests = await mockChat(page);
    const dialog = await openChat(page);

    await askQuestion(page, 'Сколько стоит лендинг?');

    await expect(dialog.getByText(ANSWER)).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0].postDataJSON()).toEqual({
        messages: [{ role: 'user', content: 'Сколько стоит лендинг?' }],
        website: '', // ловушка для ботов пустая
    });
    await expect(dialog.getByRole('button', { name: formButton })).toBeVisible();
    await expect(dialog.getByRole('link', { name: offerTgButton.title })).toHaveAttribute('href', offerTgButton.href);
});

test('второй вопрос уходит с историей, диалог переживает закрытие окна', async ({ page }) => {
    const requests = await mockChat(page);
    const dialog = await openChat(page);

    await askQuestion(page, 'Сколько стоит лендинг?');
    await expect(dialog.getByText(ANSWER)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: chatButtonTitle }).click();
    await expect(dialog.getByText('Сколько стоит лендинг?')).toBeVisible();

    await askQuestion(page, 'А сроки?');
    await expect(dialog.getByText(ANSWER)).toHaveCount(2);
    expect(requests[1].postDataJSON().messages).toEqual([
        { role: 'user', content: 'Сколько стоит лендинг?' },
        { role: 'assistant', content: ANSWER },
        { role: 'user', content: 'А сроки?' },
    ]);
});

test('бюджет исчерпан – текст лимита, поле вопроса скрыто', async ({ page }) => {
    await mockChat(page, { status: 429, json: { error: 'limit', reason: 'budget' } });
    const dialog = await openChat(page);

    await askQuestion(page, 'Сколько стоит лендинг?');

    await expect(dialog.getByText(chatLimitText.budget)).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: chatPlaceholder })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: formButton })).toBeVisible();
});

test('контакт из чата уходит заявкой с вопросами', async ({ page }) => {
    await mockChat(page);
    const leads: Request[] = [];
    await page.route('**/api/sendMessage', route => {
        leads.push(route.request());
        return route.fulfill({ status: 200, json: { message: 'ok' } });
    });
    const dialog = await openChat(page);

    await askQuestion(page, 'Сколько стоит лендинг?');
    await dialog.getByRole('button', { name: formButton }).click();
    await dialog.getByRole('textbox', { name: 'Имя' }).fill('Иван');
    await dialog.getByRole('textbox', { name: 'Телефон' }).fill('+7 999 000-11-22');
    await dialog.getByRole('button', { name: 'Отправить' }).click();

    await expect(dialog.getByText(chatLeadSuccess)).toBeVisible();
    expect(leads).toHaveLength(1);
    expect(leads[0].postDataJSON()).toEqual({
        name: 'Иван',
        contact: '+7 999 000-11-22',
        message: 'Вопросы в чате:\n– Сколько стоит лендинг?',
        from: 'chat',
        website: '',
    });
    // Контакт уже оставлен – второй раз кнопку не предлагаем
    await expect(dialog.getByRole('button', { name: formButton })).toHaveCount(0);
});

test('шар в углу открывает тот же чат и есть на других страницах, кроме /music', async ({ page }) => {
    await mockChat(page);
    const dialog = await openChat(page);
    await askQuestion(page, 'Сколько стоит лендинг?');
    await expect(dialog.getByText(ANSWER)).toBeVisible();
    await page.keyboard.press('Escape');

    // Диалог живёт в layout: переход по ссылке его не сбрасывает
    await page.locator('a[href^="/portfolio"]').first().click();
    await expect(page).toHaveURL(/\/portfolio/);
    await page.getByRole('button', { name: chatFabLabel }).click();
    await expect(dialog.getByText('Сколько стоит лендинг?')).toBeVisible();

    // Пока /music скрыта, проверять отсутствие шара там негде
    if (hiddenPages.includes(musicPageURL)) return;
    await page.goto('/music');
    await expect(page.getByRole('button', { name: chatFabLabel })).toHaveCount(0);
});
