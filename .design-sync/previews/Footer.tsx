import { Footer } from 'portfolio-ui';

// Page footer: muted stencil line with the years (since 2024 to the build year) and a Telegram link.
export const Default = () => <Footer />;

export const UnderPageContent = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: 220, width: '100%' }}>
    <main style={{ flex: '1 0 auto', padding: '24px 20px' }}>
      <h3>Feedback</h3>
      <p style={{ color: 'var(--color-text-50)', marginTop: 8 }}>Заполни и отправь форму, чтобы я смог связаться с тобой</p>
    </main>
    <Footer />
  </div>
);

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', borderRadius: 13, width: '100%' }}>
    <Footer />
  </div>
);
