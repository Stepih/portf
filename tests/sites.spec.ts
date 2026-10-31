import { expect, Page, test } from '@playwright/test';
import { collectErrors } from './errors';
import { build, buildUi, columns, faq, head, sections, sitesDetails } from '../src/data/sitesPage';
import { offerTgButton, services, servicesButton } from '../src/data/offer';
import { contactHref } from '../src/scripts/services';
import { planFor } from '../src/app/sites/components/window/timeline';

// Страница /sites (SERVICES_PLAN У5, сцены сборки – У5а, окно-герой – У5б)
type SiteId = keyof typeof build;
const sites = services.filter((service): service is typeof service & { id: SiteId } => service.id !== 'ai');
// Подпись таблетки как в разметке: после дефиса может стоять сцепка U+2060
const label = (text: string) => new RegExp(norm(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '-\\u2060?'));
// Неразрывные пробелы и сцепки в текстах – обычными пробелами
const norm = (text?: string | null) => (text ?? '').replace(/⁠/g, '').replace(/\s+/g, ' ');

// Скролл к моменту t сцены (в экранах, timeline.ts): метка #landing стоит в начале лендинга
const scrollToTime = async (page: Page, t: number, phone = false) => {
    const plan = planFor(phone);
    const y = await page.evaluate(() => document.getElementById('landing')!.getBoundingClientRect().top + window.scrollY);
    const h = await page.evaluate(() => window.innerHeight);
    await page.evaluate((top) => window.scrollTo(0, top), y + (t - plan.kinds[0].from) * h);
    await page.waitForTimeout(1300);
};

const tabs = (page: Page) => page.getByRole('navigation', { name: buildUi.tabs });

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

// Цена – в конце сборки вида: название, цена, срок, уточнение и «Узнать цену» в форму с услугой и целью Метрики
test('/sites: в конце каждого вида – цена, срок и кнопка в форму с услугой', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    const plan = planFor(false);

    for (const service of sites) {
        const k = plan.kinds.find((item) => item.kind === service.id)!;
        await scrollToTime(page, (k.priced + k.to) / 2);
        const price = page.locator(`section[aria-labelledby="${service.id}-title"]`);
        await expect(price.getByRole('heading', { level: 2 })).toHaveText(service.title);
        await expect(price.getByRole('heading', { level: 2 })).toBeInViewport();
        const text = norm(await price.textContent());
        for (const part of [service.price, service.term, service.note ?? '']) expect(text).toContain(norm(part));
        const button = price.getByRole('link', { name: `${servicesButton}: ${service.title}` });
        await expect(button).toBeVisible();
        await expect(button).toHaveAttribute('href', contactHref(service.id));
        await expect(button).toHaveAttribute('data-goal', 'service_click');
        await expect(button).toHaveAttribute('data-goal-id', service.id);
        // Окно не приглушено, все таблетки опций стоят
        await expect(page.locator('figure')).toBeInViewport();
        for (const pill of build[service.id].pills) await expect(page.locator('figure li', { hasText: label(pill.label) }).first()).toBeVisible();
    }
});

// Под окном – одна строка: состав группами по очереди, потом опции тихой строкой
test('/sites: под окном одна строка шага – состав по очереди, потом опции', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    const shop = planFor(false).kinds[2];

    await scrollToTime(page, shop.from + .05);
    await expect(page.getByText(build.shop.callouts[0].items[0], { exact: true })).toBeVisible();
    await expect(page.getByText(build.shop.callouts[1].items[0], { exact: true })).toBeHidden();
    await expect(tabs(page).getByRole('link', { name: 'Магазин или каталог' })).toHaveAttribute('aria-current', 'location');

    // Конец сборки: заказ оплачен, последняя группа – «Каталог без корзины»
    await scrollToTime(page, shop.built - .03);
    await expect(page.getByText(build.shop.callouts.at(-1)!.label!, { exact: true })).toBeVisible();
    await expect(page.getByText(build.shop.callouts[0].items[0], { exact: true })).toBeHidden();
    await expect(page.getByText(buildUi.paid)).toHaveCSS('opacity', '1');

    // Опции: подпись и тихая строка «Цену назову на созвоне»
    await scrollToTime(page, (shop.built + shop.priced) / 2);
    await expect(page.getByText(`${columns.onCall} ${sitesDetails.shop.onCall}`)).toBeVisible();
});

