# CLAUDE.md

Личный сайт-портфолио Картузова Степана (https://showmyworks.ru). Интерфейс на русском, комментарии в коде тоже на русском.

Известные проблемы и план исправлений описаны в `AUDIT.md` и `REFACTOR_PLAN.md`. Перед правками сверяйся с ними. План превращения сайта в продающий (оффер, цены, форма, Метрика) и решения владельца — в `SALES_PLAN.md`. Продолжение (разбор конверсии и конкурентов 22.10.2026) — `CONVERSION_PLAN.md`. Анимация блоков главной по скроллу (по два варианта на блок, демо в `/lab`) — `ANIMATION_PLAN.md`.

## Стек
- Next.js 15, App Router; React 19; TypeScript в режиме `strict`.
- Стили: SCSS Modules (`sass`). Анимации: `framer-motion`.
- SVG подключаются как React-компоненты через `@svgr/webpack` (`next.config.mjs`).
- Шрифты: `next/font/local`, файлы `.ttf` лежат в `src/app/fonts/`.
- `music-metadata` считает длительность треков; `next-sitemap` генерирует sitemap. Метрика подключена своим компонентом `src/components/analytics/YandexMetrika.tsx` (без библиотек).

## Команды
| Что | Команда |
|---|---|
| Dev-сервер (порт 3000) | `npm run dev` |
| Прод-сборка | `npm run build`. Postbuild-скрипт `next-sitemap` перезаписывает `public/sitemap*.xml` и `public/robots.txt` |
| Сборка без sitemap | `npx next build` |
| Запуск сборки | `npm start` |
| Проверка типов | `npx tsc --noEmit --incremental false` |
| Линтер | `npm run lint` |
| Тесты (Vitest) | `npm test` |
| Smoke-тесты (Playwright, Edge) | `npm run test:e2e`: собирает проект и поднимает на :3003; уже запущенный там сервер переиспользуется |
| Сборка design-sync | `node .design-sync/build-dist.mjs` (см. `.design-sync/CLAUDE.md`) |

- **Линтер:** `npm run lint` (ESLint 9, `eslint.config.mjs`: `next/core-web-vitals` + `next/typescript`). Ошибок быть не должно; известные предупреждения перечислены в REFACTOR_PLAN.md, шаг 4.1. `next build` тоже прогоняет ESLint.
- **Тесты.** Vitest (`npm test`, файлы `*.test.ts` рядом с кодом): чистые функции, сканирование альбомов на временной папке, валидация формы, rate-limit. Playwright (`npm run test:e2e`, папка `tests/`): страницы без ошибок в консоли, форма заявки с моком `/api/sendMessage`, переключение трека. Браузер — установленный Edge (`channel: "msedge"`), браузеры Playwright не скачиваются. Покрытие узкое: ручной прогон страниц по-прежнему нужен.
- `npm run test:e2e` запускает `next build`; при работающем `next dev` не запускай (см. ниже) — подними сборку на :3003 из отдельной копии, config её переиспользует.
- Если запущен `next dev`, не запускай `next build`. Оба пишут в `.next`, и сборка ломает работающий dev-сервер.

## Деплой
Прод разворачивается на Vercel (с 22.10.2026); раньше был Docker на нестандартном порту, возможно, вернётся – Dockerfile и его конфиг лежат **вне репозитория**. ФС и там и там чувствительна к регистру: пути в импортах должны совпадать с именами файлов буква в букву. Переменные окружения на Vercel – в настройках проекта; список – `.env.example`.

## Карта проекта
```
src/app/                 маршруты (App Router)
  (home)/                главная-лендинг: блоки в (home)/components, тексты в src/data/offer.ts
  music/                 плеер альбомов (PlayMusic/) + «история» (MeHistory/); свои правила — src/app/music/CLAUDE.md
  media/                 услуги медиаконтента: слайдеры до/после, gif, превью битов
  popup/                 страница формы заявки (это обычная страница, не попап) → POST /api/sendMessage
  api/albums             обёртки над src/lib/content для доступа к данным по HTTP
  api/music-history
  api/media-content
  api/sendMessage        пересылает заявку в Telegram-бот
  fonts/fonts.ts         экспорт шрифтов: allerta, ralewayRegular, ralewayBold, canada
  layout.tsx             Background + Header + <main> + Footer + YandexMetrika
  template.tsx           анимация появления страницы
src/components/          общие UI-компоненты; они же публичный набор design-sync (.design-sync/entry.ts)
src/data/                статичный контент и конфиг (продающие тексты главной (offer.ts), заголовки страниц, поля формы, шаги «истории» и тексты /media)
src/lib/content/         серверные функции данных: getAlbums (public/music), getMusicHistory (+ видео из public/video), getMediaContent (public/media)
src/interfaces/          TS-типы, префикс I (IAlbums, IMedia, …)
src/constants/urls.ts    внешние и внутренние ссылки
src/scripts/             хелперы: lockBodyScroll/scrollToElementById, isTouchDevice (единственный детектор тача), formatTime
src/hooks/               useIsTouchDevice, useBodyScrollLock
src/styles/              globals.scss, theme.scss (CSS-переменные тем), variables.scss (SCSS-переменные)
src/assets/_img/         иконки (svg) и картинки
public/                  музыка, видео, медиа и sitemap
```

Страницы `/music` и `/media` — серверные компоненты. Данные они получают прямым вызовом функций из `src/lib/content`, пререндерятся при сборке и обновляются раз в час (`revalidate = 3600`). Не ходи из страниц HTTP-запросом в собственные `/api/*` (см. AUDIT.md, B1). Клиентская интерактивность живёт в `"use client"`-компонентах ниже по дереву.

## Контент из файловой системы
Чтобы добавить контент, код менять не нужно: достаточно положить файлы.
- **Альбом**: папка `public/music/<Название>/`.
  - Внутри аудио `.mp3/.wav/.ogg/.flac`.
  - Необязательная обложка `prev.png`.
  - Необязательный `artist.txt` с исполнителем; по умолчанию «SyrinxBS».
  - Альбом без обложки попадает в скрытую часть списка («Показать еще»). Альбом без треков пропускается.
- **До/после** на `/media`: пары `public/media/images/<N>_low.<ext>` + `<N>_high.<ext>` с одинаковым `ext` (png/webp/jpg). Остальные файлы из `images/` идут в блок «Создание битов».
- **Видеопереходы**: всё, что лежит в `public/media/gifs/`.
- **Видео истории**: `public/video/*.mp4`, показываются на шаге 0.

## Соглашения
- Один компонент — одна папка: `Name.tsx` + `Name.module.scss`. Стили импортируются как `s` (`import s from './Name.module.scss'`).
- Компоненты пишутся как `const Name: FC<Props> = (...) => {}` с `export default Name`. Интерфейсы пропсов объявляются рядом, общие типы — в `src/interfaces`.
- SVG импортируется как React-компонент: `import Icon from '@/assets/_img/icons/x.svg'` → `<Icon className={s.icon} />`. Это **не URL**, в `next/image` его передавать нельзя.
- Цвета берутся только из CSS-переменных `var(--color-bg | --color-text-100 | --color-text-50 | --color-overlay)` из `theme.scss`: так работает тёмная тема.
- Тёмная тема включается атрибутом `data-theme="dark"` на `<html>`. Его ставит `SelectThemeButton`, выбор хранится в `localStorage.theme`.
- SCSS-переменные (`$shadow`, `$transition`, акцентные цвета) подключаются в каждом модуле строкой `@use '/src/styles/variables.scss' as vars;`.
- Шрифты импортируются из `@/app/fonts/fonts`, класс навешивается через `font.className`.
- Алиас `@/*` указывает на `src/*`.
- Директиву `"use client"` ставят не везде: многие клиентские компоненты наследуют её от родителя. Если импортируешь такой компонент из серверного, добавь директиву.

## Ловушки
- **`src/components` экспортируется в Claude Design** через `.design-sync/entry.ts`. Переименование, перенос файла или изменение пропсов требует правки `entry.ts`, `config.json` и `previews/`. `PopupParent` в приложении не используется, но нужен для design-sync.
- **Путь шрифтов.** Шим design-sync подменяет модуль по регулярке `app/fonts/fonts`. Не переноси `fonts.ts` и не реэкспортируй шрифты из другого места.
- **Turbopack не настроен:** SVG обрабатываются только webpack-правилом. Если включить `next dev --turbopack` без отдельных turbopack-rules для svgr, импорты `.svg` сломаются.
- **`template.tsx` перемонтируется на каждой навигации,** вместе со всем, что в нём лежит. Поэтому Метрика живёт в `layout.tsx`, а не здесь.
- **Блокировка скролла — только через `useBodyScrollLock(active)`** (`src/hooks`). Он держит счётчик в `lockBodyScroll()` (`src/scripts/scrollTo.ts`) и снимает блокировку при размонтировании. Не пиши в `document.body.style.overflow` напрямую.
- **Шаги истории на `/music` описаны только в `src/data/musicHistory.ts`** (подпись, ключ иконки, текст, медиа). Код считает шаги от длины массива. Новую иконку добавь в тип `HistoryIcon` и в `MeHistory/checkpoints/icons.ts`.
- **Метрика:** ID только в `YM_ID` (`src/constants/analytics.ts`), вызовы — через `ym`/`reachGoal` из `src/scripts/metrika.ts`. Переходы внутри SPA шлёт `hit` компонент `YandexMetrika`; первый hit отправляет сам `init`.
- **Токен Telegram-бота** и ID чата читаются из env (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`; локально `.env.local`, шаблон `.env.example`). На проде их нужно задать отдельно, иначе форма отвечает 500. Отправка – только через `sendTelegram` (`src/lib/telegram.ts`). Секреты в код не пишем.
- **Демо-чат `/api/chat`** (CONVERSION_PLAN К3.2) тратит деньги BotHub. Все проверки от накрутки – в роуте до вызова модели (`src/lib/chat/guard.ts`, `filters.ts`), лимиты и бюджет на сутки – в `CHAT_GUARD`. Счётчики – в `src/lib/chat/store.ts`: на Vercel нужен Upstash Redis, без него чат отвечает 500. IP – только через `getClientIp` (`src/lib/clientIp.ts`). Реальный API в тестах не вызывается, прогон моделей (`compare/`) – только с разрешения владельца.
