## Building with PortfolioUI

Components from Stepan Kartuzov's portfolio site (Next.js). All are on `window.PortfolioUI` (for example `PortfolioUI.ActionButton`). UI copy is **Russian**: write labels and text in Russian, e.g. «Оставить заявку», «Отправить», «На главную».

### Setup
- No provider or wrapper is needed. `styles.css` is the whole look. It contains the colour tokens, the four fonts, every component's CSS, and global element styles: `body` in Raleway, `h1` at 4rem, `h3` at 1.5rem, `p` at 1.25rem.
- **Dark theme:** put `data-theme="dark"` on `<html>` or on any wrapper. That swaps the tokens for everything inside. `SelectThemeButton` toggles it on `<html>` and saves the choice in `localStorage("theme")`.
- **Page-level pieces (render once at the root):** `Background` (fixed backdrop with glows), `Header`, `Footer`. `Header` is a fixed left sidebar at 1200px and wider, and a horizontal bar below that.
- **Overlays are `position: fixed`:** `PopupParent` (dims the screen and centres its children while `active`), `ErrorMessage` (top-centre toast, hidden when `error=""`), `BgFocus` (veil, `status` toggles it).
- **Fill-the-parent components:** `Slider`, `ImageComparisonSlider`, `LayoutAnimateImage` and `LoadingBlock` stretch to their parent. Give that parent an explicit width and height plus `position: relative`. `SlideNotes` (the slider's dots) and `ArrowLink` / `AnimatedButton` (corner markers) position themselves absolutely against that parent.
- `Breadcrumbs` is visible only when the viewport is narrower than 560px (a CSS media query hides it on wider screens). It builds the trail from `location.pathname`.

### Styling idiom
The components use CSS modules with hashed class names, so there are **no public utility classes** for component internals. Style your own layout with these tokens and values:

| Purpose | Use |
|---|---|
| Page background | `var(--color-bg)` (white / #131313) |
| Primary text, borders | `var(--color-text-100)` |
| Muted text | `var(--color-text-50)` |
| Overlay chip | `var(--color-overlay)` |
| Card surface | `background: rgba(57, 57, 57, 0.08)` |
| Card shadow | `box-shadow: 0 4px 48px 0 rgba(0, 0, 0, 0.25)` |
| Corner radius | `13px` |
| Accents | `#EA7777` (red-pink), `#77C7EA` (blue), `#00EA41` (green) |

Font classes: `font-raleway` (body), `font-raleway-bold`, `font-allerta` (Allerta Stencil, used for uppercase hero titles), `font-canada`.

### Where the truth lives
- `styles.css` → `_ds_bundle.css`: tokens are at the top, followed by global element styles and component CSS. `fonts/fonts.css` holds the `@font-face` rules.
- `components/<group>/<Name>/<Name>.d.ts` is each component's props contract. `<Name>.prompt.md` has usage examples. Props are exact: for example, `ActionButton` requires `type` and `text`, and `TitleBlockPage` takes a single `props={{ title, description, img? }}` object.

### Example
```jsx
const { TitleBlockPage, ActionButton, Slider } = window.PortfolioUI;

<main style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', gap: 40 }}>
  <TitleBlockPage props={{ title: 'Media content', description: 'Создание видеороликов и цветокоррекция' }} />
  <section style={{ display: 'flex', gap: 30, padding: 30, borderRadius: 13,
    background: 'rgba(57, 57, 57, 0.08)', boxShadow: '0 4px 48px 0 rgba(0, 0, 0, 0.25)' }}>
    <div style={{ flex: 1 }}>
      <h3>Цветокоррекция</h3>
      <p style={{ color: 'var(--color-text-50)', margin: '12px 0 24px' }}>До и после обработки</p>
      <ActionButton type="button" text="Оставить заявку" />
    </div>
    <div style={{ position: 'relative', width: 480, height: 270 }}>
      <Slider anim objectFit="cover" slideNotesPosition="bottom"
        content={[{ id: 1, low: '/before.jpg', high: '/after.jpg' }, { id: 2, src: '/photo.jpg' }]} />
    </div>
  </section>
</main>
```
