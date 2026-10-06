import { ScrollToArrow } from 'portfolio-ui';

// Chevron under a section intro that scrolls to the element with id={forid}.
export const UnderSectionIntro = () => (
  <div style={{ textAlign: 'center', width: 420 }}>
    <h3>Моя музыкальная история</h3>
    <p style={{ color: 'var(--color-text-50)', margin: '12px 0 16px' }}>
      От первых битов в 2019 до релизов на стриминговых площадках
    </p>
    <ScrollToArrow forid="title-history" />
  </div>
);

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 13, textAlign: 'center', width: 320 }}>
    <h3>История</h3>
    <div style={{ marginTop: 12 }}>
      <ScrollToArrow forid="title-history" />
    </div>
  </div>
);
