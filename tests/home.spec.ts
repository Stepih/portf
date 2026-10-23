import { expect, test } from '@playwright/test';
import { hiddenPages } from '../src/constants/urls';
import { contactTitle, formButton, heroPrice, heroTitleSlide, moreLinks, moreTitle, offerFaq, offerTgButton, offerTitle } from '../src/data/offer';

// Слайды первого экрана сменяются, а h1 с оффером в HTML один и есть всегда (SALES_PLAN 3.1.1).
// Первым показывается слайд с h1 (CONVERSION_PLAN К1.1): проверяем по HTML с сервера, до смены слайда
test('на главной один h1 с оффером, черта переключает слайд', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(offerTitle);

    const html = await (await page.request.get('/')).text();
    expect(html).toMatch(/<h1[^>]*class="[^"]*active/);
    expect(html).toMatch(new RegExp(`aria-label="Слайд ${heroTitleSlide + 1}" aria-current="true"`));

    const third = page.getByRole('button', { name: 'Слайд 3' });
    await third.click();
    await expect(third).toHaveAttribute('aria-current', 'true');
});

// Кнопка формы и цена видны на первом экране без прокрутки, и на телефоне тоже (DESIGN_FIXES_PLAN Д2)
for (const viewport of [{ width: 1400, height: 800 }, { width: 375, height: 667 }]) {
    test(`призыв и цена на первом экране, ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');

        const hero = page.getByRole('region', { name: offerTitle });
        // Вторая такая ссылка – у отраслей ниже, она появляется по скроллу
        const button = hero.getByRole('link', { name: formButton }).first();
        await expect(button).toBeInViewport({ ratio: 1 });
        await expect(hero.getByText(heroPrice)).toBeInViewport({ ratio: 1 });

        await button.click();
        await expect(page).toHaveURL(/\/popup$/);
    });
}

// Чип отрасли ведёт в подборку портфолио (SALES_PLAN 3.2). Чипы вылетают из кружка по скроллу,
// когда первый экран раскрылся: к 0,85 экрана брызги доиграли, портал ещё не начался
test('чип отрасли открывает портфолио с фильтром', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * .85));

    const chips = page.getByRole('region', { name: 'Каким может быть сайт для вашего бизнеса' }).getByRole('listitem').getByRole('link');
    await expect(chips.first()).toBeVisible();

    const href = await chips.first().getAttribute('href');
    expect(href).toMatch(/^\/portfolio\?for=[a-z0-9]+$/);

    await chips.first().click();
    await expect(page).toHaveURL(href!);
    await expect(page.getByRole('button', { pressed: true })).not.toHaveText(/^Все/);
});

// Избранные кейсы ведут на страницы кейсов, кнопка – на всё портфолио (SALES_PLAN 3.3).
// Кейсы открываются порталом из первого экрана: до него они спрятаны, к 1,8 экрана колода уже раздана
test('избранные кейсы на главной', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.8));

    const section = page.getByRole('region', { name: 'Избранные кейсы' });
    const cases = section.getByRole('heading', { level: 3 }).getByRole('link');
    await expect(cases).toHaveCount(3);
    await expect(cases.first()).toHaveAttribute('href', /^\/portfolio\/[a-z0-9]+$/);

    await section.getByRole('link', { name: 'Все работы' }).click();
    await expect(page).toHaveURL(/\/portfolio$/);
});

// Видимость с учётом прозрачности предков: toBeVisible прозрачные элементы считает видимыми
const opacityOf = (el: Element) => {
    let op = 1;
    for (let n: Element | null = el; n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
    return op;
};

// Клавиатура (DESIGN_FIXES_PLAN Д3): Tab доходит до чипов и кейсов, сцена сама прокручивается туда, где они видны
for (const viewport of [{ width: 1400, height: 900 }, { width: 375, height: 812 }]) {
    test(`Tab доходит до чипа и кейса, ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');

        const chip = page.getByRole('region', { name: 'Каким может быть сайт для вашего бизнеса' }).getByRole('listitem').getByRole('link').first();
        const firstCase = page.getByRole('region', { name: 'Избранные кейсы' }).getByRole('heading', { level: 3 }).getByRole('link').first();

        for (const target of [chip, firstCase]) {
            for (let i = 0; i < 30 && !(await target.evaluate((el) => el === document.activeElement)); i++) {
                await page.keyboard.press('Tab');
            }
            await expect(target).toBeFocused();
            await expect(target).toBeInViewport();
            await expect.poll(() => target.evaluate(opacityOf)).toBeGreaterThan(.95);
        }
    });
}

