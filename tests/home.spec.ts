import { expect, test } from '@playwright/test';
import { hiddenPages } from '../src/constants/urls';
import { contactTitle, formButton, heroPrice, heroTitleSlide, moreLinks, moreTitle, offerFaq, offerSteps, offerTgButton, offerTitle, services, servicesTitle } from '../src/data/offer';
import { formServiceLabel, formSuccessText, formSuccessTitle, phoneTooShort } from '../src/data/inputsFeedBack';
import { chatFabLabel, chatLeadOpen, chatLeadSuccess } from '../src/data/chat';
import { footerName, footerSince, footerTg } from '../src/data/footer';
import { serviceLines } from '../src/scripts/services';

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

        // Форма – на главной, прыжок мимо сцены, фокус на заголовке формы (DESIGN_FIXES_3_PLAN Д13)
        await button.click();
        await expect(page).toHaveURL(/\/#contact$/);
        const title = page.getByRole('heading', { name: contactTitle });
        await expect(title).toBeFocused();
        await expect(title).toBeInViewport();
        await expect(page.locator('#contact')).not.toContainText(formServiceLabel);
    });
}

// Чип отрасли ведёт в подборку портфолио (SALES_PLAN 3.2). Чипы вылетают из кружка по скроллу,
// когда первый экран раскрылся: к 0,75 экрана брызги доиграли, портал ещё не начался
test('чип отрасли открывает портфолио с фильтром', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * .75));

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

    // Без сцены прыжок тот же: кнопка первого экрана – к форме главной (DESIGN_FIXES_3_PLAN Д13)
    test('кнопка первого экрана ведёт к форме', async ({ page }) => {
        await page.goto('/');
        const button = page.getByRole('region', { name: offerTitle }).getByRole('link', { name: formButton }).first();
        // До гидрации клик – обычный переход по якорю, без фокуса: ждём обработчик React
        await expect.poll(() => button.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps')))).toBe(true);
        await button.click();
        await expect(page).toHaveURL(/\/#contact$/);
        await expect(page.getByRole('heading', { name: contactTitle })).toBeFocused();
        await expect(page.getByRole('heading', { name: contactTitle })).toBeInViewport();
    });

    // Хук reduced-motion включается после монтирования: текст кейса не должен остаться за маской с transform первого рендера
    test('текст кейсов виден без анимации', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });

        const cases = page.getByRole('region', { name: 'Избранные кейсы' });
        const title = cases.getByRole('heading', { level: 3 }).getByRole('link').first();
        const tag = cases.getByRole('listitem').first();
        await title.scrollIntoViewIfNeeded();

        const shifted = (el: Element) => {
            for (let n: Element | null = el; n && n.tagName !== 'ARTICLE'; n = n.parentElement) {
                const t = getComputedStyle(n).transform;
                if (t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)') return true;
            }
            return false;
        };
        await expect.poll(() => title.evaluate(shifted)).toBe(false);
        await expect.poll(() => tag.evaluate(opacityOf)).toBe(1);
    });
});

// Карточки услуг с ценой, кнопка «Узнать цену» ведёт в форму главной с услугой (SALES_PLAN 3.4, DESIGN_FIXES_3_PLAN Д13):
// строка услуги в форме, фокус на заголовке, услуга уходит с заявкой
test('услуги и цены на главной', async ({ page }) => {
    const requests: Record<string, unknown>[] = [];
    await page.route('**/api/sendMessage', route => {
        requests.push(route.request().postDataJSON());
        return route.fulfill({ status: 200, json: { message: 'ok' } });
    });
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Услуги и цены' });
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(4);
    await expect(section.getByText('от 8 000 ₽')).toBeVisible();

    const discuss = section.getByRole('link', { name: 'Узнать цену: Лендинг' });
    await expect(discuss).toHaveAttribute('href', '/?service=landing#contact');
    await discuss.click();
    await expect(page).toHaveURL(/\/\?service=landing#contact$/);

    const contact = page.getByRole('region', { name: contactTitle });
    await expect(page.getByRole('heading', { name: contactTitle })).toBeFocused();
    await expect(contact.getByText(`${formServiceLabel} ${serviceLines(services).landing}`)).toBeInViewport();

    // Без перезагрузки и без прыжка сцены: позиция после перехода не меняется
    const y = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);

    // Другая услуга меняет строку
    await section.getByRole('link', { name: 'Узнать цену: Магазин или каталог' }).click();
    await expect(contact.getByText(`${formServiceLabel} ${serviceLines(services).shop}`)).toBeVisible();
    await expect(page).toHaveURL(/\/\?service=shop#contact$/);

    await contact.getByPlaceholder('Имя *').fill('Иван');
    await contact.getByPlaceholder('Телефон *').fill('79990001122');
    await contact.getByRole('button', { name: formButton }).click();
    await expect(contact.getByRole('heading', { name: formSuccessTitle('Иван') })).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ name: 'Иван', service: 'shop' });
});

