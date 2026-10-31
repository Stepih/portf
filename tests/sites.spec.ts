import { expect, test } from '@playwright/test';
import { collectErrors } from './errors';
import { columns, commonId, faq, head, nav, sections } from '../src/data/sitesPage';
import { offerTgButton, services, servicesButton } from '../src/data/offer';
import { contactHref } from '../src/scripts/services';

// Страница /sites (SERVICES_PLAN У5): статичная, сцены – в У5а
const sites = services.filter((service) => service.id !== 'ai');
// Неразрывные пробелы и сцепки в текстах – обычными пробелами
const norm = (text?: string | null) => (text ?? '').replace(/\u2060/g, '').replace(/\s+/g, ' ');

test('/sites отвечает 200, закрыта от поиска, своё превью и без ошибок в консоли', async ({ page, request }) => {
    const errors = collectErrors(page);

    const response = await page.goto('/sites');
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(head.title);

    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toMatch(/\/sites\/opengraph-image/);
    const image = await request.get(new URL(og!).pathname);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toBe('image/png');

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
});

// Три раздела в порядке карточек главной: цена, срок, «Узнать цену» в форму с услугой, ссылка на «Для всех сайтов»
test('/sites: разделы сайтов – цена, срок и кнопка в форму с услугой', async ({ page }) => {
    await page.goto('/sites');

    for (const service of sites) {
        const section = page.locator(`section#${service.id}`);
        await expect(section.getByRole('heading', { level: 2 })).toHaveText(service.title);
        const text = norm(await section.textContent());
        expect(text).toContain(norm(service.price));
        expect(text).toContain(norm(service.term));
        for (const label of [columns.included, columns.options, columns.excluded, columns.payment]) {
            await expect(section.getByRole('heading', { level: 3, name: label })).toBeVisible();
        }
        const button = section.getByRole('link', { name: `${servicesButton}: ${service.title}` });
        await expect(button).toHaveAttribute('href', contactHref(service.id));
        await expect(button).toHaveAttribute('data-goal', 'service_click');
        await expect(section.getByRole('link', { name: columns.common }).first()).toHaveAttribute('href', `#${commonId}`);
    }
});

test('/sites: кейсы ведут на страницы кейсов', async ({ page }) => {
    await page.goto('/sites');
    const links = page.locator('section#shop a[href^="/portfolio/"]');
    await expect(links).toHaveCount(5);
    const href = await links.first().getAttribute('href');
    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
});

// Навигация: якорь ведёт к разделу, заголовок не под липкой строкой, залита таблетка текущего раздела
for (const width of [1400, 375]) {
    test(`/sites: навигация по разделам, ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 850 });
        await page.goto('/sites');

        const bar = page.getByRole('navigation', { name: 'Разделы страницы' });
        await expect(bar.getByRole('link')).toHaveText(nav.map((item) => item.label));

        await bar.getByRole('link', { name: sections.common.title }).click();
        await expect(page).toHaveURL(/#common$/);
        const title = page.getByRole('heading', { level: 2, name: sections.common.title });
        await expect(title).toBeInViewport();
        await expect(bar.getByRole('link', { name: sections.common.title })).toHaveAttribute('aria-current', 'location');

        // Строка навигации прилипла к верху и не закрывает заголовок
        const barBox = (await bar.boundingBox())!;
        const titleBox = (await title.boundingBox())!;
        expect(barBox.y).toBeLessThan(20);
        expect(titleBox.y).toBeGreaterThan(barBox.y + barBox.height);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(width);
    });
}

test('/sites: FAQ без сумм, первый вопрос раскрыт; финал – форма и Telegram в новой вкладке', async ({ page }) => {
    await page.goto('/sites');

    const faqRegion = page.getByRole('region', { name: sections.faq.title });
    await expect(faqRegion.locator('details')).toHaveCount(faq.length);
    await expect(faqRegion.locator('details').first()).toHaveAttribute('open', '');
    for (const item of await faqRegion.locator('details').all()) await expect(item).not.toContainText('₽');

    const final = page.getByRole('region', { name: sections.cta.title });
    await expect(final.getByRole('link', { name: head.cta })).toHaveAttribute('href', contactHref());
    const tg = final.getByRole('link', { name: head.tg });
    await expect(tg).toHaveAttribute('href', offerTgButton.href);
    await expect(tg).toHaveAttribute('target', '_blank');
});
