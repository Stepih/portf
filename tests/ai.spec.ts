import { expect, test, type Page } from '@playwright/test';
import { collectErrors } from './errors';
import { deckAgents, faq, ph } from '../src/data/aiPage';
import { offerTgButton } from '../src/data/offer';
import { chatPlaceholder, chatTitle } from '../src/data/chat';
import { contactHref } from '../src/scripts/services';

// Страница /ai (SERVICES_PLAN У4). /api/chat подменён: к модели ничего не уходит
const ANSWER = 'Агент для звонков проверяем на недельном пилоте.';

// Сцены завязаны на скролл: проходим страницу целиком шагами по полэкрана
const scrollThrough = async (page: Page) => {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = (page.viewportSize()?.height ?? 800) / 2;
    for (let y = 0; y <= height; y += step) {
        await page.mouse.wheel(0, step);
        await page.waitForTimeout(30);
    }
    await page.waitForTimeout(500);
};

test('/ai отвечает 200, закрыта от поиска и не пишет ошибок в консоль на всём скролле', async ({ page }) => {
    const errors = collectErrors(page);

    const response = await page.goto('/ai');
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await scrollThrough(page);

    expect(errors).toEqual([]);
});

test('/ai: в финале – ссылка на форму и Telegram в новой вкладке', async ({ page }) => {
    await page.goto('/ai');
    const final = page.locator('section[aria-labelledby="final-title"]');

    await expect(final.getByRole('link', { name: ph.cta })).toHaveAttribute('href', contactHref());
    const tg = final.getByRole('link', { name: ph.tg });
    await expect(tg).toHaveAttribute('href', offerTgButton.href);
    await expect(tg).toHaveAttribute('target', '_blank');
});

test('/ai: вопрос во встроенном чате уходит в /api/chat, ответ виден', async ({ page }) => {
    const requests: string[] = [];
    await page.route('**/api/chat', route => {
        requests.push(route.request().postData() ?? '');
        return route.fulfill({ status: 200, body: ANSWER, contentType: 'text/plain; charset=utf-8' });
    });
    await page.goto('/ai');

    // Чат неактивен (inert), пока сцена не дошла до него (после «агента за работой», ~10 тыс. px): листаем, пока не откроется
    const chat = page.getByRole('region', { name: chatTitle });
    for (let i = 0; i < 200 && await chat.getAttribute('inert') !== null; i++) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(50);
    }
    await expect(chat).not.toHaveAttribute('inert', /.*/);
    const input = chat.getByRole('textbox', { name: chatPlaceholder });
    await input.fill('Что агент сделает со звонками?');
    await input.press('Enter');

    await expect(page.getByText(ANSWER)).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(JSON.parse(requests[0]).messages).toEqual([{ role: 'user', content: 'Что агент сделает со звонками?' }]);
});

// Б1: в покое панель чата лежала поверх кнопки шара и перехватывала клик
test('/ai: клик по шару докручивает до чата', async ({ page }) => {
    await page.goto('/ai');
    const box = await page.getByRole('button', { name: ph.orbLabel }).boundingBox();
    expect(box).not.toBeNull();
    // Настоящий клик мышью в центр шара: шар всё время «дышит», locator.click не дождётся неподвижности
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(page.getByRole('region', { name: chatTitle })).not.toHaveAttribute('inert', /.*/);
});

// Б2: при быстром переходе (ползунок, End) таблица «Каждый месяц» не дотиралась – нижнее пояснение висело в сетке
// «Что входит». Прыгаем за стык и ждём, пока сцены успокоятся: все пояснения обрезаны линией Terms
test('/ai: после прыжка за стык «Каждый месяц» → «Что входит» таблица стёрта целиком', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/ai');
    // Сцены раскладываются после гидрации: ждём, пока «Что входит» встанет ниже сцен первого экрана
    const terms = page.locator('section[aria-labelledby="terms-title"]');
    const topOf = () => terms.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    await expect.poll(topOf).toBeGreaterThan(5000);
    await page.evaluate((y) => window.scrollTo(0, y), await topOf() + 900);

    const notes = page.locator('section[aria-labelledby="monthly-title"] ul');
    const hidden = () => notes.evaluate((ul) => {
        const layout = ul.parentElement!;
        const m = getComputedStyle(layout).clipPath.match(/^inset\(([\d.]+)px/);
        const cut = m ? layout.getBoundingClientRect().top + Number(m[1]) : -Infinity;
        return [...ul.children].every((li) => li.getBoundingClientRect().bottom <= cut + 1);
    });
    await expect.poll(hidden, { timeout: 5000 }).toBe(true);
});

// SERVICES_PLAN У4: у /ai своя картинка-превью, а не общая картинка сайта
test('/ai: своё превью ссылки (Open Graph)', async ({ page }) => {
    await page.goto('/ai');
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(new URL(image!).pathname).toBe('/ai/opengraph-image');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /ИИ-агенты/);

    const response = await page.request.get(new URL(image!).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
});

test.describe('уменьшить движение', () => {
    test.use({ reducedMotion: 'reduce' });

    test('/ai: карточки агентов и вопросы FAQ видны без анимации', async ({ page }) => {
        const errors = collectErrors(page);
        await page.goto('/ai');
        await scrollThrough(page);

        for (const agent of deckAgents) {
            const title = page.getByText(agent.title, { exact: true }).first();
            await title.scrollIntoViewIfNeeded();
            await expect(title).toBeVisible();
        }
        for (const item of faq) {
            const question = page.getByText(item.question, { exact: true });
            await question.scrollIntoViewIfNeeded();
            await expect(question).toBeVisible();
            // Прозрачность 0 Playwright считает видимым – проверяем её отдельно
            expect(Number(await question.evaluate(el => getComputedStyle(el).opacity))).toBeGreaterThan(.9);
        }
        expect(errors).toEqual([]);
    });
});
