import { expect, Page, test } from '@playwright/test';
import { collectErrors } from './errors';
import { build, buildUi, casesDeck, columns, faq, head, more, payment, projectPath, sections, sitesDetails, terms } from '../src/data/sitesPage';
import { offerTgButton, services, servicesButton } from '../src/data/offer';
import { skipToContent } from '../src/data/layout';
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
    // Метка якоря стоит на ANCHOR_AFTER позже начала вида – отступаем с запасом
    await scrollToTime(page, shop.built - .1);
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

// Ширины и высоты окна для проверок по экранам (У5б, этап 4): компьютер, ноутбук, планшет стоя, телефон
const screens: Record<number, number> = { 1400: 900, 1100: 800, 820: 1180, 375: 812 };

// Вкладки видов в окне: клик прокручивает к началу вида, якорь в адресе, вкладка подсвечена, без прокрутки вбок
for (const width of [1400, 1100, 820, 375]) {
    test(`/sites: вкладки видов в окне, ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: screens[width] });
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
for (const width of [1400, 1100, 820, 375]) {
    test(`/sites#shop с главной – начало магазина, ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: screens[width] });
        await page.goto('/sites#shop');
        await page.waitForTimeout(1500);
        await expect(tabs(page).getByRole('link', { name: 'Магазин или каталог' })).toHaveAttribute('aria-current', 'location');
        await expect(page.getByText(build.shop.callouts[0].items[0], { exact: true })).toBeVisible();
        await expect(page.locator('figure')).toBeInViewport({ ratio: .9 });
    });
}

// Скролл к моменту t сцены нижней части (в экранах от кадра, где её экран встал); отрицательное t – от кадра,
// где экран отпускает скролл
const scrollToScene = async (page: Page, title: string, t: number) => {
    // После загрузки сцены пересчитывают длины по замерам, колода встаёт на стык с окном – ждём, пока страница уляжется
    await page.waitForTimeout(800);
    const { y, height } = await page.evaluate((name) => {
        const heading = [...document.querySelectorAll('h2')].find((h) => h.textContent === name)!;
        const section = heading.closest('section')!;
        let el: HTMLElement | null = section;
        let top = 0;
        while (el) {
            top += el.offsetTop;
            el = el.offsetParent as HTMLElement | null;
        }
        return { y: top, height: section.offsetHeight };
    }, title);
    const h = await page.evaluate(() => window.innerHeight);
    await page.evaluate((top) => window.scrollTo(0, top), Math.round(t >= 0 ? y + t * h : y + height - h + t * h));
    await page.waitForTimeout(1300);
};

test('/sites: кейсы колодой – без повторов, ведут на страницы кейсов', async ({ page }) => {
    await page.goto('/sites');
    const list = page.getByRole('region', { name: casesDeck.title });
    const links = list.locator('a[href^="/portfolio/"]');
    const count = new Set(Object.values(sitesDetails).flatMap((item) => item.cases.map((c) => c.id))).size;
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

// Нижняя часть сценами (У5б, этап 2): порядок блоков – окно, кейсы, путь, оплата, три колонки, «Ещё делаю», FAQ, финал
test('/sites: порядок блоков под сценой окна', async ({ page }) => {
    await page.goto('/sites');
    const titles = (await page.locator('main h2').allTextContents()).map(norm);
    const order = [casesDeck.title, projectPath.title, payment.title, terms.title, sections.more.title, sections.faq.title, sections.cta.title];
    const at = order.map((title) => titles.indexOf(title));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect(at).toEqual([...at].sort((a, b) => a - b));
    // Цены видов – выше кейсов
    expect(titles.indexOf('Магазин или каталог')).toBeLessThan(at[0]);
});

// Стык окна с колодой: в начале колоды окно уже пустое и спрятано, на его месте – карточки с кейсами
test('/sites: окно уходит в колоду кейсов, слайды листаются', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    await scrollToScene(page, casesDeck.title, .9);
    await expect(page.locator('figure').first()).toHaveCSS('opacity', '0');
    const deck = page.getByRole('region', { name: casesDeck.title });
    await expect(deck.getByRole('heading', { level: 2 })).toBeInViewport();
    const first = deck.locator('li').first();
    await expect(first).toBeInViewport();
    await expect(first.getByRole('link')).toBeVisible();
    // Слайд 2: первая пара ушла и не в фокусе
    const dots = deck.getByRole('button', { name: /слайд/ });
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');
    await dots.nth(1).click();
    await page.waitForTimeout(1500);
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await expect(first).toHaveAttribute('inert', '');
});

// Оплата – одна шкала: суммы проекта сменяют друг друга, в конце – возврат предоплаты
test('/sites: шкала оплаты перестраивается по сумме', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    const region = page.getByRole('region', { name: payment.title });
    // Сумма этапа – в строке, которая проявляется и уходит целиком
    const range = (i: number) => region.getByText(payment.stages[i].range, { exact: true }).locator('xpath=..');
    await scrollToScene(page, payment.title, .7);
    await expect(range(0)).toHaveCSS('opacity', '1');
    await expect(region.getByText(payment.refund)).not.toBeInViewport();
    await scrollToScene(page, payment.title, -.2);
    await expect(range(2)).toHaveCSS('opacity', '1');
    await expect(range(0)).toHaveCSS('opacity', '0');
    await expect(region.getByText(payment.refund)).toBeInViewport();
});

