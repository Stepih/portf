import { SelectThemeButton } from 'portfolio-ui';

// Light/dark switch. Clicking sets data-theme on <html> and persists the
// choice in localStorage("theme"); it lives in the Header next to contacts.
export const InHeaderBar = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: 420,
      padding: '10px 20px',
      borderRadius: 13,
      background: 'rgba(57, 57, 57, 0.08)',
      boxShadow: '0 4px 48px 0 rgba(0, 0, 0, 0.25)',
    }}
  >
    <SelectThemeButton />
    <span style={{ color: 'var(--color-text-100)' }}>Контакты</span>
  </div>
);
