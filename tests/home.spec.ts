import { expect, Locator, Page, test } from '@playwright/test';
import { ServiceId } from '../src/interfaces/offer';
import { hiddenPages } from '../src/constants/urls';
import { contactTitle, faqContactLink, industriesOtherQuestion, industryChipCount, faqTitle, formButton, heroPrice, heroTitleSlide, moreLinks, moreTitle, offerButtonsNote, offerFaq, offerReasons, offerSteps, offerTgButton, offerTitle, offerTrustLine, services, servicesTitle, stepsContactLink } from '../src/data/offer';
import { contactIncomplete, formSuccessText, formSuccessTitle, inputsListFeedback } from '../src/data/inputsFeedBack';
import { chatButtonText, chatButtonTitle, chatFabLabel, chatLeadOpen, chatLeadSuccess } from '../src/data/chat';
import { footerName, footerSince, footerTg } from '../src/data/footer';

// Выбранный чип типа проекта в форме (SALES_PLAN 4.2): услуга из ссылки «Узнать цену»
const pickedService = (form: Locator) => form.locator('[aria-pressed=true]');
const serviceTitle = (id: ServiceId) => services.find((service) => service.id === id)?.title ?? id;

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
        await expect(pickedService(page.locator('#contact'))).toHaveCount(0);
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

    const section = page.getByRole('region', { name: 'Лучшие проекты' });
    const cases = section.getByRole('heading', { level: 3 }).getByRole('link');
    await expect(cases).toHaveCount(3);
    await expect(cases.first()).toHaveAttribute('href', /^\/portfolio\/[a-z0-9]+$/);

    await section.getByRole('link', { name: 'Все проекты' }).click();
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
        const firstCase = page.getByRole('region', { name: 'Лучшие проекты' }).getByRole('heading', { level: 3 }).getByRole('link').first();

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

        const cases = page.getByRole('region', { name: 'Лучшие проекты' });
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
// услуга выбрана в чипах формы (SALES_PLAN 4.2), фокус на заголовке, услуга уходит с заявкой
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
    await expect(pickedService(contact)).toHaveText(serviceTitle('landing'));
    await expect(pickedService(contact)).toBeInViewport();

    // Без перезагрузки и без прыжка сцены: позиция после перехода не меняется
    const y = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);

    // Другая услуга меняет выбранный чип
    await section.getByRole('link', { name: 'Узнать цену: Магазин или каталог' }).click();
    await expect(pickedService(contact)).toHaveText(serviceTitle('shop'));
    await expect(page).toHaveURL(/\/\?service=shop#contact$/);

    await contact.getByPlaceholder('Имя *').fill('Иван');
    await contact.getByPlaceholder('Телефон или Telegram *').fill('79990001122');
    await contact.getByRole('button', { name: formButton }).click();
    await expect(contact.getByRole('heading', { name: formSuccessTitle('Иван') })).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ name: 'Иван', service: 'shop' });
});

// Ссылка с услугой из чата или мессенджера открывает главную сразу у формы с выбранной услугой (Д13, 4.2)
test('прямая ссылка /?service=ai#contact – у формы с выбранной услугой', async ({ page }) => {
    await page.goto('/?service=ai#contact');

    const contact = page.getByRole('region', { name: contactTitle });
    await expect(pickedService(contact)).toHaveText(serviceTitle('ai'));
    await expect(page.getByRole('heading', { name: contactTitle })).toBeInViewport();
});

// «Другая сфера? Обсудить проект» у отраслей – к той же форме главной (Д13)
test('ссылка «Другая сфера» ведёт к форме главной', async ({ page }) => {
    await page.goto('/');
    const other = page.getByRole('region', { name: 'Каким может быть сайт для вашего бизнеса' }).getByRole('link', { name: formButton });
    await expect(other).toHaveAttribute('href', '/#contact');
});

// Отрасли строкой под кейсами (DESIGN_FIXES_4_PLAN Д19): на телефоне чипы в сцене кликабельны лишь на ~40px прокрутки,
// поэтому до 700px они повторяются под «Все работы». На компьютере и при «уменьшить движение» строки нет: display: none,
// не фокусируется и не видна читалке
const casesIndustries = (page: Page) => page.getByRole('region', { name: 'Лучшие проекты' }).locator('[data-goal-place="cases"]');

test('отрасли под кейсами на телефоне: чип ведёт в портфолио, 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const row = casesIndustries(page);
    const all = page.getByRole('region', { name: 'Лучшие проекты' }).getByRole('link', { name: 'Все проекты' });
    const chip = row.getByRole('listitem').getByRole('link').first();
    await chip.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible();
    const [a, r] = [await all.boundingBox(), await row.boundingBox()];
    expect(r!.y).toBeGreaterThan(a!.y + a!.height);

    const href = await chip.getAttribute('href');
    expect(href).toMatch(/^\/portfolio\?for=[a-z0-9]+$/);
    await expect(chip).toHaveAttribute('data-goal', 'industry_click');
    await chip.click();
    await expect(page).toHaveURL(href!);
});

test('«Другая сфера» под кейсами ведёт к форме, 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const other = casesIndustries(page).getByRole('link', { name: formButton });
    await expect(other).toHaveAttribute('href', '/#contact');
    await expect(other).toHaveAttribute('data-goal', 'cta_click');
    // До гидрации клик – обычный переход по якорю: ждём обработчик React
    await expect.poll(() => other.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps')))).toBe(true);
    await other.scrollIntoViewIfNeeded();
    await other.click();
    await expect(page).toHaveURL(/\/#contact$/);
    await expect(page.getByRole('heading', { name: contactTitle })).toBeFocused();
});

// Строка «Другая сфера?» и подписи чисел на чипах (DESIGN_FIXES_7_PLAN Д35): вопрос жирным, строка цветом текста,
// а не вторичным; число на чипе – «· 2 проекта», читалка слышит «Отрасль, 2 проекта». Строка видна целиком,
// и ссылка в ней – верхний элемент под курсором: клик доходит до неё
const expectOtherLine = async (box: Locator) => {
    const line = box.locator('p', { hasText: industriesOtherQuestion });
    const link = line.getByRole('link', { name: formButton });
    await expect.poll(() => line.evaluate((el) => {
        let op = 1;
        for (let n: Element | null = el; n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
        return op;
    })).toBeGreaterThan(.98);
    const style = await line.evaluate((el) => {
        const b = el.querySelector('b')!;
        const a = el.querySelector('a')!;
        return { text: b.textContent, weight: parseInt(getComputedStyle(b).fontWeight), color: getComputedStyle(el).color, link: getComputedStyle(a).color };
    });
    expect(style.text).toBe(industriesOtherQuestion);
    expect(style.weight).toBeGreaterThanOrEqual(700);
    expect(style.color).toBe(style.link);
    await expect(link).toBeInViewport({ ratio: 1 });
    expect(await link.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    })).toBe(true);

    const chip = box.getByRole('listitem').getByRole('link').first();
    const name = await chip.getAttribute('aria-label');
    expect(name).toMatch(/, \d+ проект(а|ов)?$/);
    const count = Number(name!.match(/(\d+) проект/)![1]);
    // Отступы в чипе – gap, а не пробелы: сверяем подписи по отдельности
    expect(await chip.locator('span').allTextContents()).toEqual(['·', industryChipCount(count)]);
    return link;
};