for (const width of [1400, 375]) {
    test(`/sites: три колонки и «Ещё делаю» на липком экране, ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width > 700 ? 900 : 812 });
        await page.goto('/sites');
        const region = page.getByRole('region', { name: terms.title });
        await scrollToScene(page, terms.title, -.2);
        // В конце сцены видна последняя колонка (на телефоне колонки сменяют друг друга)
        const last = terms.columns.at(-1)!;
        await expect(region.getByRole('heading', { level: 3, name: last.title })).toBeInViewport();
        await expect(region.getByText(last.items[0])).toBeInViewport();

        // Д41: прайс в колонках – в конце сцены видны колонки (на телефоне – последняя), веб-сервисы и партнёры
        const moreRegion = page.getByRole('region', { name: sections.more.title });
        await scrollToScene(page, sections.more.title, -.2);
        const shown = width > 700 ? more.columns : more.columns.slice(-1);
        for (const col of shown) {
            await expect(moreRegion.getByRole('heading', { level: 3, name: col.title })).toBeInViewport();
            for (const row of col.rows) await expect(moreRegion.getByText(row.title, { exact: true })).toBeInViewport();
        }
        await expect(moreRegion.getByText(more.wide.price, { exact: true })).toBeInViewport();
        await expect(moreRegion.getByText(more.quiet)).toBeInViewport();
        if (width > 700) await expect(moreRegion.getByText(/Правки без тарифа.+1\s500\s₽\/⁠?ч/)).toBeInViewport();

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(width);
    });
}

test('/sites: без движения нижняя часть – обычные блоки целиком', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    const deck = page.getByRole('region', { name: casesDeck.title });
    await expect(deck.locator('a[href^="/portfolio/"]').first()).toBeVisible();
    const pay = page.getByRole('region', { name: payment.title });
    for (const stage of payment.stages) await expect(pay.getByText(stage.range, { exact: true })).toBeVisible();
    // У8: шкалы без подписей нет – суммы и доли только списком
    await expect(pay.locator('span[data-j]')).toHaveCount(0);
    const region = page.getByRole('region', { name: terms.title });
    for (const col of terms.columns) await expect(region.getByRole('heading', { level: 3, name: col.title })).toBeVisible();
    for (const step of projectPath.steps) await expect(page.getByRole('heading', { level: 3, name: step.title })).toBeVisible();
    // Не липкий экран: раздел уходит вверх вместе со страницей
    const heading = pay.getByRole('heading', { level: 2 });
    await heading.scrollIntoViewIfNeeded();
    const before = (await heading.boundingBox())!.y;
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(400);
    expect((await heading.boundingBox())!.y).toBeLessThan(before - 300);
});

// Условия – в FAQ (У5б, этап 3): на компьютере – липкий экран, вопросы приходят по одному, раскрыт один вопрос;
// на телефоне список не влезает в экран – обычный раздел, вопрос въезжает по своему скроллу
test('/sites: FAQ на липком экране – вопросы по одному, раскрыт один', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    const region = page.getByRole('region', { name: sections.faq.title });
    const items = region.locator('details');
    await scrollToScene(page, sections.faq.title, .15);
    await expect(items.first()).toBeInViewport();
    await expect(items.last()).toHaveCSS('opacity', '0');
    await scrollToScene(page, sections.faq.title, -.2);
    await expect(items.last()).toHaveCSS('opacity', '1');
    await expect(items.last()).toBeInViewport();
    await expect(region.getByRole('link', { name: sections.faq.link })).toBeInViewport();
    // Экран держится: заголовок не уехал вверх за время пути
    const heading = region.getByRole('heading', { level: 2 });
    await expect(heading).toBeInViewport();
    // Раскрыт один: открыли третий – первый закрылся
    await items.nth(2).locator('summary').click();
    await expect(items.nth(2)).toHaveAttribute('open', '');
    await expect(items.first()).not.toHaveAttribute('open', '');
    // Ниже – финал
    await expect(page.getByRole('region', { name: sections.cta.title })).toBeAttached();
});

test('/sites: FAQ на телефоне – по своему скроллу, без прокрутки вбок', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/sites');
    // FAQ меряет, вмещается ли он в экран, и перестраивается из сцены в обычный раздел – ждём, пока уляжется
    // (без паузы в Edge вопросы успевали смениться между поиском и прокруткой)
    await page.waitForTimeout(800);
    const region = page.getByRole('region', { name: sections.faq.title });
    await expect(region.locator('details')).toHaveCount(faq.length);
    const last = region.locator('details').last();
    await last.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1300);
    await expect(last).toHaveCSS('opacity', '1');
    // Не липкий экран: раздел уходит вверх вместе со страницей
    const heading = region.getByRole('heading', { level: 2 });
    await heading.scrollIntoViewIfNeeded();
    const before = (await heading.boundingBox())!.y;
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(400);
    expect((await heading.boundingBox())!.y).toBeLessThan(before - 300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('/sites: FAQ без движения – обычный аккордеон, все вопросы видны', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    const region = page.getByRole('region', { name: sections.faq.title });
    await region.scrollIntoViewIfNeeded();
    for (const item of faq) await expect(region.getByText(item.question)).toBeVisible();
    await expect(region.locator('details').first()).toHaveAttribute('open', '');
    // Можно раскрыть несколько
    await region.locator('details').nth(3).locator('summary').click();
    await expect(region.locator('details').first()).toHaveAttribute('open', '');
});

// ---------- Телефон и планшет (У5б, этап 4) ----------
type Box = { x: number, y: number, width: number, height: number };
const overlap = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// Вкладки на телефоне (У5б, 5в): названия видов целиком – длинное переносится, за край экрана ничего не выходит;
// так же без движения (там у каждого вида своё окно – смотрим первое)
for (const reduce of [false, true]) {
    test(`/sites: вкладки на телефоне – названия целиком, в пределах экрана${reduce ? ', без движения' : ''}`, async ({ page }) => {
        if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/sites#shop');
        await page.waitForTimeout(1500);
        const links = tabs(page).first().getByRole('link');
        for (let i = 0; i < 3; i++) {
            const link = links.nth(i);
            await link.scrollIntoViewIfNeeded();
            const box = (await link.boundingBox())!;
            expect(box.width).toBeGreaterThan(44);
            expect(box.height).toBeGreaterThanOrEqual(34);
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(375);
            // Подпись не обрезана: текст не шире своей коробки, без многоточия
            const whole = await link.locator('span').evaluate((el) => el.scrollWidth <= el.clientWidth + 1 && getComputedStyle(el).textOverflow !== 'ellipsis');
            expect(whole).toBe(true);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
}

// Низкий телефон: таблетки сайта компании уступают окно счётчику суммы, а не прячутся под ним
test('/sites: низкий телефон – счётчик суммы не ложится на таблетки', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/sites');
    const corp = planFor(true).kinds[1];
    await scrollToTime(page, (corp.priced + corp.to) / 2, true);
    const figure = page.locator('figure');
    await expect(figure.getByText(build.corporate.sum!.caption)).toBeVisible();
    for (const pill of build.corporate.pills) await expect(figure.locator('li', { hasText: label(pill.label) }).first()).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

// Ноутбук с низким окном: панель магазина не закрывает «Заказ оплачен»
test('/sites: низкое окно – панель магазина не закрывает «Заказ оплачен»', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/sites');
    const shop = planFor(false).kinds[2];
    await scrollToTime(page, (shop.priced + shop.to) / 2);
    const paid = page.locator('figure').getByText(buildUi.paid);
    await expect(paid).toHaveCSS('opacity', '1');
    const panel = page.locator('figure [class*="panelOrders"]');
    expect(overlap((await paid.boundingBox())!, (await panel.boundingBox())!)).toBe(false);
});

// Телефон лёжа: окно слева на всю высоту, строка с ценой – справа; колода – обычной сеткой
test('/sites: телефон лёжа – окно рядом со строкой, колода сеткой', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.goto('/sites');
    const landing = planFor(false).kinds[0];
    await scrollToTime(page, (landing.priced + landing.to) / 2);
    const win = (await page.locator('figure').boundingBox())!;
    const price = page.locator('section[aria-labelledby="landing-title"]');
    await expect(price.getByRole('link', { name: `${servicesButton}: Лендинг` })).toBeInViewport();
    expect((await price.boundingBox())!.x).toBeGreaterThan(win.x + win.width);
    expect(win.y).toBeGreaterThanOrEqual(0);
    expect(win.y + win.height).toBeLessThanOrEqual(375);
    // Колода не липкая: заголовок уходит вверх вместе со страницей, все кейсы – ссылками
    const deck = page.getByRole('region', { name: casesDeck.title });
    const heading = deck.getByRole('heading', { level: 2 });
    await heading.scrollIntoViewIfNeeded();
    const before = (await heading.boundingBox())!.y;
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    expect((await heading.boundingBox())!.y).toBeLessThan(before - 200);
    await expect(deck.locator('a[href^="/portfolio/"]')).toHaveCount(await deck.locator('li').count());
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(812);
});

// Телефон лёжа (У5б, 5в): кадр нижних сцен не встаёт в экран – обычные разделы, как колода и FAQ: заголовок уходит
// вверх вместе со страницей, шаги и колонки – целиком
test('/sites: телефон лёжа – нижние сцены обычными разделами', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.goto('/sites');
    await page.waitForTimeout(800);
    for (const title of [projectPath.title, payment.title, terms.title, sections.more.title]) {
        const heading = page.getByRole('region', { name: title }).getByRole('heading', { level: 2 });
        await heading.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const before = (await heading.boundingBox())!.y;
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(500);
        expect((await heading.boundingBox())!.y).toBeLessThan(before - 200);
    }
    for (const step of projectPath.steps) await expect(page.getByRole('heading', { level: 3, name: step.title })).toBeVisible();
    for (const col of terms.columns) await expect(page.getByRole('heading', { level: 3, name: col.title })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(812);
});

// Без движения на телефоне: по каждому виду – окно, цена и кнопка, ничего не уходит вбок
test('/sites: без движения на телефоне – виды обычными блоками', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/sites');
    for (const service of sites) {
        const section = page.locator(`section#${service.id}`);
        await section.getByRole('heading', { level: 2 }).scrollIntoViewIfNeeded();
        await expect(section.locator('figure')).toBeVisible();
        await expect(section.getByRole('link', { name: `${servicesButton}: ${service.title}` })).toBeVisible();
    }
    // Счётчик суммы виден, таблетки из-под него не торчат (они перечислены под окном)
    const corp = page.locator('section#corporate');
    await expect(corp.locator('figure').getByText(build.corporate.sum!.caption)).toBeVisible();
    for (const pill of build.corporate.pills) await expect(corp.getByText(sitesDetails.corporate.options[pill.option].title, { exact: false }).last()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

// Непрозрачность элемента с учётом предков
const opacityOf = (el: Element) => {
    let op = 1;
    for (let n: Element | null = el; n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
    return op;
};

// С клавиатуры (У5б, 5в): после вкладок окна Tab ведёт по «Узнать цену» трёх видов – сцена доезжает до цены вида,
// кнопка видна; дальше – в карточку колоды, колода доезжает до неё, фокус не теряется
test('/sites: Tab из вкладок окна – «Узнать цену» по видам, потом карточка колоды', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto('/sites');
    await page.waitForTimeout(800);
    await tabs(page).getByRole('link', { name: 'Магазин или каталог' }).focus();
    for (const service of sites) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(2000);
        const focused = page.locator(':focus');
        await expect(focused).toHaveAccessibleName(`${servicesButton}: ${service.title}`);
        await expect(focused).toBeInViewport();
        await expect.poll(() => focused.evaluate(opacityOf)).toBeGreaterThan(.95);
    }
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);
    const card = page.locator(':focus');
    await expect(card).toHaveAttribute('href', /^\/portfolio\//);
    await expect(card).toBeInViewport();
    await expect.poll(() => card.evaluate(opacityOf)).toBeGreaterThan(.95);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(800);
    await expect(page.locator(':focus')).toHaveAttribute('href', /^\/portfolio\//);
});

// Shift+Tab с вкладок окна на кнопки первого экрана, когда он уже ушёл вверх, – сцена возвращается к началу
test('/sites: Shift+Tab к первому экрану – он снова виден', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    const corp = planFor(false).kinds[1];
    await scrollToTime(page, corp.from + .3);
    await tabs(page).getByRole('link', { name: 'Лендинг' }).focus();
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(2000);
    const focused = page.locator(':focus');
    await expect(focused).toContainText(head.tg);
    await expect(focused).toBeInViewport();
    await expect.poll(() => focused.evaluate(opacityOf)).toBeGreaterThan(.95);
});

// FAQ на липком экране: фокус на вопросе раньше, чем пришёл список, – сцена доезжает до кадра, где все вопросы стоят
test('/sites: FAQ с клавиатуры – вопрос с фокусом виден', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    await scrollToScene(page, sections.faq.title, .02);
    const region = page.getByRole('region', { name: sections.faq.title });
    await region.getByRole('link', { name: sections.faq.link }).focus();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);
    const summary = region.locator('summary').first();
    await expect(summary).toBeFocused();
    await expect(summary).toBeInViewport();
    await expect.poll(() => summary.evaluate(opacityOf)).toBeGreaterThan(.95);
    await expect.poll(() => region.locator('details').last().evaluate(opacityOf)).toBeGreaterThan(.95);
});

