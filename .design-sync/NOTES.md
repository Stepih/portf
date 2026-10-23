# design-sync notes (portfolio → claude.ai/design "Portfolio Design System")

## Build
- This repo is a Next.js 15 app, not a library: no dist/, no Storybook. `.design-sync/build-dist.mjs`
  (cfg.buildCmd) builds `.design-sync/entry.ts` (the barrel naming the 24 shared components under
  src/components) into `.design-sync/.cache/dist/` (index.mjs + index.css + index.d.ts + package.json
  named `portfolio-ui`). The converter then runs with `cfg.entry` pointing at that dist.
  Run order on every sync: `node .design-sync/build-dist.mjs` → package-build / resync.
- Needs `.ds-sync/node_modules/esbuild` (staged converter deps) + repo deps `sass`, `@svgr/core`
  (via @svgr/webpack), `typescript`.
- SCSS modules compiled with dart-sass + esbuild `local-css`. Module files `@use '/src/styles/variables.scss'`
  (root-relative, Next-style) → a custom importer maps leading `/` to the repo root.
- `*.svg` imports → React components via @svgr/core (mirrors next.config.mjs @svgr/webpack).
- Next.js runtime modules swapped for plain-DOM stand-ins in `.design-sync/shims/`:
  next/link → `<a>`, next/image → `<img>` (fill = absolute inset 0), next/navigation → window.location,
  `src/app/fonts/fonts.ts` (next/font/local) → `shims/fonts.ts` with classNames `font-raleway`,
  `font-raleway-bold`, `font-allerta`, `font-canada` backed by `shims/fonts.css` @font-face on the repo's .ttf files.
- `src/styles/globals.scss` is imported by the entry, so tokens (`--color-bg`, `--color-text-100`,
  `--color-text-50`, `--color-frost`, `--color-overlay`, light on :root / dark on `[data-theme="dark"]`) and the global
  element styles (body Raleway, h1 4rem, p 1.25rem) ship in `_ds_bundle.css`.
- `cfg.srcDir` deliberately unset: src-derived groups were one-folder-per-component; groups come from
  the category stubs in `.design-sync/groups/*.md` via `cfg.docsMap` (Actions/Layout/Media/Feedback).
  No JSDoc exists in src, so nothing is lost.
- esbuild warns `different-path-case` for BreadCrumb.tsx importing `./Breadcrumbs.module.scss`
  (file is BreadCrumbs.module.scss). Works on Windows; would break on Linux/macOS case-sensitive FS.

## Render check / capture
- No Playwright browser cache on this machine; installed `playwright` npm pkg into `.ds-sync/` with
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 and run validate/capture with
  `DS_CHROMIUM_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"`.
- package-capture freezes the clock (`page.clock.setFixedTime`) and screenshots right after
  networkidle. framer-motion runs opacity fades on WAAPI, which never paints its end state under the
  frozen clock → entry-animated components (Prompt bubble, LoadingBlock, ErrorMessage, BgFocus, Header
  overlay) capture mid-fade/invisible. Not a component bug (renders fine with a real clock).
  `.design-sync/settled-shots.mjs <Names>` re-shoots the same cards with a real clock + 1.5s settle into
  `ds-bundle/_screenshots/review/settled/`; those cells are graded from capture sheet + settled re-shot.
- Prompt passive bubble is absolutely positioned at left:50% of its anchor, so its max width is half the
  anchor's width - long titles wrap and overlap the anchor (component behaviour). Previews use short titles.
- Buttons render in the browser default font (globals don't set `button { font: inherit }`) - faithful to the site.
- `.design-sync/settled-shots.mjs` writes into `ds-bundle/`, which every package-build wipes - re-run it
  after the last rebuild before grading from it.
- Breadcrumbs is hidden by `@media (min-width: 560px)` on `.nav` and package-validate always renders
  at 1200px (ignores the card's declared viewport), so its preview overrides
  `.BreadCrumbs_module_nav { display: block !important }` and `history.replaceState`s a site route
  (/music, /media/…) before mounting.
- Fixed-position overlays (PopupParent, BgFocus, Background) render in single-mode cards whose root is
  transformed (containing block for fixed) and 0px tall - previews wrap them in an explicit-height stage.
- Fill-parent components (Slider, ImageComparisonSlider, LayoutAnimateImage, LoadingBlock) and the
  absolutely positioned SlideNotes/ArrowLink/AnimatedButton need a sized `position: relative` parent.
- Preview images: `.design-sync/previews/assets/*.jpg` are downscaled copies (≤50KB) of
  public/media/images/1_low|1_high.png, public/media/images/maxresdefault.png, public/music/{Chill,lolipop}/prev.png,
  made with a canvas in Chrome. Don't import the multi-MB originals (they inline as data URLs).
- Card modes live in cfg.overrides (column for wide stories, single for fixed/overlay ones) - set
  from [GRID_OVERFLOW] suggestions; Header is single (primaryStory TopBar).

## Known render warns
- none at the end of the first sync (validate exit 0, 24/24 clean, no GRID_OVERFLOW after overrides).

## Source findings (not fixed - app code, reported to the user)
- Fixed since: the `BreadCrumbs.module.scss` import case (refactor step 1.4) and the Breadcrumbs /
  Slider hook-order violations (step 2.2). Breadcrumbs is now used on /music, /media and /popup.

## Re-sync risks
- `.design-sync/shims/*` re-implement next/link, next/image, next/navigation, next/font/local. If the
  components start using other Next APIs (next/dynamic, next/script, useSearchParams semantics, image
  loaders) the dist build fails or silently diverges - extend the shims and the `next-shims` plugin.
- `.design-sync/entry.ts` is a hand-kept barrel: new components under src/components are NOT picked up
  until added there (and to a group in cfg.docsMap / .design-sync/groups).
- `shims/fonts.ts` mirrors `src/app/fonts/fonts.ts` export names (allerta, ralewayRegular, ralewayBold,
  canada). Renaming/adding fonts there needs a matching shim + @font-face in `shims/fonts.css`.
- build-dist resolves `@svgr/core` / `@svgr/plugin-*` transitively via `@svgr/webpack`; a major bump of
  that package can move them.
- Toolchain at first sync: node v22.17.0, esbuild/ts-morph/playwright freshly installed into .ds-sync,
  sass from the repo, Chrome stable via DS_CHROMIUM_PATH.
- Grades for animated components (Prompt, LoadingBlock, BgFocus, LayoutAnimateImage, Slider) were given
  from settled re-shots, not the raw capture sheet - re-check those with settled-shots.mjs when they change.
