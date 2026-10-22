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
