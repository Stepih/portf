import { expect, test, type Page, type Request } from '@playwright/test';

// Подменяет /api/sendMessage: в Telegram ничего не уходит. Возвращает список перехваченных запросов
const mockSendMessage = async (page: Page, status = 200) => {
    const requests: Request[] = [];
    await page.route('**/api/sendMessage', route => {
        requests.push(route.request());
        return route.fulfill({ status, json: status === 200 ? { message: 'ok' } : { error: 'mock' } });
    });
    return requests;
};

const fields = (page: Page) => ({
    name: page.getByPlaceholder('Имя *'),
    contact: page.getByPlaceholder('Телефон *'),
    message: page.getByPlaceholder('Комментарий'),
    submit: page.getByRole('button', { name: 'Отправить' }),
});

test.beforeEach(async ({ page }) => {
    await page.goto('/popup');
});

test('без обязательных полей заявка не отправляется', async ({ page }) => {
    const requests = await mockSendMessage(page);
    const form = fields(page);

    await form.message.fill('Только комментарий');
    await form.submit.click();

    await expect(page.getByText('Заполни, пожалуйста, важные поля')).toBeVisible();
    expect(requests).toHaveLength(0);
});

test('в телефон нельзя ввести буквы, в имя — цифры', async ({ page }) => {
    const form = fields(page);

    await form.contact.pressSequentially('12a');
    await expect(page.getByText('Формат: только цифры, не больше 25 символов')).toBeVisible();
    await expect(form.contact).toHaveValue('12');

    await form.name.pressSequentially('Ив1');
    await expect(page.getByText('Формат: только буквы, не больше 25 символов')).toBeVisible();
    await expect(form.name).toHaveValue('Ив');
});

test('валидная заявка уходит одним POST, форма очищается', async ({ page }) => {
    const requests = await mockSendMessage(page);
    const form = fields(page);

    await form.name.fill('Иван');
    await form.contact.fill('79990001122');
    await form.message.fill('Нужен бит');
    await form.submit.click();

    await expect(page.getByRole('button', { name: 'Отправлено!' })).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0].method()).toBe('POST');
    expect(requests[0].postDataJSON()).toEqual({
        name: 'Иван',
        contact: '79990001122',
        message: 'Нужен бит',
        website: '', // ловушка для ботов пустая
    });
    await expect(form.name).toHaveValue('');
    await expect(form.contact).toHaveValue('');
    await expect(form.message).toHaveValue('');
});

test('ответ 429 показывает понятную ошибку', async ({ page }) => {
    await mockSendMessage(page, 429);
    const form = fields(page);

    await form.name.fill('Иван');
    await form.contact.fill('79990001122');
    await form.submit.click();

    await expect(page.getByText('Слишком много заявок, попробуй позже')).toBeVisible();
    await expect(form.name).toHaveValue('Иван');
});