const industriesRegion = (page: Page) => page.getByRole('region', { name: 'Каким может быть сайт для вашего бизнеса' });

for (const viewport of [{ width: 1400, height: 900 }, { width: 375, height: 667 }]) {
    test(`«Другая сфера?» видна и кликабельна в кадре отраслей, ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.waitForTimeout(800);
        // До гидрации клик – обычный переход по якорю: ждём обработчик React
        const region = industriesRegion(page);
        await expect.poll(() => region.getByRole('link', { name: formButton }).evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps')))).toBe(true);
        // Устойчивый кадр отраслей – середина пути сцены, как в тесте «скролл назад»
        const path = await scenePath(page);
        await scrollInstant(page, path.top + path.len * .6);
        const link = await expectOtherLine(region);
        await link.click();
        await expect(page).toHaveURL(/\/#contact$/);
        await expect(page.getByRole('heading', { name: contactTitle })).toBeFocused();
    });
}

test('«Другая сфера?» под «Все проекты»: вопрос жирным, числа подписаны, 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const row = casesIndustries(page);
    await row.scrollIntoViewIfNeeded();
    await expectOtherLine(row);
});

test.describe('«Другая сфера?» в статичном первом экране, уменьшить движение', () => {
    test.use({ reducedMotion: 'reduce' });
    for (const viewport of [{ width: 1400, height: 900 }, { width: 375, height: 812 }]) {
        test(`${viewport.width}px`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/', { waitUntil: 'networkidle' });
            const region = industriesRegion(page);
            await region.getByRole('link', { name: formButton }).scrollIntoViewIfNeeded();
            const link = await expectOtherLine(region);
            await link.click();
            await expect(page).toHaveURL(/\/#contact$/);
        });
    }
});

// Скрытая строка: не видна, ни одна её ссылка не берёт фокус
const expectRowHidden = async (page: Page) => {
    const row = casesIndustries(page);
    await expect(row).toBeHidden();
    await expect(row.getByRole('link')).toHaveCount(0);
    const focusable = await row.locator('a').evaluateAll((links) => links.filter((el) => {
        (el as HTMLElement).focus();
        return document.activeElement === el;
    }).length);
    expect(focusable).toBe(0);
};

test('на компьютере строки отраслей под кейсами нет, 1400px', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/');
    await expectRowHidden(page);
});

test.describe('строка отраслей под кейсами, уменьшить движение', () => {
    test.use({ reducedMotion: 'reduce' });

    test('при «уменьшить движение» строки нет, 375px', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await expectRowHidden(page);
    });
});

// Путь от шагов и FAQ к форме (DESIGN_FIXES_3_PLAN Д15): текстовые ссылки ведут к форме главной, фокус – на её заголовке,
// без прыжка сцены. Под шагами – ссылка, а не кнопка: залитое действие на экране одно
for (const { name, region, place } of [
    { name: stepsContactLink, region: 'Как я работаю', place: 'steps' },
    { name: faqContactLink, region: 'Что спрашивают перед заказом', place: 'faq' }
]) {
    test(`ссылка «${name}» ведёт к форме главной`, async ({ page }) => {
        await page.goto('/');

        const link = page.getByRole('region', { name: region }).getByRole('link', { name });
        await expect(link).toHaveAttribute('href', '/#contact');
        await expect(link.locator('xpath=ancestor::*[@data-goal-place][1]')).toHaveAttribute('data-goal-place', place);

        await link.click();
        await expect(page).toHaveURL(/\/#contact$/);
        await expect(page.getByRole('heading', { name: contactTitle })).toBeFocused();
        await expect(page.getByRole('heading', { name: contactTitle })).toBeInViewport();
        const y = await page.evaluate(() => window.scrollY);
        await page.waitForTimeout(500);
        expect(await page.evaluate(() => window.scrollY)).toBe(y);
    });
}

// «Назад» после прыжка к форме (DESIGN_FIXES_4_PLAN Д18): прыжок – новая запись истории. «Назад» – мгновенно к месту нажатия,
// фокус на нажатой ссылке, адрес без #contact и выбранная услуга по адресу; «Вперёд» – снова форма. Метрика: цели только на клик,
// hit – один на переход. Скрипт Метрики заблокирован, вызовы ym пишутся в window.__ym
const backFromForm = async (page: Page, { region, name, url, service }: { region: string, name: string, url: RegExp, service?: ServiceId }) => {
    await page.route('https://mc.yandex.ru/**', (route) => route.abort());
    await page.addInitScript(() => {
        const calls: unknown[][] = [];
        Object.assign(window, { __ym: calls, ym: (...args: unknown[]) => { calls.push(args) } });
    });
    await page.goto('/');
    const calls = () => page.evaluate(() => (window as unknown as { __ym: unknown[][] }).__ym
        .filter(([, method]) => method === 'hit' || method === 'reachGoal').map(([, method, arg]) => `${method} ${arg}`));

    const link = page.getByRole('region', { name: region }).getByRole('link', { name });
    // До гидрации клик – обычный переход по якорю: ждём обработчик React
    await expect.poll(() => link.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps')))).toBe(true);
    await link.scrollIntoViewIfNeeded();
    const y = await page.evaluate(() => window.scrollY);

    const contact = page.getByRole('region', { name: contactTitle });
    const title = page.getByRole('heading', { name: contactTitle });
    const serviceLine = pickedService(contact);
    const atForm = async () => {
        await expect(page).toHaveURL(url);
        await expect(title).toBeInViewport();
        if (service) await expect(serviceLine).toHaveText(serviceTitle(service));
        else await expect(serviceLine).toHaveCount(0);
    };

    // Метрика: на каждом переходе – не больше одного hit, цели – только на клике
    const hits = (list: string[]) => list.filter((call) => call.startsWith('hit')).length;
    let seen = 0;
    const segment = async () => {
        await page.waitForTimeout(300);
        const list = (await calls()).slice(seen);
        seen += list.length;
        return list;
    };

    await link.click();
    await atForm();
    await expect(title).toBeFocused();
    const click = await segment();
    expect(click.filter((call) => call.startsWith('reachGoal'))).toHaveLength(1);
    expect(hits(click)).toBeLessThanOrEqual(1);

    await page.goBack();
    await expect(page).toHaveURL(/:\d+\/$/);
    await expect(link).toBeFocused();
    await expect(link).toBeInViewport();
    await expect(serviceLine).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    const back = await segment();
    expect(hits(back)).toBe(back.length);
    expect(hits(back)).toBeLessThanOrEqual(1);
    // Next не перерисовывает и не прокручивает страницу следом
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    await expect(link).toBeFocused();

    await page.goForward();
    await atForm();
    await expect(title).toBeFocused();
    await page.waitForTimeout(500);
    await expect(title).toBeInViewport();
    const forward = await segment();
    expect(hits(forward)).toBe(forward.length);
    expect(hits(forward)).toBeLessThanOrEqual(1);
};

const backCases = [
    { region: 'Услуги и цены', name: 'Узнать цену: Сайт компании', url: /\/\?service=corporate#contact$/, service: 'corporate' as const },
    { region: 'Как я работаю', name: stepsContactLink, url: /\/#contact$/ }
];

for (const item of backCases) {
    test(`«Назад» после «${item.name}» – к месту нажатия, «Вперёд» – к форме`, async ({ page }) => {
        await backFromForm(page, item);
    });
}

// Два прыжка подряд: каждый «Назад» отменяет один прыжок. Запись с #contact браузер восстанавливает сам (плавно к якорю,
// фокус сбрасывается) – позиция и фокус нажатой ссылки должны остаться
test('«Назад» после двух прыжков к форме – по одному прыжку', async ({ page }) => {
    await page.goto('/');
    const section = page.getByRole('region', { name: 'Услуги и цены' });
    const contact = page.getByRole('region', { name: contactTitle });
    const landing = section.getByRole('link', { name: 'Узнать цену: Лендинг' });
    const shop = section.getByRole('link', { name: 'Узнать цену: Магазин или каталог' });
    await expect.poll(() => landing.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps')))).toBe(true);

    await landing.scrollIntoViewIfNeeded();
    await landing.click();
    await expect(page).toHaveURL(/\/\?service=landing#contact$/);
    await shop.scrollIntoViewIfNeeded();
    const y = await page.evaluate(() => window.scrollY);
    await shop.click();
    await expect(page).toHaveURL(/\/\?service=shop#contact$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/\?service=landing#contact$/);
    await expect(pickedService(contact)).toHaveText(serviceTitle('landing'));
    await page.waitForTimeout(500);
    await expect(shop).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(y);

    await page.goBack();
    await expect(page).toHaveURL(/:\d+\/$/);
    await expect(landing).toBeFocused();
    await expect(landing).toBeInViewport();
});

test.describe('«Назад» после прыжка к форме, уменьшить движение', () => {
    test.use({ reducedMotion: 'reduce' });

    for (const item of backCases) {
        test(`«${item.name}»`, async ({ page }) => {
            await backFromForm(page, item);
        });
    }
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

// Бесплатный отрезок – пик блока (DESIGN_FIXES_4_PLAN Д21): на компьютере линия «Созвон – Макет» чернилами 3px
// и одна «0 ₽» кеглем цены, вторая – только для чтения с экрана; на телефоне «0 ₽» у каждого шага. Суммы – цветом текста
for (const { width, size, merged } of [
    { width: 1400, size: '25.6px', merged: true },
    { width: 375, size: '20.8px', merged: false }
]) {
    test(`бесплатный отрезок в «Как я работаю», ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');

        const steps = page.getByRole('region', { name: 'Как я работаю' }).getByRole('listitem');
        const pay = (i: number) => steps.nth(i).locator('p').last();
        const label = (i: number) => pay(i).locator('span').nth(1);
        const ink = await steps.first().getByRole('heading', { level: 3 }).evaluate(el => getComputedStyle(el).color);

        for (const i of [0, 1, 2, 3]) {
            await expect(label(i)).toHaveCSS('color', ink);
        }
        await expect(label(0)).toHaveCSS('font-size', size);
        if (merged) {
            for (const i of [0, 1]) {
                await expect(pay(i)).toHaveCSS('border-top-width', '3px');
                await expect(pay(i)).toHaveCSS('border-top-color', ink);
            }
            // Волосяная 1.5px – браузер на 1x округляет до 1px
            await expect(pay(2)).not.toHaveCSS('border-top-width', '3px');
            await expect(label(1)).toHaveCSS('clip-path', 'inset(50%)');
            await expect(steps.nth(1)).toContainText('Оплата: 0 ₽');
        } else {
            await expect(label(1)).toBeVisible();
            await expect(label(1)).toHaveCSS('font-size', size);
        }
    });
}

