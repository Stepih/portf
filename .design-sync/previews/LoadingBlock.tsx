import { LoadingBlock } from 'portfolio-ui';

// Placeholder shown while slider media loads: fills its parent and bounces a
// bold "Загрузка" label inside it. The parent needs a size and position: relative.
export const MediaPlaceholder = () => (
  <div style={{ position: 'relative', width: 480, height: 270 }}>
    <LoadingBlock />
  </div>
);

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 13 }}>
    <div style={{ position: 'relative', width: 420, height: 200 }}>
      <LoadingBlock />
    </div>
  </div>
);
