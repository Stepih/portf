import { expect, test } from '@playwright/test';
import { caseCtaShort, formButton, offerTgButton } from '../src/data/offer';

// Шапка каталога: оффер и две кнопки; в подборке ?for= заголовок с отраслью, отрасль уходит в форму (SALES_PLAN 5.1)
test('шапка портфолио с подборкой по отрасли', async ({ page }) => {
    await page.goto('/portfolio?for=construction');

    await expect(page.locator('h1')).toHaveText('Сайты для строительных и ремонтных компаний');
    await expect(page).toHaveTitle('Сайты для строительных и ремонтных компаний – портфолио');

    const form = page.getByRole('link', { name: formButton });
    await expect(form).toHaveAttribute('href', '/popup?for=construction');
    await expect(page.getByRole('link', { name: offerTgButton.title })).toHaveAttribute('href', offerTgButton.href);

    // Сброс фильтра возвращает общий заголовок и ссылку без отрасли
    await page.getByRole('button', { name: /^Все/ }).click();
    await expect(page.locator('h1')).toHaveText('Портфолио');
    await expect(form).toHaveAttribute('href', '/popup');
});

// Призыв после цифр и в конце кейса: форма с кейсом в ссылке и Telegram (SALES_PLAN 5.2)
test('призывы в кейсе ведут в форму с кейсом и в Telegram', async ({ page }) => {
    await page.goto('/portfolio/icc');

    const short = page.getByRole('region', { name: 'Обсудить похожий проект' });
    await expect(short.getByText(caseCtaShort)).toBeVisible();

    const forms = page.getByRole('link', { name: formButton });
    await expect(forms).toHaveCount(2);
    for (const link of await forms.all()) await expect(link).toHaveAttribute('href', '/popup?case=icc');
    await expect(page.getByRole('link', { name: offerTgButton.title })).toHaveCount(2);
});