// Три довода без подписи под заголовком (DESIGN_FIXES_2_PLAN Д5). Без повторов того, что выше (DESIGN_FIXES_5_PLAN Д24):
// оплата – в шагах, гарантия – в шаге «Запуск» и FAQ, «без менеджеров» – в слайде первого экрана
test('почему я на главной', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Почему я' });
    const reasons = section.getByRole('listitem');
    await expect(reasons).toHaveCount(3);
    await expect(reasons.first().getByRole('heading', { level: 3 })).toHaveText('Чек на каждую оплату');
    await expect(reasons.first()).toContainText(offerReasons[0].text);
    for (const repeat of ['Предоплата', 'Гарантия', 'менеджер']) await expect(section).not.toContainText(repeat);
    await expect(section.locator(':scope > p')).toHaveCount(0);

    // «Гарантия от 2 недель» на странице одна – в шаге «Запуск»; в FAQ ответ про поломку
    const guarantee = await page.locator('main').evaluate((el) => (el.textContent?.match(/гарантия от\s2\sнедель/gi) ?? []).length);
    expect(guarantee).toBe(1);
});

// SERVICES_PLAN У1: неверные обещания сняты – договора пока нет, реклама есть, бесплатного адреса на Vercel нет,
// «в течение часа» – с часами работы
test('на главной нет снятых обещаний', async ({ page }) => {
    await page.goto('/');

    const reasons = page.getByRole('region', { name: 'Почему я' });
    const faq = page.getByRole('region', { name: faqTitle });
    for (const block of [reasons, faq]) await expect(block).not.toContainText(/договор/i);
    for (const old of ['vercel.app', 'Рекламу не настраиваю', 'фиксируем на первом созвоне', 'и дольше']) await expect(faq).not.toContainText(old);
    await expect(faq).toContainText('Яндекс Директ и VK Рекламу');
    await expect(page.locator('#contact').getByText(offerButtonsNote)).toContainText('пн–пт');
    await expect(page.locator('#contact')).toContainText('Платить за сайт');
});

