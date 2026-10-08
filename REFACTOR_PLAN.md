# План рефакторинга

Основан на `AUDIT.md`: ID в скобках ссылаются на находки оттуда. Шаги отсортированы по соотношению пользы и риска: сначала критичное и быстрые победы, затем исправления поведения, оптимизация, качество кода и крупный рефакторинг.

**Правила:**
- Один шаг — один коммит.
- После каждого шага выполняется его проверка и общий smoke-чек-лист (в конце документа).
- Шаги одного этапа в основном независимы. Где есть зависимость, она указана явно.

**Обозначения объёма:** XS — минуты, несколько строк; S — до часа; M — полдня; L — день и больше.

**Риск:** вероятность что-то сломать: низкий / средний / высокий.

---

## Этап 0. Подготовка

### 0.1 Закоммитить текущую незавершённую работу — ✅ сделано (коммит `c9e5c38`)
- **Зачем:** рабочая копия содержит взаимозависимые изменения: переезд шрифтов, новые призы, Метрику. Без коммита диффы рефакторинга смешаются с ними, а закоммиченное состояние не собирается (AUDIT, «Состояние рабочей копии»).
- **Файлы:** все из `git status`, включая неотслеживаемые `src/app/fonts/*`, `src/assets/_img/prizes/*`, `public/music/2022|2023/prev.png`.
- **Объём:** XS. **Риск:** низкий.
- **Проверка:** `git status` чистый; `npx tsc --noEmit --incremental false` без ошибок; страницы открываются в `npm run dev`.

### 0.2 Зафиксировать исходное состояние — ✅ сделано (`baseline/README.md`; Docker-проверка B2 за владельцем)
- **Зачем:** чтобы потом сравнивать с ним результаты и подтвердить предположения из аудита (B1, B2, P6).
- **Действия:**
  1. Остановить `next dev` и выполнить `npx next build`, а не `npm run build`: так не перезапишется sitemap.
  2. Сохранить таблицу маршрутов: Size и First Load JS.
  3. Проверить, есть ли в `.next/server/app/music.html` текст «Ошибка загрузки треков». Если есть, B1 подтверждён.
  4. Сохранить ответы `/api/albums`, `/api/music-history`, `/api/media-content` в JSON: они понадобятся для сравнения на шаге 1.3.
  5. Запустить `npm audit --omit=dev`.
  6. Владелец: выполнить `docker build` текущим Dockerfile, это проверит B2.
- **Объём:** S. **Риск:** нет, только чтение.
- **Проверка:** есть заметка с цифрами baseline.

---

## Этап 1. Критичное и быстрые победы

### 1.1 Токен Telegram в переменные окружения (S1)
- **Файлы:** `src/app/api/sendMessage/route.ts`, новый `.env.example`, env прод-контейнера (вне репозитория).
- **Действия:**
  1. Владелец перевыпускает токен в @BotFather (`/revoke`).
  2. Код читает `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`. Если переменных нет, пишет `console.error` и отвечает 500.
  3. Новый токен передаётся в `.env.local` и в env Docker.
- **Объём:** XS. **Риск:** низкий. Основная опасность — забыть env в контейнере, и тогда форма перестанет отправлять. Лог это покажет.
- **Проверка:**
  - `grep -r "AAEY" src` ничего не находит;
  - локально заявка приходит в Telegram;
  - после деплоя проходит тестовая заявка;
  - старый токен больше не работает.

### 1.2 Обновить Next/React и транзитивные зависимости (S2) — ✅ сделано (next 15.5.27, react 19.3.0)
- **Файлы:** `package.json`, `package-lock.json`.
- **Действия:**
  1. `npm audit fix` без `--force`. По предпросмотру: `next → 15.5.27`, `lodash → 4.18.1`, `sharp → 0.35.5`.
  2. `npm i react@^19 react-dom@^19` — последний 19.x.

  На мажорные `music-metadata@12`, `next-sitemap` и Next 16 пока не переходим.
- **Объём:** S. **Риск:** средний. Переход внутри 15.x с 15.1 на 15.5 может принести предупреждения, изменения в типах сгенерированных `.next/types` и в поведении кэша.
- **Проверка:**
  - `npm audit --omit=dev` не показывает critical и high по `next`;
  - `npx tsc --noEmit` проходит;
  - `npx next build` проходит;
  - smoke-чек-лист целиком.

