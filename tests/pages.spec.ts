import { expect, test } from '@playwright/test';
import { collectErrors } from './errors';
import { hiddenPages } from '../src/constants/urls';

for (const path of ['/', '/music', '/media', '/popup'].filter(path => !hiddenPages.includes(path))) {
    test(`${path} отвечает 200 и не пишет ошибок в консоль`, async ({ page }) => {
        const errors = collectErrors(page);

        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await page.waitForLoadState('networkidle');

        expect(errors).toEqual([]);
    });
}

for (const path of hiddenPages) {
    test(`${path} временно скрыта и отвечает 404`, async ({ page }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(404);
    });
}

// 404 берёт сохранённую тему: и несуществующий адрес, и notFound() скрытой страницы – там Next рисует <html> заново
// и атрибут из скрипта layout теряется (DESIGN_FIXES_8_PLAN Д46)
for (const path of ['/no-such-page', ...hiddenPages]) {
    test(`404 ${path} – в тёмной теме, если она выбрана`, async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('theme', 'dark') } catch { } });
        const response = await page.goto(path);
        expect(response?.status()).toBe(404);
        await expect(page.getByRole('heading', { level: 1, name: 'Страница не найдена' })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(page.getByRole('button', { name: 'Тёмная тема' })).toHaveAttribute('aria-pressed', 'true');
    });
}