// Планшет (DESIGN_FIXES_2_PLAN Д10): три отличия в одном ряду, а не 2 + 1, форма заявки по левому краю, как текст над ней.
// Кейсы – в столбик, как услуги (DESIGN_FIXES_6_PLAN Д34): в три колонки теги отраслей переносились на две строки
test('раскладка главной на планшете, 820px', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 900 });
    await page.goto('/');

    // offsetLeft/offsetTop не видят transform колоды; меряется ячейка сетки – у карточки offsetParent она сама
    const cards = page.getByRole('region', { name: 'Лучшие проекты' }).locator('article');
    await expect(cards).toHaveCount(3);
    await expect.poll(() => cards.evaluateAll((els) => {
        const lefts = els.map((el) => el.parentElement?.offsetLeft);
        const tops = els.map((el) => el.parentElement?.offsetTop);
        return new Set(lefts).size === 1 && new Set(tops).size === 3;
    })).toBe(true);

    const reasons = page.getByRole('region', { name: 'Почему я' }).getByRole('listitem');
    const tops = await reasons.evaluateAll((els) => els.map((el) => (el as HTMLElement).offsetTop));
    expect(new Set(tops).size).toBe(1);

    const contact = page.getByRole('region', { name: 'Давайте обсудим ваш проект' });
    const titleLeft = (await contact.getByRole('heading', { level: 2 }).boundingBox())!.x;
    const formLeft = (await contact.locator('form').boundingBox())!.x;
    expect(Math.abs(formLeft - titleLeft)).toBeLessThan(1);

    // Лента шагов в один столбец – по центру под заголовком, а не у левого края (DESIGN_FIXES_3_PLAN Д17)
    const steps = page.getByRole('region', { name: 'Как я работаю' });
    const section = (await steps.boundingBox())!;
    const list = (await steps.getByRole('list').boundingBox())!;
    expect(list.width).toBeLessThan(section.width);
    expect(Math.abs((list.x - section.x) - (section.x + section.width - list.x - list.width))).toBeLessThan(1);
});

// Теги отраслей в карточках кейсов – в одну строку на любой ширине; в три колонки карточки одной высоты (DESIGN_FIXES_6_PLAN Д34)
for (const width of [1400, 1100, 900, 899, 820, 701, 375]) {
    test(`кейсы: теги в одну строку, ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');

        // poll: карточки монтируются заново, когда сцена включает раздачу колоды (key в HomeCasesGrid)
        const region = page.getByRole('region', { name: 'Лучшие проекты' });
        await expect.poll(() => region.locator('article li').evaluateAll((els) => {
            const heights = els.map((el) => (el as HTMLElement).offsetHeight);
            return els.length > 0 && Math.max(...heights) - Math.min(...heights) < 2;
        })).toBe(true);

        if (width >= 900) {
            await expect.poll(() => region.locator('article').evaluateAll((els) => {
                const tops = els.map((el) => el.parentElement?.offsetTop);
                const heights = els.map((el) => (el as HTMLElement).offsetHeight);
                return els.length === 3 && new Set(tops).size === 1 && new Set(heights).size === 1;
            })).toBe(true);
        }
    });
}

// Отправка формы – жирным, как остальные кнопки-действия, и во всю ширину формы (DESIGN_FIXES_3_PLAN Д17)
for (const path of ['/', '/popup']) {
    test(`кнопка отправки формы жирная, ${path}`, async ({ page }) => {
        await page.goto(path);

        const form = page.locator('form', { has: page.getByPlaceholder('Имя *') });
        const submit = form.getByRole('button', { name: formButton });
        expect(await submit.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('700');
        // Начертание Raleway Bold, а не синтетический жирный из Regular, которым набраны поля
        const family = (el: Element) => getComputedStyle(el).fontFamily;
        expect(await submit.evaluate(family)).not.toBe(await form.getByPlaceholder('Имя *').evaluate(family));
        const name = (await form.getByPlaceholder('Имя *').boundingBox())!;
        const button = (await submit.boundingBox())!;
        expect(Math.abs(button.width - name.width)).toBeLessThan(1);
    });
}

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
    await section.getByPlaceholder('Телефон или Telegram *').fill('79990001122');
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
    await section.getByPlaceholder('Телефон или Telegram *').fill('123');
    await section.getByRole('button', { name: formButton }).click();
    await expect(page.getByText(contactIncomplete)).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: contactIncomplete })).toHaveCount(1);

    await section.getByPlaceholder('Телефон или Telegram *').fill('+7 999 123-45-67');
    await section.getByRole('button', { name: formButton }).click();

    await expect(section.getByRole('status')).toContainText(formSuccessText);
    await expect(section.getByRole('button', { name: formButton })).toHaveCount(0);
    await expect(page.getByRole('alert').filter({ hasText: contactIncomplete })).toHaveCount(0);
});

// Путь к заявке на телефоне (DESIGN_FIXES_2_PLAN Д7): сцена там короче, цены ближе к началу.
// На 375×800 было 3,57 экрана до «Услуг и цен», на 1400×900 – 2,79 (компьютер не трогали).
// Д19 (DESIGN_FIXES_4_PLAN): под кейсами на телефоне – строка отраслей, 244px + отступ 32px = 0,345 экрана:
// 3,08 → 3,425. Порог поднят только на неё; сама сцена не удлинилась.
// Д20: корень 16px и до 400px – карточки кейсов и строка отраслей выше на ~80px: 3,425 → 3,53–3,55. Сцена та же
for (const { viewport, screens } of [
    { viewport: { width: 375, height: 800 }, screens: 3.6 },
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
    const top = page.getByRole('region', { name: 'Лучшие проекты' }).getByRole('heading', { level: 3 }).nth(1);
    await expect.poll(() => top.evaluate((h) =>
        h.querySelector('a')!.getBoundingClientRect().top - h.getBoundingClientRect().top)).toBeLessThan(3);
});

// Недорисованные кадры сцены вдвое короче, путь отдан чипам (DESIGN_FIXES_6_PLAN Д30): на 1400×900 кадр отраслей
// целый с 0,56 до 0,94 экрана, раньше – с 0,64 до 0,84. Текст каждого чипа виден, чёрной капли над ним нет
test('кадр отраслей стоит дольше: чипы с подписями от 0,58 до 0,92 экрана', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/');
    const items = page.getByRole('region', { name: 'Каким может быть сайт для вашего бизнеса' }).getByRole('listitem');
    for (const screens of [.58, .92]) {
        await page.evaluate((k) => window.scrollTo(0, window.innerHeight * k), screens);
        await expect.poll(() => items.evaluateAll((lis) => lis.every((li) => {
            let op = 1;
            for (let n: Element | null = li.querySelector('a'); n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
            return op > .98 && parseFloat(getComputedStyle(li.querySelector('span[aria-hidden]')!).opacity) < .02;
        }))).toBe(true);
    }
});

// Экран сцены – на большую высоту окна, а не на svh (DESIGN_FIXES_6_PLAN С1): в Яндекс Браузере и под стеклянной
// панелью Safari снизу оставалась полоса, на портале в ней были видны кейсы. Панели браузеров Playwright не эмулирует:
// проверяем, что экран закрывает окно до низа до самого конца пути и отпускается ровно там, где прогресс доходит до 1
const sceneScreen = (page: Page) => page.locator('section[aria-labelledby="hero-title"] > div').first();
// Последний пиксель пути сцены: дальше браузер отпускает липкий экран
const sceneEnd = (page: Page) => sceneScreen(page).evaluate((el: HTMLElement) => {
    const scene = el.parentElement!;
    return scene.getBoundingClientRect().top + window.scrollY + scene.offsetHeight - el.offsetHeight;
});
const screenBox = (page: Page) => sceneScreen(page).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height, window: window.innerHeight };
});

for (const viewport of [{ width: 1400, height: 900 }, { width: 375, height: 667 }]) {
    test(`экран сцены закрывает окно до конца сцены, ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        // Страница въезжает на 20px за 0,75 с (template.tsx): до конца въезда экран не у верха
        await page.waitForTimeout(800);
        const end = await sceneEnd(page);
        for (const y of [end * .3, end * .7, end - 1]) {
            await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
            const box = await screenBox(page);
            expect(Math.abs(box.top)).toBeLessThan(1);
            expect(box.bottom).toBeGreaterThanOrEqual(box.window - 1);
        }
        // Конец пути – там, где экран отпускается: дыра на весь экран, клики проходят к кейсам
        await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), end);
        await expect.poll(() => sceneScreen(page).evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    });
}

