import { ButtonUp } from 'portfolio-ui';

// Collapse / back-to-top control at the end of an expanded media list.
// Clicking scrolls to the element with id="main".
export const EndOfList = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 380 }}>
    <div style={{ display: 'flex', gap: 16, height: 90, width: '100%' }}>
      {['#77c7ea', '#ea7777', '#393939'].map((c) => (
        <div key={c} style={{ flex: 1, borderRadius: 13, background: c, opacity: 0.85 }} />
      ))}
    </div>
    <ButtonUp />
  </div>
);

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 13, display: 'inline-block' }}>
    <ButtonUp />
  </div>
);
