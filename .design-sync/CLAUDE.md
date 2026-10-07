# .design-sync — синхронизация компонентов с Claude Design

Здесь собираются компоненты из `src/components` в библиотеку `PortfolioUI` (`window.PortfolioUI`) для Claude Design. На сайт эта папка не влияет.

- **Сборка:** `node .design-sync/build-dist.mjs` из корня репозитория.
  - Нужен `esbuild` из `.ds-sync/node_modules`; это зависимости конвертера, они в `.gitignore`.
  - Результат пишется в `.design-sync/.cache/dist/`, тоже в `.gitignore`.
- **Публичный набор компонентов** перечислен в `entry.ts`. Строка экспорта должна иметь вид `export { X } from '@/...';`: по этому шаблону `build-dist.mjs` генерирует `.d.ts`.
- **Шимы (`shims/`)** подменяют `next/link`, `next/image`, `next/navigation` и модуль шрифтов. Шрифты подменяются по регулярке `app/fonts/fonts`, поэтому компоненты должны импортировать шрифты именно из `src/app/fonts/fonts`.
- **SCSS** компилируется с корнем репозитория для путей вида `/src/...`. **SVG** проходит через svgr, как в `next.config.mjs`.
- **`config.json`** содержит `docsMap` (компонент → `groups/*.md`) и `overrides` (режим карточки, viewport). **`conventions.md`** — шапка README для Claude Design. **`previews/<Name>.tsx`** — превью компонентов.

## Если меняешь компонент из `src/components`
- Переименовал или перенёс файл → обнови `entry.ts`, ключи в `config.json`, файл в `previews/`.
- Изменил пропсы → обнови `previews/<Name>.tsx` и описание в `groups/*.md` или `conventions.md`.
- Удаляешь компонент, который в приложении не используется (например `PopupParent`) → сначала проверь, нет ли его в `entry.ts`.
- После правок прогони сборку и убедись, что она проходит без ошибок.