// Быстрый скролл (DESIGN_FIXES_6_PLAN С3): анимация идёт за сглаженным прогрессом, и экран отпускался в конце пути,
// пока дыра ещё не раскрыта, – снизу росла полоса с кейсами. Теперь экран держится ещё экран после конца пути,
// а пружина отстаёт не больше чем на 0,8 экрана: в каждом кадре экран либо закрывает окно до низа, либо дыра на весь экран
const scenePath = (page: Page) => sceneScreen(page).evaluate((el: HTMLElement) => {
    const scene = el.parentElement!;
    // Путь анимации – невидимый слой последним в сцене: сцена длиннее него на запас липкости
    const path = scene.lastElementChild as HTMLElement;
    return { top: scene.getBoundingClientRect().top + window.scrollY, len: path.offsetHeight - el.offsetHeight, screen: el.offsetHeight };
});
// Кадры за ms: где экран отъехал от верха или не дотянул до низа окна, а дыра не на весь экран.
// Состояние – уже отрисованного кадра: setTimeout из rAF идёт после того, как framer-motion обновил стили
const recordFrames = (page: Page, ms: number) => sceneScreen(page).evaluate((el, ms) => new Promise<string[]>((resolve) => {
    const bad: string[] = [];
    const start = performance.now();
    const sample = () => {
        const r = el.getBoundingClientRect();
        const covers = r.top > -.5 && r.top < .5 && r.bottom >= window.innerHeight - 1;
        const m = el.style.maskImage.match(/circle at ([\d.]+)px ([\d.]+)px, transparent ([\d.]+)px/);
        const [x, y, h] = m ? m.slice(1).map(Number) : [0, 0, 0];
        const open = h >= Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
        if (!covers && !open && r.bottom > 0) bad.push(`top ${Math.round(r.top)}, bottom ${Math.round(r.bottom)}, дыра ${Math.round(h)}`);
        if (performance.now() - start < ms) requestAnimationFrame(() => setTimeout(sample));
        else resolve(bad);
    };
    requestAnimationFrame(() => setTimeout(sample));
}), ms);
const scrollInstant = (page: Page, y: number) => page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);

for (const viewport of [{ width: 1400, height: 900 }, { width: 375, height: 667 }]) {
    test.describe(`быстрый скролл за конец сцены, ${viewport.width}px`, () => {
        test.use({ viewport });
        // Начало портала, доля пути сцены (HeroExpand.tsx: portalFrom)
        const portalFrom = viewport.width <= 700 ? .84 / 1.19 : .94 / 1.29;

        test('прыжок за конец пути: полосы под экраном нет', async ({ page }) => {
            await page.goto('/');
            await page.waitForTimeout(800);
            const path = await scenePath(page);
            for (const k of [.3, .9, 1.5]) {
                await scrollInstant(page, path.top + path.len * portalFrom);
                await page.waitForTimeout(700);
                const frames = recordFrames(page, 600);
                await scrollInstant(page, path.top + path.len + path.screen * k);
                expect(await frames, `прыжок на ${k} экрана за конец пути`).toEqual([]);
            }
        });

        test('быстрые щелчки колеса: полосы под экраном нет', async ({ page }) => {
            await page.goto('/');
            await page.waitForTimeout(800);
            const path = await scenePath(page);
            await scrollInstant(page, path.top + path.len * portalFrom);
            await page.waitForTimeout(700);
            await page.mouse.move(viewport.width / 2, viewport.height / 2);
            const frames = recordFrames(page, 1200);
            for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 300);
            expect(await frames).toEqual([]);
        });

        test('скролл назад: сцена собирается обратно', async ({ page }) => {
            await page.goto('/');
            await page.waitForTimeout(800);
            const path = await scenePath(page);
            await scrollInstant(page, path.top + path.len + path.screen * 1.5);
            await page.waitForTimeout(700);
            // Кадр отраслей: дыры нет, чипы с подписями на местах
            await scrollInstant(page, path.top + path.len * .6);
            await expect.poll(() => sceneScreen(page).evaluate((el) => el.style.maskImage)).toBe('none');
            const items = page.getByRole('region', { name: 'Каким может быть сайт для вашего бизнеса' }).getByRole('listitem');
            await expect.poll(() => items.evaluateAll((lis) => lis.every((li) => {
                let op = 1;
                for (let n: Element | null = li.querySelector('a'); n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
                return op > .98;
            }))).toBe(true);
        });
    });
}