// Ссылка с услугой из чата или мессенджера открывает главную сразу у формы со строкой услуги (Д13)
test('прямая ссылка /?service=ai#contact – у формы со строкой услуги', async ({ page }) => {
    await page.goto('/?service=ai#contact');

    const contact = page.getByRole('region', { name: contactTitle });
    await expect(contact.getByText(`${formServiceLabel} ${serviceLines(services).ai}`)).toBeVisible();
    await expect(page.getByRole('heading', { name: contactTitle })).toBeInViewport();
});

// «Другая сфера? Обсудить проект» у отраслей – к той же форме главной (Д13)
test('ссылка «Другая сфера» ведёт к форме главной', async ({ page }) => {
    await page.goto('/');
    const other = page.getByRole('region', { name: 'Каким может быть сайт для вашего бизнеса' }).getByRole('link', { name: formButton });
    await expect(other).toHaveAttribute('href', '/#contact');
});

// Шаги работы списком по порядку (SALES_PLAN 3.5). Под каждым этапом – оплата (DESIGN_FIXES_2_PLAN Д5):
// до макета 0 ₽, предоплата – на разработке, остаток – на запуске
test('как я работаю на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Как я работаю' });
    const steps = section.getByRole('listitem');
    await expect(steps).toHaveCount(offerSteps.length);
    await expect(steps.first().getByRole('heading', { level: 3 })).toHaveText('Созвон');

    for (const [i, step] of offerSteps.entries()) {
        await expect(steps.nth(i)).toContainText(`Оплата: ${step.pay.label}`);
    }
    await expect(steps.nth(0)).toContainText('Оплата: 0 ₽');
    await expect(steps.nth(2)).toContainText('Оплата: Предоплата');
    await expect(steps.nth(3)).toContainText('Оплата: Остаток');
});

// Три отличия из PRODUCT.md, без подписи под заголовком (DESIGN_FIXES_2_PLAN Д5)
test('почему я на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Почему я' });
    const reasons = section.getByRole('listitem');
    await expect(reasons).toHaveCount(3);
    await expect(reasons.first().getByRole('heading', { level: 3 })).toHaveText('Предоплата без риска');
    await expect(section.locator(':scope > p')).toHaveCount(0);
});

// Планшет (DESIGN_FIXES_2_PLAN Д10): кейсы в ряду одной высоты, три отличия в одном ряду, а не 2 + 1,
// форма заявки по левому краю, как текст над ней
test('раскладка главной на планшете, 820px', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 900 });
    await page.goto('/');

    // offsetHeight/offsetTop не видят transform колоды
    const cards = page.getByRole('region', { name: 'Избранные кейсы' }).locator('article');
    await expect(cards).toHaveCount(3);
    const heights = await cards.evaluateAll((els) => els.map((el) => (el as HTMLElement).offsetHeight));
    expect(new Set(heights).size).toBe(1);

    const reasons = page.getByRole('region', { name: 'Почему я' }).getByRole('listitem');
    const tops = await reasons.evaluateAll((els) => els.map((el) => (el as HTMLElement).offsetTop));
    expect(new Set(tops).size).toBe(1);

    const contact = page.getByRole('region', { name: 'Давайте обсудим ваш проект' });
    const titleLeft = (await contact.getByRole('heading', { level: 2 }).boundingBox())!.x;
    const formLeft = (await contact.locator('form').boundingBox())!.x;
    expect(Math.abs(formLeft - titleLeft)).toBeLessThan(1);
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