// Первые остановки Tab видны (DESIGN_FIXES_7_PLAN Д39, владелец 10.11.2026): ссылка «к содержимому»,
// затем «›» шапки – в фокусе она не гаснет и панель не выезжает
test('/sites: первые остановки Tab – «к содержимому» и видимая «Открыть панель»', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    await page.waitForTimeout(800);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText(skipToContent);
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveAccessibleName('Открыть панель');
    await page.waitForTimeout(600);
    await expect(focused).toHaveAttribute('aria-expanded', 'false');
    await expect(focused).toBeInViewport();
    await expect.poll(() => focused.evaluate(opacityOf)).toBeGreaterThan(.95);
});

// Финал (У5б, 5б): пока FAQ – липкий экран, финал – липкая сцена со стыком от FAQ, как CtaScene на /ai. Экран финала
// встаёт в кадре, где FAQ отпускает скролл: нижняя линия списка остаётся на нём (у списка рамка прячется), стягивается
// в шарик, шарик делится на кнопки. Телефон, низкое окно и «уменьшить движение» – обычный раздел
const ctaScene = async (page: Page) => page.evaluate(() => {
    const sec = document.querySelector<HTMLElement>('[data-cta-scene]');
    return sec ? { top: sec.getBoundingClientRect().top + window.scrollY, h: sec.offsetHeight, screen: window.innerHeight } : null;
});

