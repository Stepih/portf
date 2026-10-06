import { ButtonDown } from 'portfolio-ui';

const thumbs = ['#77c7ea', '#ea7777', '#393939'];

// "Show more" under a photo strip on narrow screens (ImageList mobile layout).
export const UnderPhotoStrip = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 380 }}>
    <div style={{ display: 'flex', gap: 16, height: 110 }}>
      {thumbs.map((c) => (
        <div key={c} style={{ flex: 1, borderRadius: 13, background: c, opacity: 0.85 }} />
      ))}
    </div>
    <ButtonDown param={[]} paramAction={() => {}} />
  </div>
);

export const Standalone = () => <ButtonDown param={null} action={() => {}} />;

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 13, width: 200 }}>
    <ButtonDown param={null} action={() => {}} />
  </div>
);
