import { expect, test, type Locator, type Page, type Request } from '@playwright/test';
import { formButton } from '../src/data/offer';
import { contactEmptyError, contactFormatError, contactIncomplete, formServiceOther, formServiceTitle, formSuccessText, formSuccessTitle, nameEmptyError, nameFormatError } from '../src/data/inputsFeedBack';
import { breadCrumbLabels } from '../src/data/breadCrumbs';
import { services } from '../src/data/offer';

// Подменяет /api/sendMessage: в Telegram ничего не уходит. Возвращает список перехваченных запросов
const mockSendMessage = async (page: Page, status = 200) => {
    const requests: Request[] = [];
    await page.route('**/api/sendMessage', route => {
        requests.push(route.request());
        return route.fulfill({ status, json: status === 200 ? { message: 'ok' } : { error: 'mock' } });
    });
    return requests;
};

// Ошибка у поля: текст под ним, aria-invalid, aria-describedby на этот текст, контур цветом ошибки (DESIGN_FIXES_6_PLAN Д31)
const expectFieldError = async (field: Locator, text: string) => {
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription(text);
    // Контур меняется переходом темы (0.5 с) – ждём конца
    const error = await field.evaluate(el => getComputedStyle(el).getPropertyValue('--color-error').replace(/\s/g, ''));
    await expect.poll(() => field.evaluate(el => getComputedStyle(el).borderTopColor.replace(/\s/g, ''))).toBe(error);
};

const expectNoFieldError = async (field: Locator) => {
    await expect(field).not.toHaveAttribute('aria-invalid');
    await expect(field).not.toHaveAttribute('aria-describedby');
};

const fields = (page: Page) => ({
    name: page.getByPlaceholder('Имя *'),
    contact: page.getByPlaceholder('Телефон или Telegram *'),
    message: page.getByPlaceholder('Комментарий'),
    submit: page.getByRole('button', { name: formButton }),
});

test.beforeEach(async ({ page }) => {
    await page.goto('/popup');
});

test('без обязательных полей заявка не отправляется', async ({ page }) => {
    const requests = await mockSendMessage(page);
    const form = fields(page);

    await form.message.fill('Только комментарий');
    await form.submit.click();

    // Ошибки – под своими полями, фокус на первом неверном (DESIGN_FIXES_6_PLAN Д31)
    await expectFieldError(form.name, nameEmptyError);
    await expectFieldError(form.contact, contactEmptyError);
    await expect(form.name).toBeFocused();
    expect(requests).toHaveLength(0);

    // Исправленное поле теряет ошибку, второе её держит
    await form.name.pressSequentially('Иван');
    await expectNoFieldError(form.name);
    await expectFieldError(form.contact, contactEmptyError);

    await form.submit.click();
    await expect(form.contact).toBeFocused();
    await form.contact.fill('79990001122');
    await expectNoFieldError(form.contact);
});

test('в контакт нельзя ввести кириллицу, в имя — цифры', async ({ page }) => {
    const form = fields(page);

    await form.contact.pressSequentially('12я');
    await expectFieldError(form.contact, contactFormatError);
    await expect(form.contact).toHaveValue('12');

    await form.name.pressSequentially('Ив1');
    await expectFieldError(form.name, nameFormatError);
    await expect(form.name).toHaveValue('Ив');
});

// Настоящие имена: дефис, «Ё», апостроф, пробел; ошибка – в живой области для скринридера (DESIGN_FIXES_3_PLAN Д14)
test('имя с дефисом, «Ё» и апострофом набирается и уходит с заявкой', async ({ page }) => {
    const requests = await mockSendMessage(page);
    const form = fields(page);
    const name = 'Анна-Мария Ёлкина-О’Нил';

    await form.name.pressSequentially(name);
    await expect(form.name).toHaveValue(name);
    await expect(page.getByText(nameFormatError)).toHaveCount(0);

    await form.contact.fill('79990001122');
    await form.submit.click();
    await expect(page.getByRole('heading', { name: formSuccessTitle(name) })).toBeVisible();
    expect(requests[0].postDataJSON()).toMatchObject({ name });
});

