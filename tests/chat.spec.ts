import { expect, test, type Page, type Request } from '@playwright/test';
import { chatButtonTitle, chatFabLabel, chatLeadSuccess, chatLimitText, chatPlaceholder } from '../src/data/chat';
import { formButton, offerTgButton } from '../src/data/offer';
import { phoneTooShort } from '../src/data/inputsFeedBack';
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
    // Обрывок номера не уходит (DESIGN_FIXES_2_PLAN Д6)
    await dialog.getByRole('textbox', { name: 'Телефон' }).fill('123');
    await dialog.getByRole('button', { name: 'Отправить' }).click();
    await expect(dialog.getByRole('alert')).toHaveText(phoneTooShort);
    expect(leads).toHaveLength(0);

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

    // Диалог живёт в layout: переход по ссылке его не сбрасывает. Чипы отраслей кликаются,
    // когда вылетели из кружка: к 0,85 экрана скролла
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * .85));
    await page.locator('a[href^="/portfolio"]').first().click();
    await expect(page).toHaveURL(/\/portfolio/);
    await page.getByRole('button', { name: chatFabLabel }).click();
    await expect(dialog.getByText('Сколько стоит лендинг?')).toBeVisible();

    // Пока /music скрыта, проверять отсутствие шара там негде
    if (hiddenPages.includes(musicPageURL)) return;
    await page.goto('/music');
    await expect(page.getByRole('button', { name: chatFabLabel })).toHaveCount(0);
});

// DESIGN_FIXES_4_PLAN Д22: шар – матовое стекло с одной тенью мастерской, без голубого ореола и точки «в сети»;
// окно – плашечные 13px без рамки
test('шар и окно чата – в системе: стекло, одна тень, 13px без рамки', async ({ page }) => {
    for (const theme of ['light', 'dark']) {
        await page.addInitScript(t => localStorage.setItem('theme', t), theme);
        await page.goto('/');
        const fab = page.getByRole('button', { name: chatFabLabel });
        await expect(fab).toBeVisible();

        const orb = await fab.locator('> span[aria-hidden="true"]').evaluate(el => {
            const cs = getComputedStyle(el);
            const icon = getComputedStyle(el.querySelector('svg')!);
            return {
                bg: cs.backgroundImage, color: cs.backgroundColor, shadow: cs.boxShadow,
                children: el.children.length, iconFill: icon.fill, iconFilter: icon.filter,
            };
        });
        expect(orb.bg).toBe('none');
        expect(orb.color).toBe(theme === 'light' ? 'rgb(239, 239, 239)' : 'rgb(33, 33, 33)');
        expect(orb.shadow).toBe('rgba(0, 0, 0, 0.25) 0px 4px 48px 0px');
        // свет за стеклом и иконка; точки «в сети» нет
        expect(orb.children).toBe(2);
        expect(orb.iconFilter).toBe('none');
        expect(orb.iconFill).toBe(theme === 'light' ? 'rgb(19, 19, 19)' : 'rgb(255, 255, 255)');

        await fab.click();
        const win = await page.getByRole('dialog').evaluate(el => {
            const cs = getComputedStyle(el);
            return { radius: cs.borderTopLeftRadius, border: cs.borderTopWidth };
        });
        expect(win).toEqual({ radius: '13px', border: '0px' });
    }
});