test('/sites: финал – сцена со стыком от FAQ, кнопки собираются из линии', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    await page.waitForTimeout(800);
    const scene = (await ctaScene(page))!;
    expect(scene).not.toBeNull();
    const list = page.getByRole('region', { name: sections.faq.title }).locator('details').first().locator('..');
    const final = page.getByRole('region', { name: sections.cta.title });
    const primary = final.getByRole('link', { name: head.cta });

    // Кадр стыка: линия списка FAQ перешла на экран финала – у списка рамка прозрачная, копия лежит на её месте.
    // Сцены выше досчитывают длины ~1,5 с после загрузки, и верх финала сдвигается на 1–2px; за стыком копия стоит,
    // а список уходит со скроллом, поэтому прокрутка – на 1px за стык от верха после того, как он перестал меняться
    // (Д41: при +2px от раннего замера исход зависел от дробной части позиции сцены)
    await expect.poll(async () => {
        const before = (await ctaScene(page))!.top;
        await page.waitForTimeout(300);
        return Math.abs((await ctaScene(page))!.top - before);
    }).toBeLessThan(.05);
    const settled = (await ctaScene(page))!;
    await page.evaluate((y) => window.scrollTo(0, y), Math.ceil(settled.top) + 1);
    await page.waitForTimeout(300);
    await expect(list).toHaveCSS('border-bottom-color', 'rgba(128, 128, 128, 0)');
    const listBottom = (await list.boundingBox())!;
    const line = await page.evaluate(() => {
        const el = [...document.querySelectorAll<HTMLElement>('[data-cta-scene] span[aria-hidden="true"]')]
            .find((s) => getComputedStyle(s).opacity === '1' && s.offsetHeight < 4);
        const r = el?.getBoundingClientRect();
        return r ? { y: r.top + r.height / 2, w: r.width } : null;
    });
    expect(line).not.toBeNull();
    expect(Math.abs(line!.y - (listBottom.y + listBottom.height - .75))).toBeLessThan(3);
    // Кнопки ещё не собрались – не нажимаются, клики проходят к FAQ
    await expect(primary).toHaveCSS('pointer-events', 'none');

    // Конец сцены: FAQ ушёл вверх, заголовок, кнопки и строка на экране, кнопки нажимаются
    await page.evaluate((s) => window.scrollTo(0, s.top + s.h - s.screen - 10), scene);
    await page.waitForTimeout(1300);
    const title = final.getByRole('heading', { level: 2 });
    await expect(title).toBeInViewport();
    await expect(primary).toBeInViewport();
    await expect(primary).toHaveCSS('pointer-events', 'auto');
    await expect(final.getByText(sections.cta.text)).toHaveCSS('opacity', '1');
    expect((await list.boundingBox())!.y + (await list.boundingBox())!.height).toBeLessThan((await title.boundingBox())!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1400);

    // Обратно вверх – линия вернулась к списку
    await page.evaluate((y) => window.scrollTo(0, y), scene.top - 300);
    await page.waitForTimeout(300);
    await expect(list).not.toHaveCSS('border-bottom-color', 'rgba(128, 128, 128, 0)');
});