### 1.3 Убрать `fetch` на localhost: слой данных `src/lib/content` (B1, A1, частично B14, P7) — ✅ сделано (обе страницы `revalidate = 3600`; API-роуты оставлены обёртками)
- **Файлы:**
  - новые: `src/lib/content/albums.ts` (`getAlbums`), `src/lib/content/musicHistory.ts` (`getMusicHistory`), `src/lib/content/mediaContent.ts` (`getMediaContent`);
  - тексты переносятся в новые `src/data/musicHistory.ts` и `src/data/mediaContent.ts`;
  - правятся: `src/app/music/page.tsx`, `src/app/media/page.tsx`, три `src/app/api/*/route.ts`.
- **Суть:**
  - Страницы вызывают функции напрямую (`Promise.all` для двух вызовов на `/music`) и объявляют `export const revalidate = 3600` или делают страницу полностью статической.
  - Route handlers становятся обёртками над теми же функциями. Удалять их можно только после того, как владелец подтвердит, что снаружи API не используется.
  - Путь видео получает ведущий `/`, мутация общего массива убирается.
- **Объём:** M. **Риск:** средний: формат данных должен остаться прежним.
- **Проверка:**
  - в выводе `npx next build` `/music` и `/media` пререндерены;
  - в `.next/server/app/music.html` есть название альбома (например «Неразрушимый») и нет «Ошибка загрузки треков»;
  - ответы `/api/*` совпадают с JSON из шага 0.2;
  - пройден smoke по `/music` и `/media`.

### 1.4 Регистр в импорте Breadcrumbs (B2) — ✅ сделано (проверка на Linux/Docker — за владельцем)
- **Файлы:** `src/components/breadCrumb/BreadCrumb.tsx` (импорт → `./BreadCrumbs.module.scss`).
- **Объём:** XS. **Риск:** нет.
- **Проверка:** сборка на Linux (`docker build` или `npx next build` в WSL) проходит.

### 1.5 Лишний `setPlay` в Album (B3) — ✅ сделано (заодно убран ненужный проп `statusPlay` у `Album`/`AlbumList`)
- **Файлы:** `src/app/music/PlayMusic/album/Album.tsx:35`.
- **Объём:** XS. **Риск:** низкий.
- **Проверка:** пункты 1–2 чек-листа в `src/app/music/CLAUDE.md`; повторный клик по текущему альбому ставит паузу и снимает её.

### 1.6 Защита формы заявки (S3, S4, B13) — ✅ сделано (правила в `src/lib/validation/feedback.ts`; реальная отправка проверена владельцем)
- **Файлы:** `src/app/api/sendMessage/route.ts`, `src/app/popup/components/popup/Popup.tsx`, `input/Input.tsx`, `input/ListInput.tsx` (скрытое поле-honeypot), при необходимости новый `src/lib/validation/feedback.ts`.
- **Сервер:**
  - строки обрезаются, длины ограничиваются: имя ≤ 50, контакт ≤ 30, сообщение ≤ 2000;
  - honeypot;
  - rate-limit по IP в памяти, например не больше 5 запросов за 10 минут, ответ 429;
  - CORS-заголовки и мёртвая ветка OPTIONS удаляются;
  - клиенту отдаётся общая ошибка.
- **Клиент:**
  - `fetch('/api/sendMessage')`;
  - состояние «отправляется» и блокировка кнопки;
  - `type` и `inputMode` у полей;
  - удаление `console.log`.
- **Объём:** S–M. **Риск:** низкий–средний.
- **Проверка:**
  - валидная заявка доходит;
  - пустые поля дают ошибку в UI;
  - `curl` с сообщением на 3000 символов получает 400;
  - 6 быстрых запросов: последний получает 429;
  - в ответе нет `Access-Control-Allow-Origin`;
  - двойной клик отправляет одно сообщение.

### 1.7 Убрать `saas` и `node-fetch` (S5, P7) — ✅ сделано (используется встроенный `fetch`)
- **Файлы:** `package.json`, lock, импорт в `src/app/api/sendMessage/route.ts`: используется встроенный `fetch`.
- **Объём:** XS. **Риск:** низкий.
- **Проверка:** `npm ls saas node-fetch` пусто; сборка проходит; заявка отправляется.

