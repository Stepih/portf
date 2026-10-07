# CLAUDE.md

Личный сайт-портфолио Картузова Степана (https://showmyworks.ru). Интерфейс на русском, комментарии в коде тоже на русском.

Известные проблемы и план исправлений описаны в `AUDIT.md` и `REFACTOR_PLAN.md`. Перед правками сверяйся с ними.

## Стек
- Next.js 15, App Router; React 19; TypeScript в режиме `strict`.
- Стили: SCSS Modules (`sass`). Анимации: `framer-motion`.
- SVG подключаются как React-компоненты через `@svgr/webpack` (`next.config.mjs`).
- Шрифты: `next/font/local`, файлы `.ttf` лежат в `src/app/fonts/`.
- `music-metadata` считает длительность треков; `next-sitemap` генерирует sitemap; `next-yandex-metrica` подключает Метрику.

## Команды
| Что | Команда |
|---|---|
| Dev-сервер (порт 3000) | `npm run dev` |
| Прод-сборка | `npm run build`. Postbuild-скрипт `next-sitemap` перезаписывает `public/sitemap*.xml` и `public/robots.txt` |
| Сборка без sitemap | `npx next build` |
| Запуск сборки | `npm start` |
| Проверка типов | `npx tsc --noEmit --incremental false` |
| Сборка design-sync | `node .design-sync/build-dist.mjs` (см. `.design-sync/CLAUDE.md`) |

- **Линтера нет.** ESLint не установлен, а `npm run lint` (`next lint`) вместо проверки предлагает его настроить.
- **Тестов нет.** Проверка — сборка, `tsc` и ручной прогон страниц.
- Если запущен `next dev`, не запускай `next build`. Оба пишут в `.next`, и сборка ломает работающий dev-сервер.

## Деплой
Прод работает в Docker на нестандартном порту. Dockerfile и конфиг деплоя лежат **вне репозитория**. ФС в контейнере чувствительна к регистру: пути в импортах должны совпадать с именами файлов буква в букву.

## Карта проекта
```
src/app/                 маршруты (App Router)
  (home)/                главная: TitleBlockPage + ButtonList (кнопки разделов из src/data/homeButtons.ts)
  music/                 плеер альбомов (PlayMusic/) + «история» (MeHistory/); свои правила — src/app/music/CLAUDE.md
  media/                 услуги медиаконтента: слайдеры до/после, gif, превью битов
  popup/                 страница формы заявки (это обычная страница, не попап) → POST /api/sendMessage
  api/albums             сканирует public/music → список альбомов и треков с длительностью
  api/music-history      тексты «истории» (захардкожены прямо в route) + видео из public/video
  api/media-content      тексты блоков /media + файлы из public/media
  api/sendMessage        пересылает заявку в Telegram-бот
  fonts/fonts.ts         экспорт шрифтов: allerta, ralewayRegular, ralewayBold, canada
  layout.tsx             Background + Header + <main> + Footer
  template.tsx           анимация появления страницы + провайдер Метрики
src/components/          общие UI-компоненты; они же публичный набор design-sync (.design-sync/entry.ts)
src/data/                статичный контент и конфиг (заголовки страниц, кнопки, чекпоинты, поля формы)
src/interfaces/          TS-типы, префикс I (IAlbums, IMedia, …)
src/constants/urls.ts    внешние и внутренние ссылки
src/scripts/             DOM-хелперы: bodyLock/bodyUnLock/scrollToElementById, isTouchDevice
src/hooks/               useIsTouchDevice
src/styles/              globals.scss, theme.scss (CSS-переменные тем), variables.scss (SCSS-переменные)
src/assets/_img/         иконки (svg) и картинки
public/                  музыка, видео, медиа и sitemap
```

Страницы `/music` и `/media` — серверные компоненты. Сейчас они получают данные через `fetch('http://localhost:3000/api/...')`, то есть ходят HTTP-запросом в собственные route handlers (см. AUDIT.md, B1). Клиентская интерактивность живёт в `"use client"`-компонентах ниже по дереву.

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
- **`template.tsx` перемонтируется на каждой навигации,** вместе со всем, что в нём лежит: Метрикой и анимацией.
- **Блокировка скролла глобальная.** `bodyLock()`/`bodyUnLock()` пишут прямо в `document.body.style`, вызовы разбросаны по music и media, автоматического снятия нет.
- **История на `/music` жёстко рассчитана на 3 шага.** Условия `step === 2` и `idx < 2` стоят в `Steps.tsx` и `CheckPoints.tsx`, а `src/data/checkpoints.ts` должен совпадать по длине с данными `api/music-history`.
- **ID Метрики `99704852`** захардкожен в `template.tsx`, `ButtonStandartSize.tsx` (2 раза) и `ButtonSmallSize.tsx`.
- **Токен Telegram-бота** сейчас лежит в коде `api/sendMessage/route.ts`. Это критичная проблема, см. AUDIT.md, S1. Новые секреты кладём только в env.