// Сайт компании: сумма собирается на глазах до итога примера расчёта
test('/sites: у сайта компании счётчик суммы доходит до итога примера', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    const corp = planFor(false).kinds[1];

    await scrollToTime(page, corp.built + .02);
    await expect(page.getByText(build.corporate.sum!.caption)).toBeHidden();
    await scrollToTime(page, corp.priced - .02);
    await expect(page.getByText(build.corporate.sum!.caption)).toBeVisible();
    await expect(page.locator('figure').getByText(norm(sitesDetails.corporate.example!.total))).toBeVisible();
});

// Вкладки видов в окне: клик прокручивает к началу вида, якорь в адресе, вкладка подсвечена, без прокрутки вбок
for (const width of [1400, 375]) {
    test(`/sites: вкладки видов в окне, ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width > 700 ? 900 : 812 });
        await page.goto('/sites');

        await expect(tabs(page).getByRole('link')).toHaveText(sites.map((service) => service.title));
        await expect(tabs(page).getByRole('link', { name: 'Лендинг' })).toHaveAttribute('aria-current', 'location');

        await tabs(page).getByRole('link', { name: 'Сайт компании' }).click();
        await expect(page).toHaveURL(/#corporate$/);
        await expect(tabs(page).getByRole('link', { name: 'Сайт компании' })).toHaveAttribute('aria-current', 'location', { timeout: 10000 });
        await page.waitForTimeout(1500);
        await expect(page.getByText(build.corporate.callouts[0].items[0])).toBeVisible();
        await expect(page.locator('figure')).toBeInViewport({ ratio: .9 });

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(width);
    });
}

// Ссылки «Что входит →» с карточек главной: /sites#shop открывает начало сборки магазина
for (const width of [1400, 375]) {
    test(`/sites#shop с главной – начало магазина, ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width > 700 ? 900 : 812 });
        await page.goto('/sites#shop');
        await page.waitForTimeout(1500);
        await expect(tabs(page).getByRole('link', { name: 'Магазин или каталог' })).toHaveAttribute('aria-current', 'location');
        await expect(page.getByText(build.shop.callouts[0].items[0], { exact: true })).toBeVisible();
        await expect(page.locator('figure')).toBeInViewport({ ratio: .9 });
    });
}

test('/sites: кейсы ведут на страницы кейсов', async ({ page }) => {
    await page.goto('/sites');
    const list = page.getByRole('region', { name: columns.cases.replace(/:$/, '') });
    const links = list.locator('a[href^="/portfolio/"]');
    const count = Object.values(sitesDetails).reduce((n, item) => n + item.cases.length, 0);
    await expect(links).toHaveCount(count);
    const href = await links.first().getAttribute('href');
    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
});

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

test('/sites: без движения – по каждому виду собранное окно, состав, опции и цена', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');

    for (const service of sites) {
        const section = page.locator(`section#${service.id}`);
        await expect(section.getByRole('heading', { level: 2 })).toHaveText(service.title);
        await expect(section.getByRole('heading', { level: 3, name: columns.included })).toBeVisible();
        await expect(section.getByRole('heading', { level: 3, name: columns.options })).toBeVisible();
        expect(norm(await section.textContent())).toContain(norm(service.price));
        for (const pill of build[service.id].pills) await expect(section.locator('figure li', { hasText: label(pill.label) })).toBeVisible();
    }
    await expect(page.locator('section#landing').getByText(buildUi.lead)).toHaveCSS('opacity', '1');
    // Не липкая сцена: окно уходит вверх вместе со страницей
    const heading = page.locator('section#landing h2');
    const before = (await heading.boundingBox())!.y;
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    expect((await heading.boundingBox())!.y).toBeLessThan(before - 400);
});