### 1.8 Убрать `/popup` из sitemap (B15) — ✅ сделано
- **Файлы:** `next-sitemap.config.js` (`exclude: ['/popup']`).
- **Объём:** XS. **Риск:** нет.
- **Проверка:** после `npm run build` в `public/sitemap-0.xml` нет `/popup`.

---

## Этап 2. Исправления поведения

### 2.1 Хук `useBodyScrollLock` (B4) — ✅ сделано (счётчик в `lockBodyScroll`, `bodyLock`/`bodyUnLock` удалены)
- **Файлы:**
  - новый `src/hooks/useBodyScrollLock.ts`: счётчик блокировок, снятие в cleanup;
  - правятся: `PlayMusicClient.tsx`, `MediaContentList.tsx`, `Steps.tsx`, `ImageMediaContent.tsx` (убрать вызов из рендера), `src/scripts/scrollTo.ts`;
  - убрать точечные `bodyUnLock` из `onClick` у ссылок (`MediaDescription.tsx`, `MediaContentList.tsx`).
- **Объём:** M. **Риск:** средний: затрагивает прокрутку на `/music` и `/media`.
- **Проверка:**
  - открыть и закрыть список треков, попап наград и видео в истории, полноэкранный слайдер на `/media`;
  - с каждым открытым оверлеем перейти на другую страницу: там скролл работает;
  - пошаговая прокрутка истории работает как раньше.

### 2.2 Rules of Hooks (B5) — ✅ сделано (хуки выше раннего `return`, крошки скрываются `@media`)
- **Файлы:** `src/components/slider/Slider.tsx` (хуки выше `return`), `src/components/breadCrumb/BreadCrumb.tsx` и `BreadCrumbs.module.scss` (видимость через `@media`, без `window.innerWidth`).
- **Объём:** S. **Риск:** низкий.
- **Проверка:**
  - на ширине меньше 560px крошки видны, на десктопе не мелькают;
  - слайдеры работают;
  - `node .design-sync/build-dist.mjs` собирается: оба компонента экспортируются в design-sync.

### 2.3 Метрика с учётом переходов внутри SPA (B6) — ✅ сделано (`next-yandex-metrica` удалён, свой компонент в `layout.tsx`)
- **Файлы:**
  - новый `src/components/analytics/YandexMetrika.tsx` (`"use client"`, `next/script` + `useEffect` по `usePathname`/`useSearchParams` → `ym(id,'hit',url)`, обёрнут в `Suspense`);
  - `src/app/layout.tsx`;
  - `src/app/template.tsx` (убрать провайдер);
  - константа `YM_ID` в `src/constants/`;
  - замена литерала в `ButtonStandartSize.tsx` и `ButtonSmallSize.tsx`;
  - пакет `next-yandex-metrica` удалить или оставить только его хелпер `ym`.
- **Объём:** S. **Риск:** низкий–средний (аналитика).
- **Проверка:** открыть сайт с `?_ym_debug=1` и походить по страницам. В консоли один `init` и `hit` на каждый переход; цели `reachGoal` по кнопкам отправляются.

### 2.4 Тема без вспышки (B7) — ✅ сделано (inline-скрипт в `<head>` layout)
- **Файлы:** `src/app/layout.tsx` (inline-скрипт в `<head>`, `suppressHydrationWarning`), `src/components/header/SelectThemeButton.tsx` (начальное значение из `document.documentElement`).
- **Объём:** S. **Риск:** низкий.
- **Проверка:** с тёмной темой жёсткая перезагрузка любой страницы идёт без белой вспышки; переключение сохраняется; превью `SelectThemeButton` в design-sync работает.

### 2.5 Мелкие правки плеера (B8, B9, B10, B11) — ✅ сделано
- **Файлы:** `player/Player.tsx`, `commands/Command.tsx`, `commands/LineTrack.tsx`, логика альбомов (`src/lib/content/albums.ts` после 1.3 или `api/albums/route.ts` до).
- **Суть:**
  - таймер переносится в `useEffect` с очисткой;
  - `play().catch(() => setPlay(false))`;
  - эффекты зависят от `isPlaying`, а не от объекта;
  - кнопки на краях альбома ничего не делают;
  - защита от `NaN%`; Pointer Events для перемотки; типизация пропсов `LineTrack`;
  - натуральная сортировка альбомов и треков; fallback длительности `'0:00'`.
- **Объём:** S–M. **Риск:** средний.
- **Проверка:**
  - весь чек-лист из `src/app/music/CLAUDE.md`;
  - в альбоме «2022» треки идут 1…11;
  - в консоли нет `Uncaught (in promise)`.

