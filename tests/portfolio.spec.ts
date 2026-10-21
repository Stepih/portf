import { expect, test } from '@playwright/test';
import { offerTgButton, portfolioFormButton } from '../src/data/offer';

// Шапка каталога: оффер и две кнопки; в подборке ?for= заголовок с отраслью, отрасль уходит в форму (SALES_PLAN 5.1)
test('шапка портфолио с подборкой по отрасли', async ({ page }) => {
    await page.goto('/portfolio?for=construction');

    await expect(page.locator('h1')).toHaveText('Сайты для строительных и ремонтных компаний');
    await expect(page).toHaveTitle('Сайты для строительных и ремонтных компаний – портфолио');

    const form = page.getByRole('link', { name: portfolioFormButton });
    await expect(form).toHaveAttribute('href', '/popup?for=construction');
    await expect(page.getByRole('link', { name: offerTgButton.title })).toHaveAttribute('href', offerTgButton.href);

    // Сброс фильтра возвращает общий заголовок и ссылку без отрасли
    await page.getByRole('button', { name: /^Все/ }).click();
    await expect(page.locator('h1')).toHaveText('Портфолио');
    await expect(form).toHaveAttribute('href', '/popup');
});
