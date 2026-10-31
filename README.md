# showmyworks.ru


Личный сайт-портфолио Картузова Степана: музыка, медиаконтент и форма заявки. Прод: https://showmyworks.ru.

Стек: Next.js 15 (App Router), React 19, TypeScript, SCSS Modules, framer-motion.

Подробности об устройстве проекта, соглашения и ловушки описаны в [CLAUDE.md](CLAUDE.md). Известные проблемы перечислены в [docs/plans/done/AUDIT.md](docs/plans/done/AUDIT.md), план их исправления — в [docs/plans/done/REFACTOR_PLAN.md](docs/plans/done/REFACTOR_PLAN.md). Текущий план правок – [DESIGN_FIXES_7_PLAN.md](DESIGN_FIXES_7_PLAN.md).

## Запуск

Нужен Node.js 20 или новее.

```bash
npm ci
npm run dev      # dev-сервер на http://localhost:3000
```

| Что | Команда |
|---|---|
| Прод-сборка | `npm run build` (после неё `next-sitemap` перезаписывает `public/sitemap*.xml` и `public/robots.txt`) |
| Запуск собранного | `npm start` |
| Проверка типов | `npx tsc --noEmit --incremental false` |
| Линтер | `npm run lint` |
| Тесты (Vitest) | `npm test` |
| Smoke-тесты в браузере (Playwright) | `npm run test:e2e`: нужен установленный Microsoft Edge; сам собирает проект и поднимает его на :3003. При запущенном `npm run dev` сначала останови его: обе команды пишут в `.next` |

Не запускайте `npm run build`, пока работает `npm run dev`: оба пишут в `.next`, и сборка ломает dev-сервер.

Прод работает в Docker. Dockerfile и конфиг деплоя лежат вне репозитория.

## Переменные окружения

Шаблон лежит в [.env.example](.env.example). Для локальной разработки скопируйте его в `.env.local`: этот файл в git не попадает.

| Переменная | Зачем |
|---|---|
| `TELEGRAM_BOT_TOKEN` | токен бота, через которого `/api/sendMessage` пересылает заявки |
| `TELEGRAM_CHAT_ID` | чат, куда приходят заявки |

Переменные нужно задать и в `.env.local`, и в env Docker-контейнера. Без них форма не отправляет заявки: `/api/sendMessage` отвечает 500 и пишет в лог `TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set`.

## Как добавить контент

Код менять не нужно, достаточно положить файлы в `public/`. Страницы `/music` и `/media` обновляются раз в час, поэтому новый контент на проде появится в течение часа (или сразу после пересборки).

### Альбом

Создайте папку `public/music/<Название альбома>/` и положите в неё:

- треки в `.mp3`, `.wav`, `.ogg` или `.flac`. Порядок задаёт имя файла, числа сравниваются как числа: `2.mp3` идёт раньше `10.mp3`;
- обложку `prev.png` (необязательно);
- `artist.txt` с именем исполнителя (необязательно, по умолчанию «SyrinxBS»).

Альбом без обложки попадает в скрытую часть списка, под кнопку «Показать еще». Папка без треков пропускается.

### Медиа на `/media`

- **Слайдер до/после:** пара файлов `public/media/images/<N>_low.<ext>` и `<N>_high.<ext>` с одинаковым расширением (`png`, `webp` или `jpg`).
- **Создание битов:** остальные картинки из `public/media/images/`.
- **Видеопереходы:** любые файлы в `public/media/gifs/`.

### Видео в истории на `/music`

Файлы `public/video/*.mp4` показываются на первом шаге истории.