### 2.6 Мелочи `/media` и списка альбомов (B12, B16, B17) — ✅ сделано
- **Файлы:** `ImageMediaContent.tsx` (убрать `scrollTo(0)`), `MediaItem.tsx` (убрать `console.log`), `AlbumList.tsx` (порядок `[...limit, ...last]`, кнопка скрыта, если скрытых нет, `useMemo`).
- **Объём:** XS–S. **Риск:** низкий.
- **Проверка:** при изменении размера окна на `/media` позиция не сбрасывается; «Показать еще» дописывает альбомы в конец и прячется, когда показывать нечего.

---

## Этап 3. Оптимизация

### 3.1 Кэш списка альбомов (P1) — ✅ сделано (кэш длительностей по пути+размеру+mtime файла, `parseFile`; в tsconfig `customConditions: ["node"]` для типов `parseFile`)
- **Зависит от:** 1.3. Можно сделать и раньше, прямо в route.
- **Файлы:** `src/lib/content/albums.ts`.
- **Суть:** кэш на уровне модуля с ключом по `mtime` папок; `fs.promises`; `parseFile(path, { duration: true })` вместо `readFileSync` + `parseBuffer`.
- **Объём:** S. **Риск:** низкий–средний.
- **Проверка:**
  - повторный `curl -w "%{time_total}" /api/albums` быстрее 20 мс (baseline: 150–420 мс);
  - длительности совпадают с JSON из 0.2;
  - новый трек в папке появляется после перезапуска или изменения `mtime`.

### 3.2 Видео без полной предзагрузки (P3) — ✅ сделано (`preload="metadata"`)
- **Файлы:** `src/app/music/MeHistory/steps/media-content/video/Video.tsx` (`preload="metadata"`).
- **Объём:** XS. **Риск:** низкий.
- **Проверка:** во вкладке Network при открытии `/music` по `mp4` скачиваются килобайты, а не 35 МБ; видео стартует по клику.

### 3.3 `sizes` и `priority` у картинок (P4, P5) — ✅ сделано (у слайдеров проп `sizes`, по умолчанию `100vw`; на `/media` `750px`, в попапе наград до `900px`, миниатюры `120px`; `priority` у обложек убран)
- **Файлы:** `ImageComparisonSlider.tsx`, `Slider.tsx`, `ImageList.tsx`, `Album.tsx`.
- **Объём:** S. **Риск:** низкий: картинки могут стать мутнее, если `sizes` занижен.
- **Проверка:**
  - в Network у миниатюр наград параметр `/_next/image?...&w=` не больше 640;
  - визуально чётко на retina;
  - Lighthouse Performance не хуже baseline.

### 3.4 Прокрутка без ре-рендеров (P2) — ✅ сделано (`opacity` через `useScroll`/`useTransform` и чистую `fadeOpacity()`, параллакс через `MotionValue`; добавлен Vitest)
- **Файлы:** `ImageMediaContent.tsx`, `MediaItem.tsx` (`opacity` через `useScroll`/`useTransform`), `src/components/bg-page/Background.tsx` и `BgRectangle.tsx` (параллакс через `MotionValue`).
- **Объём:** M. **Риск:** средний: визуальное поведение должно совпасть.
- **Проверка:**
  - сравнить с записью экрана из baseline;
  - в React DevTools Profiler при прокрутке нет коммитов;
  - превью `Background`/`BgRectangle` в design-sync собираются.

### 3.5 lodash точечно (P6) — ✅ сделано (размер не изменился: Next 15 и так переписывает `import { x } from "lodash"` в `lodash/x` через встроенный `modularizeImports`; `/media` 164 kB до и после, полного lodash в чанках не было)
- **Файлы:** `ImageMediaContent.tsx` (`import debounce from 'lodash/debounce'`).
- **Объём:** XS. **Риск:** нет.
- **Проверка:** First Load JS `/media` в `next build` меньше baseline.

### 3.6 (опционально) LazyMotion (P8) — ⏭ пропущено владельцем (framer-motion ≈44 kB gzip на каждой странице через `template.tsx`; LazyMotion дал бы −12…15 kB ценой правки 31 файла и обёртки для design-sync)
- **Когда:** только если по итогам 3.5 framer-motion заметно весит в бандле.
- **Объём:** M. **Риск:** средний.
- **Проверка:** First Load JS и визуальный smoke.

