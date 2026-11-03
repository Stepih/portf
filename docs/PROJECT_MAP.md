# Устройство проекта

Справка к `CLAUDE.md`: открывай, когда нужно найти, где что лежит, или добавить контент.

## Карта проекта
```
src/app/                 маршруты (App Router)
  (home)/                главная-лендинг: блоки в (home)/components, тексты в src/data/offer.ts
  sites/, ai/            страницы услуг (SERVICES_PLAN), сцены /ai – ai/components/scenes
  portfolio/             список работ и страницы кейсов (данные – src/data/portfolio*.ts)
  music/                 плеер альбомов (PlayMusic/) + «история» (MeHistory/); свои правила — src/app/music/CLAUDE.md
  media/                 услуги медиаконтента: слайдеры до/после, gif, превью битов
  popup/                 страница формы заявки (это обычная страница, не попап) → POST /api/sendMessage
  api/albums             обёртки над src/lib/content для доступа к данным по HTTP
  api/music-history
  api/media-content
  api/sendMessage        пересылает заявку в Telegram-бот
  api/chat               демо-чат (BotHub)
  fonts/fonts.ts         экспорт шрифтов: allerta, ralewayRegular, ralewayBold, canada
  layout.tsx             Background + Header + <main> + Footer + YandexMetrika
  template.tsx           анимация появления страницы
src/components/          общие UI-компоненты; они же публичный набор design-sync (.design-sync/entry.ts)
src/data/                статичный контент и конфиг (offer.ts – тексты главной, заголовки страниц, поля формы, шаги «истории», тексты /media)
src/lib/content/         серверные функции данных: getAlbums (public/music), getMusicHistory (+ видео из public/video), getMediaContent (public/media)
src/lib/chat/            демо-чат: guard.ts, filters.ts, store.ts, prompt.ts
src/interfaces/          TS-типы, префикс I (IAlbums, IMedia, …)
src/constants/urls.ts    внешние и внутренние ссылки
src/scripts/             хелперы: lockBodyScroll/scrollToElementById, isTouchDevice (единственный детектор тача), formatTime
src/hooks/               useIsTouchDevice, useBodyScrollLock
src/styles/              globals.scss, theme.scss (CSS-переменные тем), variables.scss (SCSS-переменные)
src/assets/_img/         иконки (svg) и картинки
public/                  музыка, видео, медиа и sitemap
```

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

## Тесты подробно
- Vitest (`*.test.ts` рядом с кодом): чистые функции, сканирование альбомов на временной папке, валидация формы, rate-limit.
- Playwright (`tests/`): страницы без ошибок в консоли, форма заявки с моком `/api/sendMessage`, переключение трека. Браузер – установленный Edge (`channel: "msedge"`), браузеры Playwright не скачиваются.
- Покрытие узкое: ручной прогон страниц по-прежнему нужен.
- Известные предупреждения линтера – `docs/plans/done/REFACTOR_PLAN.md`, шаг 4.1.