// «Уменьшить движение»: статичная вёрстка без ошибки гидрации (DESIGN_FIXES_PLAN Д3)
test.describe('уменьшить движение', () => {
    test.use({ reducedMotion: 'reduce' });

    test('главная без ошибок гидрации, чипы видны без сцены', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (m) => { if (m.type() === 'error' && /hydrat/i.test(m.text())) errors.push(m.text()); });
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto('/', { waitUntil: 'networkidle' });

        const chip = page.getByRole('region', { name: 'Каким может быть сайт для вашего бизнеса' }).getByRole('listitem').getByRole('link').first();
        await chip.scrollIntoViewIfNeeded();
        await expect.poll(() => chip.evaluate(opacityOf)).toBe(1);
        expect(errors).toEqual([]);
    });
});

// Карточки услуг с ценой, кнопка «Узнать цену» ведёт в форму с услугой (SALES_PLAN 3.4)
test('услуги и цены на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Услуги и цены' });
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(4);
    await expect(section.getByText('от 8 000 ₽')).toBeVisible();

    const discuss = section.getByRole('link', { name: 'Узнать цену: Лендинг' });
    await expect(discuss).toHaveAttribute('href', '/popup?service=landing');
    await discuss.click();
    await expect(page).toHaveURL(/\/popup\?service=landing$/);
});

// Шаги работы списком по порядку (SALES_PLAN 3.5)
test('как я работаю на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Как я работаю' });
    const steps = section.getByRole('listitem');
    await expect(steps).toHaveCount(5);
    await expect(steps.first().getByRole('heading', { level: 3 })).toHaveText('Созвон');
});

// Шесть причин списком, первая – «Один исполнитель» (SALES_PLAN 3.6)
test('почему я на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Почему я' });
    const reasons = section.getByRole('listitem');
    await expect(reasons).toHaveCount(6);
    await expect(reasons.first().getByRole('heading', { level: 3 })).toHaveText('Один исполнитель');
});

// FAQ на <details>: первый вопрос раскрыт, клик раскрывает следующий (SALES_PLAN 3.8)
test('FAQ на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Что спрашивают перед заказом' });
    const items = section.locator('details');
    await expect(items).toHaveCount(offerFaq.length);
    await expect(items.first()).toHaveAttribute('open', '');
    await expect(items.nth(1)).not.toHaveAttribute('open');

    await items.nth(1).locator('summary').click();
    await expect(items.nth(1)).toHaveAttribute('open', '');
    await expect(items.nth(1).getByText(offerFaq[1].answer)).toBeVisible();
});

// Финальный блок: форма прямо на главной и Telegram рядом (SALES_PLAN 3.9)
test('форма заявки и Telegram на главной', async ({ page }) => {
    const requests: unknown[] = [];
    await page.route('**/api/sendMessage', route => {
        requests.push(route.request().postDataJSON());
        return route.fulfill({ status: 200, json: { message: 'ok' } });
    });
    await page.goto('/');

    const section = page.getByRole('region', { name: contactTitle });
    await expect(section.getByRole('link', { name: offerTgButton.title })).toHaveAttribute('href', offerTgButton.href);

    await section.getByPlaceholder('Имя *').fill('Иван');
    await section.getByPlaceholder('Телефон *').fill('79990001122');
    await section.getByRole('button', { name: formButton }).click();

    await expect(section.getByRole('button', { name: 'Отправлено!' })).toBeVisible();
    expect(requests).toHaveLength(1);
});

// Музыка, медиа и канал с работами – внизу, после формы (SALES_PLAN 3.10)
test('блок «А ещё я…» внизу главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: moreTitle });
    const links = section.getByRole('link');
    await expect(links).toHaveCount(moreLinks.length);
    await expect(links.last()).toHaveAttribute('target', '_blank');
    for (const path of hiddenPages) await expect(section.locator(`a[href="${path}"]`)).toHaveCount(0);

    const internal = moreLinks.find(link => link.href.startsWith('/'));
    if (!internal) return;
    await section.getByRole('link', { name: internal.title }).click();
    await expect(page).toHaveURL(new RegExp(`${internal.href}$`));
});
