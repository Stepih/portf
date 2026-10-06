import { ButtonRight } from 'portfolio-ui';

const thumbs = ['#77c7ea', '#ea7777', '#393939', '#00ea41'];

// "Open all" at the end of a 130px photo row (ImageList / VideoList desktop layout).
// The button stretches to its container's height.
export const EndOfPhotoRow = () => (
  <div style={{ display: 'flex', gap: 20, height: 130, alignItems: 'center' }}>
    {thumbs.map((c) => (
      <div key={c} style={{ width: 120, height: '100%', borderRadius: 13, background: c, opacity: 0.85 }} />
    ))}
    <div style={{ height: '100%' }}>
      <ButtonRight param={[]} paramAction={() => {}} />
    </div>
  </div>
);

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 13, height: 178, display: 'inline-block' }}>
    <ButtonRight param={null} action={() => {}} />
  </div>
);
