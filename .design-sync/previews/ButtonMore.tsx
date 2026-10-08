import { ButtonMore } from 'portfolio-ui';

const thumbs = ['#77c7ea', '#ea7777', '#393939', '#00ea41'];

// "Open all" at the end of a 130px photo row (ImageList / VideoList desktop layout).
// direction="right" stretches the button to its container's height.
export const EndOfPhotoRow = () => (
  <div style={{ display: 'flex', gap: 20, height: 130, alignItems: 'center' }}>
    {thumbs.map((c) => (
      <div key={c} style={{ width: 120, height: '100%', borderRadius: 13, background: c, opacity: 0.85 }} />
    ))}
    <div style={{ height: '100%' }}>
      <ButtonMore direction="right" param={[]} paramAction={() => {}} />
    </div>
  </div>
);

// "Show more" under a photo strip on narrow screens (ImageList mobile layout).
export const UnderPhotoStrip = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 380 }}>
    <div style={{ display: 'flex', gap: 16, height: 110 }}>
      {thumbs.slice(0, 3).map((c) => (
        <div key={c} style={{ flex: 1, borderRadius: 13, background: c, opacity: 0.85 }} />
      ))}
    </div>
    <ButtonMore direction="down" param={[]} paramAction={() => {}} />
  </div>
);

export const Standalone = () => <ButtonMore param={null} action={() => {}} />;

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 13, display: 'flex', gap: 24, alignItems: 'stretch', height: 130 }}>
    <div style={{ alignSelf: 'center' }}>
      <ButtonMore direction="down" param={null} action={() => {}} />
    </div>
    <ButtonMore direction="right" param={null} action={() => {}} />
  </div>
);