// Единое кольцо фокуса (DESIGN_FIXES_2_PLAN Д8): чернила 2px и голубой ореол – у шапки, черт слайдов, FAQ и кнопок
for (const theme of ['light', 'dark'] as const) {
    test(`одно кольцо фокуса, ${theme === 'light' ? 'светлая' : 'тёмная'} тема`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
        await page.goto('/');

        const ink = theme === 'light' ? 'rgb(19, 19, 19)' : 'rgb(255, 255, 255)';
        const targets = [
            page.locator('header').getByRole('link', { name: 'Telegram' }),
            page.getByRole('button', { name: 'Слайд 2' }),
            page.getByRole('region', { name: 'Что спрашивают перед заказом' }).locator('summary').first(),
            page.getByRole('region', { name: offerTitle }).getByRole('link', { name: formButton }).first(),
        ];

        for (const target of targets) {
            // Фокус из скрипта без кликов мышью Chromium считает видимым
            await target.focus();
            const ring = await target.evaluate((el) => {
                const cs = getComputedStyle(el);
                return { style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor, shadow: cs.boxShadow };
            });
            expect(ring).toMatchObject({ style: 'solid', width: '2px', color: ink });
            expect(ring.shadow).toContain('rgba(119, 199, 234, 0.7)');
        }
    });
}

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

    // Имя с дефисом проходит (DESIGN_FIXES_3_PLAN Д14)
    await section.getByPlaceholder('Имя *').pressSequentially('Анна-Мария');
    await expect(section.getByPlaceholder('Имя *')).toHaveValue('Анна-Мария');
    await section.getByPlaceholder('Телефон *').fill('79990001122');
    await section.getByRole('button', { name: formButton }).click();

    await expect(section.getByRole('heading', { name: formSuccessTitle('Анна-Мария') })).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ name: 'Анна-Мария' });
});

// Плашка вместо формы на главной: что дальше, без кнопки и без ошибки (DESIGN_FIXES_2_PLAN Д6)
test('после заявки на главной – плашка «что дальше»', async ({ page }) => {
    await page.route('**/api/sendMessage', route => route.fulfill({ status: 200, json: { message: 'ok' } }));
    await page.goto('/');

    const section = page.getByRole('region', { name: contactTitle });
    await section.getByPlaceholder('Имя *').fill('Иван');
    await section.getByPlaceholder('Телефон *').fill('123');
    await section.getByRole('button', { name: formButton }).click();
    await expect(page.getByText(phoneTooShort)).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: phoneTooShort })).toHaveCount(1);

    await section.getByPlaceholder('Телефон *').fill('+7 999 123-45-67');
    await section.getByRole('button', { name: formButton }).click();

    await expect(section.getByRole('status')).toContainText(formSuccessText);
    await expect(section.getByRole('button', { name: formButton })).toHaveCount(0);
    await expect(page.getByText('Заполните, пожалуйста, имя и телефон')).toHaveCount(0);
});