---

## Этап 4. Качество кода и инструменты

### 4.1 ESLint (A7) — ✅ сделано (`eslint@9` + `eslint-config-next@15.5.27` через `FlatCompat`, `next/core-web-vitals` + `next/typescript`; исправлены 6 ошибок, 24 предупреждения ниже)
- **Файлы:** `package.json` (`eslint`, `eslint-config-next`, скрипт `"lint": "eslint ."`), новый `eslint.config.mjs` (flat config с `next/core-web-vitals`, `react-hooks`).
- **Суть:** исправить только ошибки, предупреждения записать в отдельный список.
- **Объём:** S–M. **Риск:** низкий.
- **Проверка:** `npm run lint` проходит; сборка проходит.
- **Исправленные ошибки:** `any` в `ButtonDown`/`ButtonRight` (кнопки стали generic по типу `param`, пропсы прежние), пустой интерфейс `IImageMedia` (стал алиасом `IMediaImage`), `any` в `src/scripts/idArray.ts` (файл не использовался и удалён, это пункт из 4.3).
- **Оставшиеся предупреждения** (на 2026-10-08, разбирать в 4.3–5.1):
  - `react-hooks/exhaustive-deps`: `Steps.tsx:120`, `MediaContentList.tsx:31`, `Player.tsx:75`, `Player.tsx:108`, `ImageComparisonSlider.tsx:41`. Не чинить механически: добавление зависимостей меняет, когда срабатывают эффекты. Плеер — в 5.1, «история» — в 5.2 (`Steps.tsx` и `MediaContentList.tsx` ушли вместе с перехватом прокрутки, после 5.2 — 8 предупреждений).
  - ~~`no-unused-vars`~~: убраны в 4.3, после неё 13 предупреждений; после 4.4 — 11.
  - `no-unused-expressions` (`a && a()` вместо `a?.()` или `if`): `ImageMediaContent.tsx:31`, `Popup.tsx:70–71`, `ButtonMore` в `onClick` (до 4.4 — `ButtonDown`/`ButtonRight`).
  - `@next/next/no-img-element`: `YandexMetrika.tsx:45` — пиксель `<noscript>`, так и задумано; можно подавить комментарием.

### 4.2 Типы React 19 (A7) — ✅ сделано (`@types/react@^19.3`, `@types/react-dom@^19.3`; `MutableRefObject` → `RefObject` в `player.ts` и `LineTrack.tsx`; в `Volume.tsx` `onInput` → `onChange`: типы React 19 дают в `onInput` `InputEvent` без `target.value`, а `onChange` у range срабатывает на каждое движение так же, как `input`)
- **Файлы:** `package.json` (`@types/react@^19`, `@types/react-dom@^19`), `src/interfaces/player.ts` (`MutableRefObject` → `RefObject`) и то, что найдёт `tsc`.
- **Объём:** S. **Риск:** низкий.
- **Проверка:** `npx tsc --noEmit` без ошибок.

### 4.3 Удалить мёртвый код (A3) — ✅ сделано (удалены файлы и иконки из A3, `getWidthScroll`, неиспользуемые импорты и состояния; `act` в `ButtonDown`/`ButtonRight` вместе с классом `.active` и текстом «Скрыть»; закомментированная ссылка на Instagram в `Header` (константа `myInst` и `inst.svg` оставлены). `idArray.ts` и `PlayMusicClient.module.scss` к этому моменту уже были удалены)
- **Файлы:** список из AUDIT A3. **`PopupParent` не трогать**: он экспортируется в design-sync.
- **Объём:** S. **Риск:** низкий.
- **Проверка:** `tsc`, `next build`, `node .design-sync/build-dist.mjs`.

### 4.4 Убрать дублирование (A4) — ✅ сделано (`ButtonMore` с `direction: 'down' | 'right'` в `button-more/`, design-sync: `entry.ts`, `config.json`, одно превью `previews/ButtonMore.tsx`; `formatTime` в `src/scripts/formatTime.ts` с тестом; `title: { default, template: '%s' }` в layout — видимые заголовки по решению пользователя не меняются, страницы больше не повторяют `robots`/`authors`, `locale` берут из `baseOpenGraph` в `src/data/metadata.ts`, потому что Next заменяет `openGraph` целиком; детектор тача один — `isTouchDevice()` с константой `TOUCH_MAX_WIDTH`, хук `useIsTouchDevice` вызывает его в эффекте)
- **Суть и файлы:**
  - `ButtonRight` + `ButtonDown` → один компонент с `direction`. Править `.design-sync/entry.ts`, `config.json`, `previews/`.
  - `formatTime` → `src/scripts/formatTime.ts`.
  - Общие `metadata` в `layout.tsx` с `title.template`; страницы задают только своё.
  - Один детектор тача.
