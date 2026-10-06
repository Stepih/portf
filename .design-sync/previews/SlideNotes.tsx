import { SlideNotes } from 'portfolio-ui';

// Slide position dots with a springy active marker. Positioned absolutely
// against the slider box: "bottom" sits 40px below it, "right" 40px to its
// right. Renders nothing for a single slide.
const box = { position: 'relative' as const, width: 420, height: 236, borderRadius: 13, background: 'rgba(57, 57, 57, 0.08)' };

export const Bottom = () => (
  <div style={{ paddingBottom: 56 }}>
    <div style={box}>
      <SlideNotes length={5} step={1} action={() => {}} slideNotesPosition="bottom" />
    </div>
  </div>
);

export const Right = () => (
  <div style={{ paddingRight: 56, display: 'inline-block' }}>
    <div style={box}>
      <SlideNotes length={3} step={0} action={() => {}} slideNotesPosition="right" />
    </div>
  </div>
);
