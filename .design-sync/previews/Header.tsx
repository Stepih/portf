import { Header } from 'portfolio-ui';

// Site header. Below 1200px wide it is a horizontal bar (theme switch +
// Telegram contact); above 1200px it becomes a fixed left sidebar that slides
// out on hover and dims the page behind it (BgFocus).
export const TopBar = () => (
  <div style={{ width: '100%' }}>
    <Header />
  </div>
);

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 16, borderRadius: 13 }}>
    <Header />
  </div>
);