- **Объём:** M. **Риск:** средний, в основном из-за design-sync.
- **Проверка:** `tsc`, `build`, корректные `<title>` на всех страницах, сборка design-sync.

### 4.5 Sass `@use` вместо `@import` (A7) — ✅ сделано (`@use './theme'` в `globals.scss`; скомпилированный CSS побайтно совпадает)
- **Файлы:** `src/styles/globals.scss`.
- **Объём:** XS. **Риск:** низкий.
- **Проверка:** сборка без deprecation-предупреждений Sass; темы работают.

### 4.6 Доступность (A8) — ✅ сделано (миксин `vars.button-reset` в `variables.scss`; кнопки с `aria-label` в плеере, списке треков, «Показать еще» (`aria-expanded`), чекпоинтах (`aria-current="step"`), полноэкранном режиме /media; `ScrollToArrow` — обработчик на `<button>`, фокус больше не скрыт; у `ActionButton` вариант-ссылка `href` вместо `<Link><button>`, design-sync: превью и `conventions.md`; `alt` наград «Награда N»; ползунок громкости показывается и при фокусе; стрелки ↑/↓ листают историю, только когда фокус внутри её блока — блок получил `tabIndex={-1}`, чтобы клик мышью внутри тоже давал фокус. Сверх списка: кнопка «Список треков» в `Player.tsx` (плеер выезжает при фокусе внутри), крестик полноэкранного слайдера истории, `SelectThemeButton` (`aria-pressed`), точки `SlideNotes` («Слайд N»). **Не сделано:** кнопки разделов на главной (`ButtonStandartSize`) — кликабельный `div` с подменю из пустых ссылок; нужна отдельная переделка в раскрывающийся список)
- **Файлы:** `Command.tsx`, `ListTracks.tsx`, `Volume.tsx`, `ClosePlayer.tsx`, `AlbumList.tsx`, `CheckPoints.tsx`, `ScrollToArrow.tsx`, `MediaItem.tsx`, `ImageList.tsx`, `Steps.tsx`.
- **Суть:**
  - `<button type="button">` с `aria-label` вместо кликабельных `div` и `svg`;
  - осмысленные `alt`;
  - убрать `<Link><button>`;
  - стрелки клавиатуры перехватывать только при фокусе в блоке истории.
- **Объём:** M. **Риск:** средний: стили кнопок, `reset` у `button`.
- **Проверка:** пройти сайт только с клавиатуры; Lighthouse Accessibility не ниже baseline.

### 4.7 README и `.env.example` (A7) — ✅ сделано (README на русском: запуск, команды, env, добавление контента; `.env.example` с `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` — код читает их только после 1.1; `.env` добавлен в `.gitignore`)
- **Файлы:** `README.md`: как запустить, переменные окружения, как добавить альбом или медиа. Ссылка на `CLAUDE.md`.
- **Объём:** XS. **Риск:** нет.

---

## Этап 5. Крупный рефакторинг

### 5.1 `useAudioPlayer`: единое состояние плеера (A2) — ✅ сделано (переходы в чистом `playerReducer.ts` с тестами, хук `useAudioPlayer` держит громкость и единственный вызов `play()`/`pause()`; один `<audio>` на всё время работы плеера, меняется только `src`; `src/interfaces/player.ts` удалён; по решению владельца после окончания трека включается следующий, после последнего — пауза)
- **Зависит от:** 1.5, 2.5.
- **Файлы:**
  - новый `src/app/music/PlayMusic/useAudioPlayer.ts` (или контекст);
  - `PlayMusicClient.tsx`, `Player.tsx`, `Command.tsx`, `LineTrack.tsx`, `Volume.tsx`, `AlbumInfo.tsx`, `ListTracks.tsx`, `Album.tsx`, `AlbumList.tsx`, `src/interfaces/player.ts`.
