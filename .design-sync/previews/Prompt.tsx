import { Prompt, ActionButton } from 'portfolio-ui';

// Passive tooltip pinned above its anchor.
export const PassiveTop = () => (
  <div style={{ paddingTop: 56, display: 'flex', justifyContent: 'center' }}>
    <Prompt type="passive" side="top" screen="auto" show title="Скачать">
      <ActionButton type="button" text="Смотреть видео" />
    </Prompt>
  </div>
);

// Active (cursor-following) prompt, as shown over the slider before first click.
export const ActiveOverMedia = () => (
  <Prompt type="active" screen="auto" show title="Меня можно переключить кликом">
    <div
      style={{
        width: 320,
        height: 180,
        borderRadius: 13,
        background: 'linear-gradient(135deg, rgba(119,199,234,1), rgba(234,119,119,1))',
      }}
    />
  </Prompt>
);

// Hidden state - only the wrapped content renders.
export const Hidden = () => (
  <Prompt type="active" screen="auto" show={false} title="Закрыть плеер">
    <ActionButton type="button" text="Закрыть плеер" />
  </Prompt>
);
