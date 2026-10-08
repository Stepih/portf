import { ActionButton } from 'portfolio-ui';

// Primary call to action on a media item card.
// With href it renders a link styled as the button (MediaItem uses it to open /popup).
export const Primary = () => <ActionButton href="/popup" text="Оставить заявку" />;

// Feedback form submit + its sending and sent states.
export const Submit = () => (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
    <ActionButton type="submit" text="Отправить" />
    <ActionButton type="submit" text="Отправляется..." disabled />
    <ActionButton type="submit" text="Отправлено!" />
  </div>
);

// Popup navigation row (MediaItemPopup).
export const PopupNavigation = () => (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
    <ActionButton type="button" text="Выйти" />
    <ActionButton type="button" text="Назад" />
    <ActionButton type="button" text="Далее" />
  </div>
);

// Same button under the dark theme ([data-theme="dark"] swaps the tokens).
export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 13 }}>
    <ActionButton type="button" text="Оставить заявку" />
  </div>
);