- **Суть:**
  - один источник правды: альбом, индекс трека, `isPlaying`, громкость, готовность;
  - `play()` и `pause()` вызываются только в одном месте;
  - никаких `audio.src = ""`;
  - компоненты получают узкие пропсы.
  - Отдельно спросить владельца: переходить ли к следующему треку после окончания текущего (сейчас воспроизведение останавливается).
- **Объём:** L. **Риск:** высокий.
- **Проверка:** полный чек-лист из `src/app/music/CLAUDE.md` на десктопе и на мобильном; по желанию — Playwright-тест сценариев плеера (5.3).

### 5.2 «История» из единого источника (A5) — ✅ сделано (данные и условия от `length` — 7e05739; прокрутка — вариант C: закреплённая секция на нативной прокрутке)
- **Файлы:** `src/data/musicHistory.ts` (текст + иконка + медиа в одном массиве), `History.tsx`, `CheckPoints.tsx`, `Steps.tsx`, `MediaContentList.tsx`, `src/data/checkpoints.ts` (удалить).
- **Суть:**
  - условия считаются от `length`, без хардкода 3 шагов;
  - уникальные `id`;
  - перехват колеса и тапов пересмотреть, например на `IntersectionObserver` или обычную прокрутку со sticky. **Это решение UX, согласовать с владельцем.**
- **Объём:** M–L. **Риск:** высокий: меняется поведение прокрутки.
- **Проверка:** временно добавить 4-й шаг, навигация работает; ручной прогон истории колесом, стрелками и тапами.

### 5.3 Тесты (A7)
- **Файлы:** `vitest` + `@playwright/test` в devDependencies, `tests/`.
- **Vitest:**
  - сканирование альбомов на временной папке (обложка, `artist.txt`, сортировка, папка без треков);
  - `formatTime`;
  - валидация формы и rate-limit.
- **Playwright smoke:**
  - все 4 страницы отвечают 200 и без ошибок в консоли;
  - валидация формы (с моком `/api/sendMessage`);
  - плеер открывается и переключает трек.
- **Объём:** M. **Риск:** низкий.
- **Проверка:** `npm test` и `npx playwright test` проходят локально. По желанию — GitHub Actions: `tsc`, `lint`, `test`, `build` на Linux. Это заодно ловит проблемы вроде B2.

### 5.4 (опционально) Переименования (A6)
- **Суть:**
  - `checpoints` → `checkpoints`;
  - `Standart` → `Standard`;
  - `ErrorMesage` → `ErrorMessage`;
  - `dekstop`, `comands`, `rabota`;
  - единые импорты шрифтов через `@/app/fonts/fonts`.
- **Объём:** S–M. **Риск:** низкий–средний: много импортов, на Windows переименования только регистра делать через `git mv`.
- **Проверка:** `tsc`, `build` (в том числе на Linux), сборка design-sync.

---

## Smoke-чек-лист (после каждого шага)
1. `npx tsc --noEmit --incremental false` без ошибок; с этапа 4.1 ещё `npm run lint`.
2. `/`: фото и заголовок; кнопки разделов раскрываются, ссылки ведут куда нужно; переключатель темы; ссылка на Telegram в шапке.
3. `/music`: альбомы показываются, «Показать еще» работает; плеер по чек-листу из `src/app/music/CLAUDE.md`; история переключается, попап наград и видео открывается и закрывается.
4. `/media`: три блока; слайдер до/после (движение ползунка); переключение картинок кликом; полноэкранный режим, кнопки «Далее»/«Назад»/«Выйти»; «Оставить заявку» ведёт на `/popup`.
5. `/popup`: валидация полей, отправка (с этапа 1.1 — на тестовые данные).
6. Ширина 375px и тач-эмуляция в DevTools: шапка, хлебные крошки, плеер.
7. Если тронут `src/components` — `node .design-sync/build-dist.mjs`.

## Что согласовать с владельцем по ходу
- Используются ли `/api/*` кем-то снаружи? Если нет, после 1.3 их можно удалить.
- Нужен ли автопереход к следующему треку (5.1)? — да.
- Как должна вести себя прокрутка «истории» (5.2)? — закреплённая секция: шаг выбирается по прогрессу нативной прокрутки (вариант C; B — обычная лента со sticky-чекпоинтами — владелец посмотрел и попросил заменить на C).
- Переход на Next 16 и `music-metadata@12` — отдельной задачей после этапа 1.