test('/sites: финал с клавиатуры – Tab до кнопок доводит сцену до собранных кнопок', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/sites');
    await page.waitForTimeout(800);
    const scene = (await ctaScene(page))!;
    await page.evaluate((y) => window.scrollTo(0, y), scene.top + 2);
    await page.waitForTimeout(300);
    const primary = page.getByRole('region', { name: sections.cta.title }).getByRole('link', { name: head.cta });
    await primary.focus();
    await page.waitForTimeout(2000);
    await expect(primary).toBeFocused();
    await expect(primary).toBeInViewport();
    await expect(primary).toHaveCSS('pointer-events', 'auto');
});

for (const [width, height, reduce] of [[375, 812, false], [1400, 900, true]] as const) {
    test(`/sites: финал обычным разделом, ${width}${reduce ? ', без движения' : ''}`, async ({ page }) => {
        if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.setViewportSize({ width, height });
        await page.goto('/sites');
        await page.waitForTimeout(800);
        expect(await ctaScene(page)).toBeNull();
        const final = page.getByRole('region', { name: sections.cta.title });
        await final.scrollIntoViewIfNeeded();
        await expect(final.getByRole('link', { name: head.cta })).toBeInViewport();
        await expect(final.getByRole('link', { name: head.tg })).toBeVisible();
        await expect(final.getByText(sections.cta.text)).toBeVisible();
    });
}