// Путь к заявке на телефоне (DESIGN_FIXES_2_PLAN Д7): сцена там короче, цены ближе к началу.
// На 375×800 было 3,57 экрана до «Услуг и цен», на 1400×900 – 2,79 (компьютер не трогали)
for (const { viewport, screens } of [
    { viewport: { width: 375, height: 800 }, screens: 3.25 },
    { viewport: { width: 1400, height: 900 }, screens: 2.85 },
]) {
    test(`услуги и цены не дальше ${screens} экрана, ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');

        const top = await page.getByRole('region', { name: 'Услуги и цены' }).evaluate((el) =>
            (el.getBoundingClientRect().top + window.scrollY) / window.innerHeight);
        expect(top).toBeLessThanOrEqual(screens);
    });
}

// Шов сцены (DESIGN_FIXES_2_PLAN Д9): волна заголовка идёт, пока фото ещё летит в кружок; кольцо портала
// гаснет, а не сжимается в дугу; текст верхней карты колоды виден в дыре сразу, до раздачи
test('сцена без пустых пауз: заголовок, кольцо портала, верхняя карта', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/');
    const scrollTo = (screens: number) => page.evaluate((k) => window.scrollTo(0, window.innerHeight * k), screens);

    // 0,3 экрана: раньше здесь был серый экран с одним кружком
    await scrollTo(.3);
    const title = page.getByRole('heading', { name: 'Каким может быть сайт для вашего бизнеса' });
    // Радиус круга волны, px: заголовок проступает дальше самого кружка
    const waveRadius = () => title.evaluate((el) => {
        const m = getComputedStyle(el.parentElement!).clipPath.match(/circle\(([\d.]+)px/);
        return m ? parseFloat(m[1]) : 0;
    });
    await expect.poll(() => title.evaluate(opacityOf)).toBe(1);
    await expect.poll(waveRadius).toBeGreaterThan(100);

    // Диск портала – слой с радиальным градиентом; к 1,25 экрана кольцо уже погасло
    const diskOpacity = () => page.evaluate(() => {
        const disk = [...document.querySelectorAll<HTMLElement>('section div[aria-hidden="true"]')]
            .find((el) => el.style.background.includes('radial-gradient'));
        return disk ? parseFloat(getComputedStyle(disk).opacity) : -1;
    });
    await scrollTo(1);
    await expect.poll(diskOpacity).toBe(1);
    await scrollTo(1.25);
    await expect.poll(diskOpacity).toBeLessThan(.05);

    // Начало портала: средняя карта – верхняя в колоде, название уже выехало из-под маски
    await scrollTo(1);
    const top = page.getByRole('region', { name: 'Избранные кейсы' }).getByRole('heading', { level: 3 }).nth(1);
    await expect.poll(() => top.evaluate((h) =>
        h.querySelector('a')!.getBoundingClientRect().top - h.getBoundingClientRect().top)).toBeLessThan(3);
});

// Заявка из чата – кнопкой в шапке окна, с первого открытия, без вопросов модели (DESIGN_FIXES_2_PLAN Д7)
test('кнопка «Связаться» в шапке чата открывает заявку до вопросов', async ({ page }) => {
    const asks: unknown[] = [];
    await page.route('**/api/chat', route => {
        asks.push(route.request());
        return route.fulfill({ status: 500 });
    });
    await page.route('**/api/sendMessage', route => route.fulfill({ status: 200, json: { message: 'ok' } }));
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.getByRole('button', { name: chatFabLabel }).click();
    const dialog = page.getByRole('dialog');
    const open = dialog.getByRole('button', { name: chatLeadOpen });
    await expect(open).toBeInViewport({ ratio: 1 });
    await open.click();

    await dialog.getByRole('textbox', { name: 'Имя' }).fill('Иван');
    await dialog.getByRole('textbox', { name: 'Телефон' }).fill('+7 999 000-11-22');
    await dialog.getByRole('button', { name: 'Отправить' }).click();

    await expect(dialog.getByText(chatLeadSuccess)).toBeVisible();
    // Контакт оставлен – кнопка в шапке больше не нужна
    await expect(open).toHaveCount(0);
    expect(asks).toHaveLength(0);
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

// Ритм (DESIGN_FIXES_3_PLAN Д11): после «Все работы» – тот же отступ секции, что между остальными (100px),
// а не ~230px запаса центрирования. Колода к этому месту уже роздана, блок отпущен
for (const viewport of [{ width: 1400, height: 900 }, { width: 820, height: 1000 }]) {
    test(`после кейсов – отступ секции, ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');

        const all = page.getByRole('region', { name: 'Избранные кейсы' }).getByRole('link', { name: 'Все работы' });
        const services = page.getByRole('heading', { level: 2, name: 'Услуги и цены' });
        await services.scrollIntoViewIfNeeded();
        await expect.poll(async () => {
            const a = await all.boundingBox();
            const s = await services.boundingBox();
            return a && s ? Math.round(s.y - (a.y + a.height)) : null;
        }).toBe(100);
    });
}

// Заголовки секций по центру, кроме двухколонной «Давайте обсудим» (DESIGN_FIXES_3_PLAN Д11)
test('заголовки секций главной выровнены по одному правилу', async ({ page }) => {
    await page.goto('/');

    const aligns = await page.locator('main h2').evaluateAll((els) =>
        els.map((el) => ({ text: el.textContent, align: getComputedStyle(el).textAlign })));
    for (const { text, align } of aligns) {
        expect(align, text ?? '').toBe(text === contactTitle ? 'start' : 'center');
    }
});

// Футер (DESIGN_FIXES_3_PLAN Д11): годы через «–» без сегодняшней даты и ссылка на Telegram, на всех страницах
for (const path of ['/', '/portfolio', '/popup']) {
    test(`футер: годы и Telegram, ${path}`, async ({ page }) => {
        await page.goto(path);

        const footer = page.getByRole('contentinfo');
        await expect(footer).toContainText(`© ${footerSince}–${new Date().getFullYear()} ${footerName}`);
        await expect(footer).not.toContainText(new Date().toLocaleDateString('ru-RU'));
        const tg = footer.getByRole('link', { name: footerTg.title });
        await expect(tg).toHaveAttribute('href', footerTg.href);
        await expect(tg).toHaveAttribute('target', '_blank');
    });
}

// Плашки – матовое стекло 8% серого в обеих темах: светлую заливку в тёмной теме владелец отклонил (DESIGN_FIXES_3_PLAN Д12)
for (const [theme, frost] of [['light', 'rgba(57, 57, 57, 0.08)'], ['dark', 'rgba(57, 57, 57, 0.08)']] as const) {
    test(`плашки услуг и формы, ${theme === 'light' ? 'светлая' : 'тёмная'} тема`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
        await page.goto('/');

        const card = page.getByRole('region', { name: servicesTitle }).locator('li').first();
        const form = page.locator('#contact form');
        for (const plaque of [card, form]) {
            await expect.poll(() => plaque.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(frost);
        }
    });
}