test('ошибка поля доступна скринридеру как alert', async ({ page }) => {
    const form = fields(page);
    const alerts = page.locator('form').getByRole('alert');

    await form.name.pressSequentially('Анна7');
    await expect(alerts.filter({ hasText: nameFormatError })).toHaveCount(1);
    await expect(form.name).toHaveValue('Анна');

    await form.submit.click();
    await expect(alerts.filter({ hasText: contactEmptyError })).toHaveCount(1);
    // Ошибки полей – не в плашке: в ней только сеть и сервер
    await expect(page.locator('form > [role=alert]')).toBeEmpty();
});

// Номер в привычном виде набирается без ошибки (CONVERSION_PLAN К1.2)
test('телефон с +, пробелами, скобками и дефисом', async ({ page }) => {
    const form = fields(page);

    await form.contact.pressSequentially('+7 (999) 123-45-67');
    await expect(form.contact).toHaveValue('+7 (999) 123-45-67');
    await expect(page.getByText(/^Формат:/)).toHaveCount(0);
});

// После отправки вместо формы – плашка «что дальше», фокус на её заголовке (DESIGN_FIXES_2_PLAN Д6)
test('валидная заявка уходит одним POST, вместо формы – плашка', async ({ page }) => {
    const requests = await mockSendMessage(page);
    const form = fields(page);

    await form.name.fill('Иван');
    await form.contact.fill('79990001122');
    await form.message.fill('Нужен бит');
    await form.submit.click();

    const title = page.getByRole('heading', { name: formSuccessTitle('Иван') });
    await expect(title).toBeVisible();
    await expect(title).toBeFocused();
    await expect(page.getByRole('status')).toContainText(formSuccessText);
    expect(requests).toHaveLength(1);
    expect(requests[0].method()).toBe('POST');
    expect(requests[0].postDataJSON()).toEqual({
        name: 'Иван',
        contact: '79990001122',
        message: 'Нужен бит',
        website: '', // ловушка для ботов пустая
    });

    // Повторно нажать нечего: формы и кнопки нет, ошибок у полей тоже
    await expect(form.submit).toHaveCount(0);
    await expect(form.name).toHaveCount(0);
    await expect(page.getByText(nameEmptyError)).toHaveCount(0);
});

// «123» – не номер: заявка не уходит, ошибка подсказывает формат (DESIGN_FIXES_2_PLAN Д6)
test('телефон короче 10 цифр не отправляется', async ({ page }) => {
    const requests = await mockSendMessage(page);
    const form = fields(page);

    await form.name.fill('Иван');
    await form.contact.fill('123');
    await form.submit.click();

    await expectFieldError(form.contact, contactIncomplete);
    await expect(form.contact).toBeFocused();
    await expect(form.contact).toHaveValue('123');
    expect(requests).toHaveLength(0);
});

// Ссылка «Обсудить» из кейса: кейс уходит с заявкой, в форме его не видно (SALES_PLAN 4.8)
test('кейс из ссылки уходит вместе с заявкой', async ({ page }) => {
    await page.goto('/popup?case=icc');
    const requests = await mockSendMessage(page);
    const form = fields(page);

    await form.name.fill('Иван');
    await form.contact.fill('79990001122');
    await form.submit.click();

    await expect(page.getByRole('heading', { name: formSuccessTitle('Иван') })).toBeVisible();
    expect(requests[0].postDataJSON()).toMatchObject({ name: 'Иван', case: 'icc' });
});

// Тип проекта – чипы (SALES_PLAN 4.2): услуга из ссылки выбрана заранее, её можно сменить или снять; крошка – «Оставить заявку»
const chip = (page: Page, name: string) => page.getByRole('group', { name: formServiceTitle }).getByRole('button', { name, exact: true });

