import { BgFocus, ActionButton } from 'portfolio-ui';

// Full-screen veil in the theme background colour; status=true fades it to
// 70% to push the page back (used behind the expanded Header sidebar).
// In a page it covers the viewport; here a sized stage stands in for it.
const Page = () => (
  <div style={{ padding: 40 }}>
    <h1>My musical creativity</h1>
    <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
      Жизнь, как пианино. С чёрными и белыми полосами
    </p>
    <ActionButton type="button" text="Слушать" />
  </div>
);

export const Active = () => (
  <div style={{ position: 'relative', height: 400 }}>
    <Page />
    <BgFocus status />
  </div>
);

export const Inactive = () => (
  <div style={{ position: 'relative', height: 400 }}>
    <Page />
    <BgFocus status={false} />
  </div>
);
