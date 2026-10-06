import { PopupParent, ActionButton } from 'portfolio-ui';

// Full-screen dimmed overlay that centers its children; renders nothing when
// active is false. It is position: fixed - in a page it covers the viewport;
// here a sized stage stands in for the viewport.
const Stage = ({ children }: { children: React.ReactNode }) => <div style={{ height: 552 }}>{children}</div>;
export const MediaPopup = () => (
  <Stage>
  <PopupParent active>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        width: 520,
        padding: 30,
        borderRadius: 13,
        background: 'var(--color-bg)',
        boxShadow: '0 4px 48px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      <div
        style={{
          height: 240,
          borderRadius: 13,
          background: 'linear-gradient(135deg, rgba(119,199,234,1), rgba(234,119,119,1))',
        }}
      />
      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
        <ActionButton type="button" text="Выйти" />
        <ActionButton type="button" text="Назад" />
        <ActionButton type="button" text="Далее" />
      </div>
    </div>
  </PopupParent>
  </Stage>
);

export const Confirmation = () => (
  <Stage>
  <PopupParent active>
    <div
      style={{
        width: 420,
        padding: 40,
        textAlign: 'center',
        borderRadius: 13,
        background: 'var(--color-bg)',
        color: 'var(--color-text-100)',
      }}
    >
      <h3 style={{ marginBottom: 12 }}>Заявка отправлена</h3>
      <p style={{ color: 'var(--color-text-50)', marginBottom: 24 }}>Я свяжусь с вами в ближайшее время</p>
      <ActionButton type="button" text="Закрыть" />
    </div>
  </PopupParent>
  </Stage>
);
