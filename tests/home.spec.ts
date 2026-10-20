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
