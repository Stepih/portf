import { expect, test } from '@playwright/test';
import { offerTitle } from '../src/data/offer';

// Слайды первого экрана сменяются, а h1 с оффером в HTML один и есть всегда (SALES_PLAN 3.1.1)
test('на главной один h1 с оффером, черта переключает слайд', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(offerTitle);

    const third = page.getByRole('button', { name: 'Слайд 3' });
    await third.click();
    await expect(third).toHaveAttribute('aria-current', 'true');
});

// Чип отрасли ведёт в подборку портфолио (SALES_PLAN 3.2)
test('чип отрасли открывает портфолио с фильтром', async ({ page }) => {
    await page.goto('/');

    const chips = page.getByRole('region', { name: 'Выберите свою отрасль' }).getByRole('link');
    await expect(chips.first()).toBeVisible();

    const href = await chips.first().getAttribute('href');
    expect(href).toMatch(/^\/portfolio\?for=[a-z0-9]+$/);

    await chips.first().click();
    await expect(page).toHaveURL(href!);
    await expect(page.getByRole('button', { pressed: true })).not.toHaveText(/^Все/);
});

// Избранные кейсы ведут на страницы кейсов, кнопка – на всё портфолио (SALES_PLAN 3.3)
test('избранные кейсы на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Избранные кейсы' });
    const cases = section.getByRole('heading', { level: 3 }).getByRole('link');
    await expect(cases).toHaveCount(3);
    await expect(cases.first()).toHaveAttribute('href', /^\/portfolio\/[a-z0-9]+$/);

    await section.getByRole('link', { name: 'Все работы' }).click();
    await expect(page).toHaveURL(/\/portfolio$/);
});

// Карточки услуг с ценой, кнопка «Узнать цену» ведёт в форму с услугой (SALES_PLAN 3.4)
test('услуги и цены на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Услуги и цены' });
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(4);
    await expect(section.getByText('от 8 000 ₽')).toBeVisible();

    const discuss = section.getByRole('link', { name: 'Узнать цену: Лендинг' });
    await expect(discuss).toHaveAttribute('href', '/popup?service=landing');
    await discuss.click();
    await expect(page).toHaveURL(/\/popup\?service=landing$/);
});

// Шаги работы списком по порядку (SALES_PLAN 3.5)
test('как я работаю на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Как я работаю' });
    const steps = section.getByRole('listitem');
    await expect(steps).toHaveCount(5);
    await expect(steps.first().getByRole('heading', { level: 3 })).toHaveText('Созвон');
});

// Шесть причин списком, первая – «Один исполнитель» (SALES_PLAN 3.6)
test('почему я на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Почему я' });
    const reasons = section.getByRole('listitem');
    await expect(reasons).toHaveCount(6);
    await expect(reasons.first().getByRole('heading', { level: 3 })).toHaveText('Один исполнитель');
});
