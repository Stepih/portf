# CLAUDE.md

Сайт-портфолио Картузова Степана (https://showmyworks.ru). Интерфейс и комментарии в коде – на русском. Где что лежит, как добавить альбом или медиа, подробности о тестах – `docs/PROJECT_MAP.md`.

## Планы и решения
- **Начинай с `docs/STATUS.md`** – текущий шаг, открытое и что читать под задачу. Большие файлы (планы, `DECISIONS.md`, `DESIGN.md`, `docs/services/`) читай по разделу: `grep -n "^## "` → диапазон строк. Скиллы – только когда задача их требует (impeccable – по команде шага, см. правило 2 `SERVICES_PLAN.md`).
- Продукт и аудитория – `PRODUCT.md`, визуальная система – `DESIGN.md` (скилл impeccable).
- Текущий план – `DESIGN_FIXES_8_PLAN.md` (Д41–Д47, по critique 11.11.2026); в его конце – отложенное и незакрытое из прошлых планов. `SERVICES_PLAN.md` выполнен (У1–У8), из него нужен только раздел «В план, позже»; факты об услугах – `docs/services/`. План **выполняй строго по разделу «Правила выполнения» своего файла**.
- **Решения владельца сведены в `docs/plans/DECISIONS.md` – перед правками сверяйся с разделом своей темы** (не весь файл); новое решение – одной строкой с датой и шагом. Архив планов – `docs/plans/done/`: целиком не читай, только нужный раздел. Комментарии вида «SALES_PLAN 4.2» ссылаются на эти файлы; разборы – `.impeccable/critique/`.

## Стек
Next.js 15 (App Router), React 19, TypeScript `strict`, SCSS Modules, `framer-motion`, SVG через `@svgr/webpack`, шрифты `next/font/local` (`src/app/fonts/`). Метрика – свой компонент `src/components/analytics/YandexMetrika.tsx`.

## Команды
| Что | Команда |
|---|---|
| Dev (порт 3000, владельца) | `npm run dev` |
| Прод-сборка | `npm run build` (postbuild `next-sitemap` перезаписывает `public/sitemap*.xml`, `robots.txt`); без sitemap – `npx next build` |
| Типы | `npx tsc --noEmit --incremental false` |
| Линтер | `npm run lint` – ошибок быть не должно |
| Vitest | `npm test` (`*.test.ts` рядом с кодом) |
| Playwright (Edge) | `npm run test:e2e`: собирает и поднимает на :3003, запущенный там сервер переиспользует |
| design-sync | `node .design-sync/build-dist.mjs` (см. `.design-sync/CLAUDE.md`) |

- При работающем `next dev` не запускай `next build` и `test:e2e`: оба пишут в `.next` и ломают dev. Сборку для e2e поднимай на :3003 из отдельной копии.

## Деплой
Vercel (с 22.10.2026); Dockerfile – вне репозитория. ФС чувствительна к регистру: пути в импортах – буква в букву. Env – в настройках Vercel, список – `.env.example`.

## Соглашения
- Компонент – папка `Name.tsx` + `Name.module.scss`, стили как `s`; `const Name: FC<Props> = …` и `export default Name`; пропсы рядом, общие типы – `src/interfaces` (префикс `I`). Алиас `@/*` → `src/*`.
- SVG – React-компонент (`<Icon className={s.icon} />`), **не URL**, в `next/image` не передавать.
- Цвета – только `var(--color-bg | --color-text-100 | --color-text-muted | --color-text-50 | --color-frost | --color-overlay)` из `theme.scss` (вторичный текст – `--color-text-muted`, `--color-text-50` – только линии и рамки). Тёмная тема – `data-theme="dark"` на `<html>` (`SelectThemeButton`, `localStorage.theme`).
- SCSS-переменные: `@use '/src/styles/variables.scss' as vars;` в каждом модуле. Шрифты – из `@/app/fonts/fonts`, через `font.className`.
- `"use client"` часто наследуется от родителя: импортируешь такой компонент в серверный – добавь директиву.
- Серверные страницы берут данные прямым вызовом `src/lib/content` (`revalidate = 3600`), не HTTP-запросом в свои `/api/*`.

## Ловушки
- **`src/components` экспортируется в Claude Design** (`.design-sync/entry.ts`): переименование, перенос или смена пропсов – правь `entry.ts`, `config.json`, `previews/`. `PopupParent` нужен только design-sync.
- **Не переноси `src/app/fonts/fonts.ts`** и не реэкспортируй шрифты: шим design-sync ищет путь `app/fonts/fonts`.
- **Turbopack не настроен:** без turbopack-rules для svgr импорты `.svg` сломаются.
- **`template.tsx` перемонтируется на каждой навигации** – поэтому Метрика в `layout.tsx`.
- **Блокировка скролла – только `useBodyScrollLock(active)`**, не `document.body.style.overflow`.
- **Шаги истории `/music` – только в `src/data/musicHistory.ts`**; новая иконка – в тип `HistoryIcon` и `MeHistory/checkpoints/icons.ts`. Свои правила плеера – `src/app/music/CLAUDE.md`.
- **Метрика:** ID только в `YM_ID` (`src/constants/analytics.ts`), вызовы – `ym`/`reachGoal` из `src/scripts/metrika.ts`; SPA-переходы шлёт `YandexMetrika`, первый hit – `init`.
- **Telegram:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` из env (без них форма – 500), отправка только через `sendTelegram` (`src/lib/telegram.ts`). Секреты в код не пишем.
- **Демо-чат `/api/chat` тратит деньги BotHub.** Проверки от накрутки – в роуте до вызова модели (`src/lib/chat/guard.ts`, `filters.ts`), лимиты и суточный бюджет – `CHAT_GUARD`, счётчики – `store.ts` (на Vercel нужен Upstash Redis). IP – только `getClientIp` (`src/lib/clientIp.ts`). Реальный API в тестах не вызывается, прогон `compare/` – только с разрешения владельца.