test.describe('тач-экран', () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

    // Запас на браузеры, где и lvh меньше видимой области: экран не ниже наибольшего innerHeight при этой ширине.
    // Панели свернулись – окно выросло, развернулись – экран не сжимается; поворот (другая ширина) – заново
    test('экран сцены не ниже наибольшей высоты окна при этой ширине', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(800);
        const height = async () => (await screenBox(page)).height;
        expect(await height()).toBe(667);

        await page.setViewportSize({ width: 375, height: 760 });
        await expect.poll(height).toBe(760);
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(200);
        expect(await height()).toBe(760);

        // Путь сцены прежний, экран отпускается в его конце и до этого закрывает окно
        const end = await sceneEnd(page);
        await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), end - 1);
        const box = await screenBox(page);
        expect(Math.abs(box.top)).toBeLessThan(1);
        expect(box.bottom).toBeGreaterThanOrEqual(box.window);

        await page.setViewportSize({ width: 667, height: 375 });
        await expect.poll(height).toBe(375);
    });
});

// Диск «10 проектов» перед дырой не уходит за верх экрана (DESIGN_FIXES_6_PLAN С2): размер прежний – min(150px, 30% ширины),
// где с запасом 12px не влезает, центр сдвинут внутрь экрана, знак – вместе с ним. До правки на 375×667 верх диска был
// на -2px, на 360×640 – на -37px; на 375×812 и 1400 сдвига нет
for (const { viewport, shifted } of [
    { viewport: { width: 375, height: 667 }, shifted: true },
    { viewport: { width: 360, height: 640 }, shifted: true },
    { viewport: { width: 375, height: 812 }, shifted: false },
    { viewport: { width: 1400, height: 900 }, shifted: false },
]) {
    test(`диск портала целиком в экране, ${viewport.width}×${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.waitForTimeout(800);
        // Середина стояния диска, доля пути сцены: начало портала + (DISK_TO + OPEN_AT) / 2 его пути (HeroExpand.tsx)
        const from = viewport.width <= 700 ? .84 / 1.19 : .94 / 1.29;
        const at = from + (1 - from) * 2 / 7;
        const path = await scenePath(page);
        await scrollInstant(page, path.top + path.len * at);

        const radius = Math.min(150, viewport.width * .3);
        const frame = () => sceneScreen(page).evaluate((el) => {
            // Пока сглаженный прогресс не дошёл до портала, диска нет
            const disk = [...el.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')]
                .find((d) => d.style.background.includes('radial-gradient'));
            if (!disk) return null;
            const [, x, y, r] = disk.style.background.match(/circle at ([\d.]+)px ([\d.]+)px, [^,]+ ([\d.]+)px/)!.map(Number);
            // Знак – круг с числом и подписью «проектов»; кружок над заголовком (его место без transform) – через слой выше
            const works = [...el.querySelectorAll('b')].find((b) => /проект/.test(b.nextElementSibling?.textContent ?? ''))!.parentElement!;
            const mark = works.getBoundingClientRect();
            const slot = works.parentElement!.parentElement!.getBoundingClientRect();
            const box = el.getBoundingClientRect();
            return {
                x, y, r, height: box.height,
                mark: { y: mark.top + mark.height / 2 - box.top, r: mark.height / 2 },
                slotY: slot.top + slot.height / 2 - box.top,
            };
        });
        await expect.poll(async () => (await frame())?.r ?? 0).toBeCloseTo(radius, 0);
        const f = (await frame())!;
        expect(f.y - f.r).toBeGreaterThanOrEqual(12 - .5);
        expect(f.y + f.r).toBeLessThanOrEqual(f.height - 12 + .5);
        // Знак «10 проектов» – одним целым с диском
        expect(Math.abs(f.mark.y - f.y)).toBeLessThan(1);
        expect(Math.abs(f.mark.r - f.r)).toBeLessThan(1);
        if (shifted) expect(f.y - f.slotY).toBeGreaterThan(1);
        else expect(Math.abs(f.y - f.slotY)).toBeLessThan(1);
    });
}

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

        const all = page.getByRole('region', { name: 'Лучшие проекты' }).getByRole('link', { name: 'Все проекты' });
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

// Вторичный текст и плейсхолдеры – не ниже 4.5:1: в светлой 62% чернил, в тёмной 50% бумаги уже проходят (DESIGN_FIXES_3_PLAN Д16)
for (const [theme, muted] of [['light', 'rgba(19, 19, 19, 0.62)'], ['dark', 'rgba(255, 255, 255, 0.5)']] as const) {
    test(`вторичный текст и плейсхолдеры, ${theme === 'light' ? 'светлая' : 'тёмная'} тема`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
        await page.goto('/');

        const summary = page.getByRole('region', { name: servicesTitle }).getByText(services[0].summary);
        await expect.poll(() => summary.evaluate((el) => getComputedStyle(el).color)).toBe(muted);

        const name = page.locator('#contact form').getByPlaceholder(inputsListFeedback[0].placeholder!);
        await expect.poll(() => name.evaluate((el) => getComputedStyle(el, '::placeholder').color)).toBe(muted);
    });
}

// Текст на телефоне не мельче Label (0.95rem = 15.2px): корень 16px и до 400px (DESIGN_FIXES_4_PLAN Д20)
for (const width of [375, 320]) {
    test(`вторичный текст на телефоне не мельче 15px, ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 812 });
        await page.goto('/');

        const contact = page.locator('#contact');
        const texts = [
            page.getByRole('region', { name: faqTitle }).getByText(offerFaq[0].answer),
            page.getByText(offerSteps[0].text),
            // Тот же текст – в ответе FAQ про оплату (SERVICES_PLAN У1)
            page.getByRole('region', { name: 'Почему я' }).getByText(offerReasons[0].text),
            contact.getByText(offerButtonsNote),
            contact.getByText(offerTrustLine()),
            page.getByRole('contentinfo'),
        ];
        for (const text of texts) {
            expect(await text.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(15);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    });
}

