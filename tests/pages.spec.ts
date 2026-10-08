import { expect, test } from '@playwright/test';
import { collectErrors } from './errors';

for (const path of ['/', '/music', '/media', '/popup']) {
    test(`${path} отвечает 200 и не пишет ошибок в консоль`, async ({ page }) => {
        const errors = collectErrors(page);

        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await page.waitForLoadState('networkidle');

        expect(errors).toEqual([]);
    });
}
