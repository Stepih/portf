import { expect, test } from '@playwright/test';
import { collectErrors } from './errors';
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

// Превью ссылок: у кейса своя картинка, у каталога – общая; обе отдаются как PNG (SALES_PLAN 5.6)
test('картинки-превью ссылок у кейса и каталога', async ({ page, request }) => {
    for (const [path, image] of [['/portfolio/icc', '/portfolio/icc/opengraph-image'], ['/portfolio', '/opengraph-image']]) {
        await page.goto(path);
        const url = await page.locator('meta[property="og:image"]').getAttribute('content');
        expect(new URL(url!).pathname).toBe(image);

        const response = await request.get(image);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toBe('image/png');
    }
});

// Название кейса при наведении и фокусе подчёркивается, а не голубеет: голубой только у фокуса и фона (DESIGN_FIXES_3_PLAN Д12)
test('название кейса при наведении и фокусе подчёркнуто, без голубого', async ({ page }) => {
    await page.goto('/portfolio');

    const title = page.locator('#all h3 a').first();
    await title.scrollIntoViewIfNeeded();
    const style = () => title.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { line: cs.textDecorationLine, color: cs.color, decoration: cs.textDecorationColor };
    });

    await expect.poll(async () => (await style()).decoration).toBe('rgba(0, 0, 0, 0)');

    for (const act of [() => title.hover(), () => title.focus()]) {
        await page.mouse.move(0, 0);
        await act();
        await expect.poll(async () => {
            const s = await style();
            return s.line === 'underline' && s.decoration === s.color;
        }).toBe(true);
        expect((await style()).color).not.toBe('rgb(119, 199, 234)');
    }
});

// «Уменьшить движение» узнаём после монтирования, как на главной (DESIGN_FIXES_PLAN Д3): гидрация без ошибок,
// при reduce карточки без трансформации и блоки кейса видны сразу. Карточки ниже экрана «откинуты» и шире колонки,
// но страница на телефоне вбок не едет (было 33px)
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`портфолио на телефоне без прокрутки вбок, reduced-motion: ${reducedMotion}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        await page.setViewportSize({ width: 375, height: 740 });
        const errors = collectErrors(page);

        await page.goto('/portfolio');
        const cards = page.locator('#all article');
        await expect(cards.first()).toBeVisible();
        const transformed = () => cards.evaluateAll((els) => els.filter((el) => getComputedStyle(el).transform !== 'none').length);
        if (reducedMotion === 'reduce') await expect.poll(transformed).toBe(0);
        else await expect.poll(transformed).toBeGreaterThan(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

        await page.goto('/portfolio/icc');
        const hidden = () => page.locator('main').evaluate((main) => [...main.querySelectorAll<HTMLElement>('*')].filter((el) => el.style.opacity === '0').length);
        if (reducedMotion === 'reduce') await expect.poll(hidden).toBe(0);
        else await expect.poll(hidden).toBeGreaterThan(0);

        expect(errors).toEqual([]);
    });
}