// Финальный проход (DESIGN_FIXES_4_PLAN Д23): теги кейсов и подпись демо-чата кеглем Label,
// число с единицей, название клиента и «ИИ-ассистента» не рвутся на строки
test('теги, подпись чата и неразрывные пары на телефоне, 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const tag = page.getByRole('region', { name: 'Лучшие проекты' }).getByRole('article').first().getByRole('listitem').first();
    const services = page.getByRole('region', { name: servicesTitle });
    for (const text of [tag, services.getByText(chatButtonText)]) {
        expect(await text.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(15);
    }

    // Сколько строк занимает кусок текста внутри элемента
    const linesOf = (el: Element, part: string) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const start = node.textContent!.indexOf(part);
            if (start < 0) continue;
            const range = document.createRange();
            range.setStart(node, start);
            range.setEnd(node, start + part.length);
            return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
        }
        return 0;
    };
    const step = page.getByText(offerSteps[3].text);
    expect(await step.evaluate(linesOf, '2\u00A0недель')).toBe(1);
    expect(await services.getByRole('link', { name: 'ИКЦ «Презентация»' }).evaluate(linesOf, 'ИКЦ «Презентация»')).toBe(1);
    expect(await services.getByText(chatButtonTitle).evaluate(linesOf, 'ИИ-\u2060ассистента')).toBe(1);
});

// Карточка ИИ (DESIGN_FIXES_7_PLAN Д36): срок «от 3 дней» – один раз, уточнение – одной фразой,
// подпись демо – про задачи из примеров, а не про ответы клиентам. С У2 (SERVICES_PLAN) – две ступени цены
test('карточка ИИ без повторов, подпись демо про примеры', async ({ page }) => {
    await page.goto('/');

    const ai = services.find((service) => service.id === 'ai')!;
    const card = page.getByRole('region', { name: servicesTitle }).getByRole('listitem')
        .filter({ has: page.getByRole('heading', { name: ai.title }) });
    const text = (await card.innerText()).replace(/\s+/g, ' ');
    expect(text.match(/от 3 дней/g)).toHaveLength(1);
    expect(text).not.toContain('базе знаний');
    expect(ai.note).not.toMatch(/[.!?]\s/);
    await expect(card.getByText(ai.note!)).toBeVisible();
    await expect(card.getByRole('button').filter({ hasText: chatButtonText })).toBeVisible();
});

// SERVICES_PLAN У2: у каждой ступени ИИ видны название, цена, срок и что клиент видит до оплаты – по порядку
for (const width of [1400, 375]) {
    test(`карточка ИИ: две ступени цены, ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');

        const ai = services.find((service) => service.id === 'ai')!;
        const card = page.getByRole('region', { name: servicesTitle }).getByRole('listitem')
            .filter({ has: page.getByRole('heading', { name: ai.title }) });
        const tiers = card.getByRole('list').filter({ hasText: ai.tiers![0].price }).getByRole('listitem');
        await expect(tiers).toHaveCount(ai.tiers!.length);
        for (const [i, tier] of ai.tiers!.entries()) {
            const row = tiers.nth(i);
            const text = (await row.innerText()).replace(/\s+/g, ' ');
            expect(text).toBe(`${tier.title} ${tier.price} ${tier.term} · ${tier.condition}`);
            await expect(row).toBeVisible();
        }
        // Цена ступени не шире карточки и не рвётся
        const box = await card.boundingBox();
        for (const price of await tiers.locator('[class*="price"]').all()) {
            const b = (await price.boundingBox())!;
            expect(b.x + b.width).toBeLessThanOrEqual(box!.x + box!.width);
            expect(await price.evaluate((el) => {
                const range = document.createRange();
                range.selectNodeContents(el);
                return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
            })).toBe(1);
        }
    });
}

// SERVICES_PLAN У3: у каждой карточки сайта есть уточнение (обычная сумма, число страниц, каталог дешевле),
// заявки – в Telegram или на почту, на карточке не больше двух кейсов
for (const width of [1400, 375]) {
    test(`карточки сайтов: уточнения и два кейса, ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');

        const section = page.getByRole('region', { name: servicesTitle });
        await expect(section).not.toContainText('где вам удобно');
        for (const service of services.filter((s) => !s.wide)) {
            const card = section.getByRole('listitem').filter({ has: page.getByRole('heading', { name: service.title }) });
            const note = card.getByText(service.note!, { exact: true });
            await expect(note).toBeVisible();
            // Сумма в уточнении не рвётся между строками: «около 9 / 000 ₽» на 375
            expect(await note.evaluate((el) => {
                const node = el.firstChild!;
                const match = /\d[\d\s–]*₽/.exec(node.textContent!)!;
                const range = document.createRange();
                range.setStart(node, match.index);
                range.setEnd(node, match.index + match[0].length);
                return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
            })).toBe(1);
            await expect(card.locator('a[href^="/portfolio/"]')).toHaveCount(service.caseIds.length);
            expect(service.caseIds.length).toBeLessThanOrEqual(2);
        }
        const corporate = section.getByRole('listitem').filter({ has: page.getByRole('heading', { name: serviceTitle('corporate') }) });
        await expect(corporate.getByRole('link', { name: 'Союз вокалистов' })).toHaveAttribute('href', '/portfolio/vocal');
        // ИКЦ «Презентация» – лендинг (владелец)
        const landing = section.getByRole('listitem').filter({ has: page.getByRole('heading', { name: serviceTitle('landing') }) });
        await expect(landing.getByRole('link', { name: 'ИКЦ «Презентация»' })).toHaveAttribute('href', '/portfolio/icc');
        await expect(corporate.getByRole('link', { name: 'ИКЦ «Презентация»' })).toHaveCount(0);
        await expect(section.getByRole('listitem').filter({ has: page.getByRole('heading', { name: serviceTitle('shop') }) }))
            .toContainText('Каталог без корзины – от 35 000 ₽');
    });
}

// ИКЦ «Презентация» – лендинг, а не сайт компании (владелец, SERVICES_PLAN У3)
test('кейс ИКЦ: тип – лендинг', async ({ page }) => {
    await page.goto('/portfolio/icc');
    await expect(page).toHaveTitle(/лендинг – кейс/);
    await expect(page.getByText('Лендинг', { exact: true }).first()).toBeVisible();
});

// Союз вокалистов – разработка владельца целиком, а не только дизайн (SERVICES_PLAN У3)
test('кейс Союза вокалистов: роль – дизайн и разработка', async ({ page }) => {
    await page.goto('/portfolio/vocal');
    await expect(page.getByText('Дизайн и разработка под ключ').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText('адаптив');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Дизайн и разработка под ключ/);
});

