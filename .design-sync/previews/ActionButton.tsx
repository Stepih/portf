import { ActionButton } from 'portfolio-ui';

// Primary call to action on a media item card.
export const Primary = () => <ActionButton type="button" text="Оставить заявку" />;

// Feedback form submit + its sent state.
export const Submit = () => (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
    <ActionButton type="submit" text="Отправить" />
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
