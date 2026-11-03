# Промпт для обложек услуг на фриланс-биржах

Один шаблон для всех карточек: подставьте значения из таблицы параметров вместо `{…}` и отправьте в нейросеть целиком. Надписи на русском нейросеть пишет сама.

Цены и сроки – из `services_list_approved.md`. Поменялись там – меняйте и здесь.

## Где генерировать

- Нужна модель, которая уверенно пишет кириллицу: **GPT Image (ChatGPT)**, **Nano Banana (Gemini)** или **Ideogram**. Midjourney и Stable Diffusion русские буквы коверкают – для этих карточек не подходят.
- Формат 3:2, горизонтальный. Обложка Kwork – 660×440: генерируйте 1536×1024 и уменьшайте.
- Сделайте 3–4 варианта и проверьте каждую букву, цифру и знак «₽». Ошибка в цене хуже, чем отсутствие карточки.
- Опечатку можно исправить одной фразой в том же чате: `Fix the text: "…" must read exactly "…". Keep everything else unchanged.`

## Правила бирж и честности

- На картинке **нет** ссылок, Telegram, телефона и showmyworks.ru – биржи за это снимают объявление.
- Только подтверждённые факты: цена «от», срок, «платите после макета». Нельзя: отзывы, звёзды, «№1», «+300% заявок», «гарантия результата».

## Промпт

```
Create a sales cover image for a freelance marketplace service listing.
Landscape 3:2, 1536×1024. All text is in Russian – render every Cyrillic
letter exactly as written below, no typos, no extra words, no English
except the stencil stamp.

TEXT (exactly, in this hierarchy):
1. Small stencil stamp, top-left, uppercase Latin: "{КЛЕЙМО}"
2. Main headline, very large, bold, max 2 lines: "{ЗАГОЛОВОК}"
3. Subheadline, regular weight, muted grey, 1 line: "{ВЫГОДА}"
4. Price, large bold, the second most visible element: "{ЦЕНА}"
5. Next to the price, small muted: "{СРОК}"
6. Three pill-shaped tags in a row at the bottom:
   "{ТЕГ 1}"   "{ТЕГ 2}"   "{ТЕГ 3}"

LAYOUT:
One large frosted-glass panel fills ~85% of the image, centered.
Text block on the left 55% of the panel, strictly left-aligned,
generous spacing between the levels. On the right 45%: {ВИЗУАЛ}.
The visual sits on its own smaller frosted panel that slightly overlaps
the main one and is tilted 3–5°. Lots of empty space; nothing touches
the edges.

STYLE – "workshop under glass" (calm, premium, made by one craftsman):
- Monochrome interface: {ТЕМА}.
- Color exists ONLY as light behind the glass: 2–3 huge, heavily blurred,
  low-opacity glow blobs in the background – dusty pink rgb(234,119,119)
  top-left, soft blue rgb(119,199,234) bottom-right, a faint green
  rgb(0,234,65) between them. Like warm studio light behind a matte vitrine.
  Color never fills text, tags or panels.
- Panels: translucent matte glass (8% grey with background blur), corner
  radius about 13px, very large soft diffuse shadow, no borders.
- Typography: headline and price in a clean geometric sans like Raleway
  Bold; subheadline and small text in Raleway Regular, 60% opacity.
  The stamp in a stencil typeface like Allerta Stencil – a maker's mark
  on a toolbox.
- Tags: pill shapes with a thin grey hairline outline (no fill),
  text in the main ink color.
- The price stands out by size and weight only, not by color.

MOOD: quiet confidence, honesty, engineering precision, plenty of air.
The card must read in 2 seconds at thumbnail size: headline → price → tags.

DO NOT: colored or gradient text, neon, glossy 3D icons, clipart, stock
photos of people, realistic laptops or phones with fake UI, emojis,
stars, ratings, badges like "№1" or "SALE", arrows, invented numbers,
URLs, contacts, watermarks, more text than listed above.
```

## Параметры

### `{ТЕМА}` – светлая или тёмная

На сайте темы равноправны. В светлой ленте бирж тёмная карточка заметнее – сделайте обе и выберите.

- Светлая: `near-black ink rgb(19,19,19) text on a pure white background`
- Тёмная: `pure white text on a near-black background rgb(19,19,19); glass panels barely lighter than the background; glow blobs dimmer, about 30% opacity`

### Остальные параметры по услугам

`{КЛЕЙМО}` – только латиница: русский трафаретом не набираем (правило клейма из DESIGN.md).

