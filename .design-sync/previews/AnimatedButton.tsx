import { AnimatedButton } from 'portfolio-ui';

// "На главную" back link. It positions itself absolutely at the top-left of
// its container (TitleBlockPage cuts a matching notch for it).
export const InCardCorner = () => (
  <div
    style={{
      position: 'relative',
      width: 520,
      height: 180,
      borderRadius: 13,
      boxShadow: '0 4px 48px 0 rgba(0, 0, 0, 0.25)',
    }}
  >
    <AnimatedButton />
  </div>
);

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 13 }}>
    <div style={{ position: 'relative', width: 420, height: 120 }}>
      <AnimatedButton />
    </div>
  </div>
);
