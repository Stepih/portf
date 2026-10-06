import { ArrowLink } from 'portfolio-ui';

// Corner arrow marking a card as a link (home page section buttons). It is
// absolutely positioned top-right, so the parent must be position: relative.
const card = {
  position: 'relative' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: 22,
  width: 208,
  padding: '24px 38px',
  borderRadius: 13,
  background: 'rgba(57, 57, 57, 0.08)',
  boxShadow: '0 4px 48px 0 rgba(0, 0, 0, 0.25)',
  color: 'var(--color-text-100)',
};

export const OnSectionCard = () => (
  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
    <div style={card}>
      <ArrowLink />
      <div style={{ width: 64, height: 64, borderRadius: 13, background: 'rgba(119,199,234,1)' }} />
      <p>Музыка</p>
    </div>
    <div style={card}>
      <ArrowLink />
      <div style={{ width: 64, height: 64, borderRadius: 13, background: 'rgba(234,119,119,1)' }} />
      <p>Медиа</p>
    </div>
  </div>
);

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 13, display: 'inline-block' }}>
    <div style={card}>
      <ArrowLink />
      <div style={{ width: 64, height: 64, borderRadius: 13, background: 'rgba(0,234,65,1)' }} />
      <p>Веб</p>
    </div>
  </div>
);