| Параметр | Лендинг | Сайт компании | Интернет-магазин | Каталог |
|---|---|---|---|---|
| КЛЕЙМО | LANDING | WEBSITE | SHOP | CATALOG |
| ЗАГОЛОВОК | Лендинг, который приводит заявки | Сайт компании под ключ | Интернет-магазин под ключ | Каталог товаров под ключ |
| ВЫГОДА | Макет бесплатно – платите, если понравился | Один исполнитель от макета до запуска | С онлайн-оплатой и панелью для товаров | Заявка прямо с карточки товара |
| ЦЕНА | от 8 000 ₽ | от 30 000 ₽ | от 50 000 ₽ | от 35 000 ₽ |
| СРОК | 3–4 дня | 1–2 недели | 2–3 недели | 13–20 дней |
| ТЕГ 1 | Платите после макета | Платите после макета | Платите после макета | Платите после макета |
| ТЕГ 2 | Тексты пишу я | Без менеджеров | Подключу оплату | Удобная панель |
| ТЕГ 3 | Чек самозанятого | Чек самозанятого | Чек самозанятого | Чек самозанятого |
| ВИЗУАЛ | a minimal abstract wireframe of one long landing page: grey blocks and thin lines only, a solid dark button-shaped block in the first screen, no readable text | three overlapping abstract page wireframes (home, services, contacts) made of grey blocks and lines, no readable text | an abstract grid of 6 product cards: grey image squares, thin lines for titles, small dark button shapes, no readable text | an abstract grid of 6 product cards with grey image squares and thin lines, no cart icons, no readable text |

| Параметр | ИИ: заявки и запись | ИИ: сложный агент | Автоматизация без ИИ |
|---|---|---|---|
| КЛЕЙМО | AI AGENT | AI AGENT | AUTOMATION |
| ЗАГОЛОВОК | ИИ-агент принимает заявки 24/7 | ИИ-агент под ваш процесс | Заявки сами попадают в CRM |
| ВЫГОДА | Задаёт вопросы и передаёт клиента менеджеру | Звонки, отзывы, отчёты – без ручной рутины | Сайт → CRM → Telegram без ручного переноса |
| ЦЕНА | от 15 000 ₽ | от 50 000 ₽ | от 5 000 ₽ |
| СРОК | от 3 дней | от 12 дней | за одну связку |
| ТЕГ 1 | Сайт и Telegram | Начинаем с пилота | CRM и таблицы |
| ТЕГ 2 | Передаёт в CRM | Отчёт таблицей и графиком | Уведомления в Telegram |
| ТЕГ 3 | Чек самозанятого | Чек самозанятого | Чек самозанятого |
| ВИЗУАЛ | a minimal abstract flow diagram: a chat bubble shape → a small glowing round node (soft pink-green-blue light inside a glass sphere) → a paper-plane shape; thin grey connecting lines, no readable text | a minimal abstract flow diagram: a sound-wave shape and a document shape → a small glowing glass sphere node → a simple bar chart and a table made of grey blocks; thin grey lines, no readable text | three simple rounded blocks connected by thin grey lines with small dots moving along them, no logos, no readable text |

«ИИ: сложный агент» – общая карточка. Под отдельную задачу смените ЗАГОЛОВОК и ВЫГОДУ, остальное оставьте:

- Контроль звонков: «Оценка каждого звонка менеджера» / «Расшифровка и отчёт по вашим критериям»
- Отзывы: «Оценки клиентов по каждому менеджеру» / «Агент сам собирает отзывы после сделки»
- Маркетинг: «Отчёт по рекламе без ручного сбора» / «Данные из рекламы, Метрики и CRM – в одной таблице»
- Документы: «Проверка договоров по вашим правилам» / «Агент показывает риски в документе»

## Как писать свои значения

Если добавляете новую услугу, держите тексты короткими: чем меньше слов, тем меньше опечаток у нейросети.

- ЗАГОЛОВОК – до 35 знаков: результат для клиента, а не название технологии.
- ВЫГОДА – до 45 знаков, снимает один страх клиента: «пропадёт с предоплатой», «студия – дорого и долго», «заявки руками».
- ТЕГ – до 22 знаков.
- Длинное тире «—» не используем, только «–».

## Серия карточек

Чтобы карточки на бирже выглядели одним набором, генерируйте их в одном чате: первую – по промпту, остальные – фразой `Same style, layout and glow positions as the previous image, but with these values: …` и новыми значениями параметров.
