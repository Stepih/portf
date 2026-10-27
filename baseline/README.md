# Baseline (шаг 0.2 docs/plans/done/REFACTOR_PLAN.md)

Снято 2026-10-07 на коммите `9a97234`. Node v22.23.2, Next.js 15.1.6, Windows.

## `npx next build`

| Маршрут | Size | First Load JS |
|---|---|---|
| `/` | 5.05 kB | 177 kB |
| `/_not-found` | 986 B | 107 kB |
| `/api/albums` | 144 B | 106 kB |
| `/api/media-content` | 144 B | 106 kB |
| `/api/music-history` | 931 B | 107 kB |
| `/api/sendMessage` | 144 B | 106 kB |
| `/media` | 2.92 kB | 163 kB |
| `/music` | 10.5 kB | 171 kB |
| `/popup` | 4.5 kB | 157 kB |
| Общий JS | | 106 kB |

Предупреждение при сборке: Sass `@import` в `src/styles/globals.scss` устарел (A7, шаг 4.5).

## B1 подтверждён
- Во время пререндера пять раз `fetch failed … ECONNREFUSED`: сервер на :3000 не запущен, но сборка всё равно проходит.
- **Первая сборка выглядела нормальной:** данные альбомов подставились из `.next/cache/fetch-cache`, оставшегося после `next dev`. Поэтому локальная сборка может выглядеть рабочей, а прод — нет.
- Сборка без fetch-кэша (так собирается чистый Docker):
  - в `.next/server/app/music.html` есть «Ошибка загрузки треков» и нет альбомов (`Неразрушимый` не встречается ни разу);
  - `.next/server/app/media.html` собирается без картинок (`_low` не встречается).
- Обе страницы помечены `○ (Static)`, с `revalidate` 100 и 1 с. Пустой результат обновится только при ISR-перегенерации, если она пройдёт успешно.

## API (`next start`, тёплый сервер, 3 запроса)
| Эндпоинт | Размер ответа | Время |
|---|---|---|
| `/api/albums` | 2619 B | 102–132 мс |
| `/api/music-history` | 3057 B | 23–42 мс |
| `/api/media-content` | 1510 B | 19–26 мс |

Ответы сохранены рядом: `api-*.json`. С ними сравниваем на шаге 1.3, а время — на шаге 3.1.

## `npm audit --omit=dev`
22 уязвимости: 1 low, 3 moderate, 17 high, 1 critical.
- critical: `next` (диапазон до 16.3.0-preview.10).
- high, среди прочих: `postcss`, `sharp`, `source-map-js`, `svgo`.
- Всё закрывается через `npm audit fix` (шаг 1.2).

## Не сделано
- `docker build` текущим Dockerfile (B2) — за владельцем, Dockerfile вне репозитория.