// Фоновые пятна приглушены по теме, чтобы приглушённый текст над ними читался (DESIGN_FIXES_5_PLAN Д25)
for (const [theme, opacity] of [['light', '0.6'], ['dark', '0.3']] as const) {
    test(`фоновые пятна приглушены, ${theme === 'light' ? 'светлая' : 'тёмная'} тема`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
        await page.goto('/');

        for (const blob of ['BgRectangle1', 'BgRectangle2']) {
            await expect(page.locator(`[class*="${blob}"]`)).toHaveCSS('opacity', opacity);
        }
    });
}

// Ступени заголовков: сцена на ступень крупнее заголовков секций, а не на две; число в кружке – одной ступенью с номерами шагов (DESIGN_FIXES_5_PLAN Д27)
for (const [width, scene, numeral] of [[1400, 44, 40], [375, 28.8, 32]] as const) {
    test(`ступени заголовка сцены и чисел, ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');

        const size = (sel: string) => page.locator(sel).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        const sceneSize = await size('#industries-title');
        const headline = await size('#services-title');
        expect(sceneSize).toBeCloseTo(scene, 0);
        expect(sceneSize).toBeGreaterThan(headline);
        expect(sceneSize / headline).toBeLessThan(1.3);
        await expect(page.locator('#industries-title')).toHaveCSS('text-wrap', /balance/);

        expect(await size('[class*="works"] b')).toBeCloseTo(numeral, 0);
        expect(await size('section[aria-labelledby="steps-title"] li > span[aria-hidden="true"]')).toBeCloseTo(numeral, 0);
    });
}

// Финальный проход: абзацы блоков без висячих слов, таблетка «Ещё» на токене 24px (DESIGN_FIXES_5_PLAN Д29)
test('абзацы блоков без висячих слов, таблетка «Ещё» 24px', async ({ page }) => {
    await page.goto('/');

    for (const id of ['cases-title', 'services-title', 'steps-title', 'reasons-title', 'faq-title', 'contact-title']) {
        await expect(page.locator(`section[aria-labelledby="${id}"] p`).first()).toHaveCSS('text-wrap', /pretty/);
    }
    await expect(page.locator('section[aria-labelledby="more-title"] a').first()).toHaveCSS('border-radius', '24px');
});

// Набор (DESIGN_FIXES_6_PLAN Д33): заголовки секций переносятся поровну, ни одна строка главной не начинается с «–»
// (перед тире неразрывный пробел)
for (const width of [1400, 1100, 820, 375]) {
    test(`заголовки поровну, строки не начинаются с тире, ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');

        const wraps = await page.locator('main h2').evaluateAll((els) =>
            els.map((el) => ({ text: el.textContent, wrap: getComputedStyle(el).textWrap })));
        for (const { text, wrap } of wraps) {
            expect(wrap, text ?? '').toMatch(/balance/);
        }

        // Тире, которое стоит ниже предыдущей буквы, – в начале строки
        const dashStarts = await page.locator('main').evaluate((main) => {
            const found: string[] = [];
            const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                const text = node.textContent!;
                for (let i = text.indexOf('–'); i >= 0; i = text.indexOf('–', i + 1)) {
                    let prev = i - 1;
                    while (prev >= 0 && /\s/.test(text[prev])) prev--;
                    if (prev < 0) continue;
                    const rect = (from: number) => {
                        const range = document.createRange();
                        range.setStart(node!, from);
                        range.setEnd(node!, from + 1);
                        return range.getClientRects()[0];
                    };
                    const dash = rect(i), before = rect(prev);
                    if (dash && before && dash.top > before.top + dash.height / 2) found.push(text.trim().slice(0, 60));
                }
            }
            return found;
        });
        expect(dashStarts).toEqual([]);
    });
}

test.describe('шапка на планшете с касанием, 1366px', () => {
    test.use({ viewport: { width: 1366, height: 1024 }, hasTouch: true });

    test('касание «›» открывает шапку, касание вне – закрывает', async ({ page }) => {
        await page.goto('/');
        const header = page.locator('header');
        const open = header.getByRole('button', { name: 'Открыть панель' });
        const left = async () => (await header.boundingBox())!.x;

        await expect(open).toHaveAttribute('aria-expanded', 'false');
        expect(await left()).toBeLessThan(-50);

        await open.tap();
        await expect(open).toHaveAttribute('aria-expanded', 'true');
        await expect.poll(left).toBe(0);

        await page.touchscreen.tap(700, 300);
        await expect(open).toHaveAttribute('aria-expanded', 'false');
        await expect.poll(left).toBeLessThan(-50);
    });
});

// При «Уменьшить движение» шапка не выезжает, а пелена не проявляется – сразу конечное положение
test.describe('шапка при reduced-motion, 1400px', () => {
    test.use({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' });

    test('панель и пелена без промежуточных кадров', async ({ page }) => {
        await page.goto('/');
        const header = page.locator('header');
        const open = header.getByRole('button', { name: 'Открыть панель' });
        await expect(open).toHaveAttribute('aria-expanded', 'false');

        // Положение панели и прозрачность пелены (div сразу за шапкой) в каждом кадре
        await page.evaluate(() => {
            const w = window as unknown as { frames_: [number, number][]; stop_: boolean };
            const h = document.querySelector('header')!;
            const bg = h.nextElementSibling!;
            w.frames_ = [];
            const tick = () => {
                w.frames_.push([h.getBoundingClientRect().x, Number(getComputedStyle(bg).opacity)]);
                if (!w.stop_) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        await open.hover();
        await expect(open).toHaveAttribute('aria-expanded', 'true');
        await page.waitForTimeout(600);
        const frames = await page.evaluate(() => {
            const w = window as unknown as { frames_: [number, number][]; stop_: boolean };
            w.stop_ = true;
            return w.frames_;
        });

        expect(frames.at(-1)).toEqual([0, 0.7]);
        expect(frames.filter(([x]) => x > -99 && x < -1)).toEqual([]);
        expect(frames.filter(([, o]) => o > 0.01 && o < 0.69)).toEqual([]);
    });
});

// До 1200px шапка – полоса сверху: наведение и фокус на ней не затемняют страницу
test.describe('шапка-полоса без пелены, 1100px', () => {
    test.use({ viewport: { width: 1100, height: 800 } });

    test('наведение и фокус не включают пелену', async ({ page }) => {
        await page.goto('/');
        const header = page.locator('header');
        const veil = page.locator('header + div');
        const opacity = () => veil.evaluate((el) => Number(getComputedStyle(el).opacity));

        await header.hover();
        await page.waitForTimeout(600);
        expect(await opacity()).toBe(0);

        await header.getByRole('link', { name: 'Telegram' }).focus();
        await page.waitForTimeout(600);
        expect(await opacity()).toBe(0);
        expect((await header.boundingBox())!.x).toBe(0);
    });
});