test('услуга из ссылки выбрана в чипах и уходит с заявкой', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/popup?service=landing');
    const requests = await mockSendMessage(page);
    const form = fields(page);

    await expect(chip(page, 'Лендинг')).toHaveAttribute('aria-pressed', 'true');
    for (const service of [...services.filter(({ id }) => id !== 'landing'), formServiceOther]) {
        await expect(chip(page, service.title)).toHaveAttribute('aria-pressed', 'false');
    }
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveText(`Главная/${breadCrumbLabels.popup}`);

    await form.name.fill('Иван');
    await form.contact.fill('79990001122');
    await form.submit.click();
    await expect(page.getByRole('heading', { name: formSuccessTitle('Иван') })).toBeVisible();
    expect(requests[0].postDataJSON()).toMatchObject({ service: 'landing' });
});

test('другой чип меняет услугу, повторное нажатие снимает выбор', async ({ page }) => {
    await page.goto('/popup?service=landing');
    const requests = await mockSendMessage(page);
    const form = fields(page);

    await chip(page, formServiceOther.title).click();
    await expect(chip(page, formServiceOther.title)).toHaveAttribute('aria-pressed', 'true');
    await expect(chip(page, 'Лендинг')).toHaveAttribute('aria-pressed', 'false');

    await form.name.fill('Иван');
    await form.contact.fill('79990001122');
    await form.submit.click();
    await expect(page.getByRole('heading', { name: formSuccessTitle('Иван') })).toBeVisible();
    expect(requests[0].postDataJSON()).toMatchObject({ service: 'other' });

    // Снятый выбор убирает и услугу из ссылки
    await page.goto('/popup?service=landing&case=icc');
    await expect(chip(page, 'Лендинг')).toHaveAttribute('aria-pressed', 'true');
    await chip(page, 'Лендинг').click();
    await expect(chip(page, 'Лендинг')).toHaveAttribute('aria-pressed', 'false');
    await fields(page).name.fill('Иван');
    await fields(page).contact.fill('79990001122');
    await fields(page).submit.click();
    await expect(page.getByRole('heading', { name: formSuccessTitle('Иван') })).toBeVisible();
    expect(requests[1].postDataJSON()).not.toHaveProperty('service');
    expect(requests[1].postDataJSON()).toMatchObject({ case: 'icc' });
});

test('без услуги и с неизвестной услугой ничего не выбрано', async ({ page }) => {
    const group = page.getByRole('group', { name: formServiceTitle });
    await expect(group.getByRole('button')).toHaveCount(services.length + 1);
    await expect(group.locator('[aria-pressed=true]')).toHaveCount(0);
    await page.goto('/popup?service=toString');
    await expect(page.locator('form')).toBeVisible();
    await expect(group.locator('[aria-pressed=true]')).toHaveCount(0);
});

// В контакт можно ник Telegram вместо номера (SALES_PLAN 4.2)
test('ник Telegram отправляется', async ({ page }) => {
    const requests = await mockSendMessage(page);
    const form = fields(page);

    await form.name.fill('Иван');
    await form.contact.pressSequentially('@ivan_petrov');
    await expectNoFieldError(form.contact);
    await form.submit.click();
    await expect(page.getByRole('heading', { name: formSuccessTitle('Иван') })).toBeVisible();
    expect(requests[0].postDataJSON()).toMatchObject({ contact: '@ivan_petrov' });
});

test('ответ 429 показывает понятную ошибку', async ({ page }) => {
    await mockSendMessage(page, 429);
    const form = fields(page);

    await form.name.fill('Иван');
    await form.contact.fill('79990001122');
    await form.submit.click();

    await expect(page.getByText('Слишком много заявок, попробуйте позже')).toBeVisible();
    await expect(form.name).toHaveValue('Иван');
    await expectNoFieldError(form.name);
});

// Нет сети – плашка, а не ошибка у поля; поля не отмечены (DESIGN_FIXES_6_PLAN Д31)
test('без сети – плашка, введённое сохраняется', async ({ page }) => {
    await page.route('**/api/sendMessage', route => route.abort('internetdisconnected'));
    const form = fields(page);

    await form.name.fill('Иван');
    await form.contact.fill('79990001122');
    await form.submit.click();

    await expect(page.getByText('Не удалось отправить заявку, проверьте соединение')).toBeVisible();
    await expect(form.contact).toHaveValue('79990001122');
    await expectNoFieldError(form.name);
    await expectNoFieldError(form.contact);
});
