import { BgRectangle1 } from 'portfolio-ui';

// Top-left decorative glow of the page Background: blurred red circle cycling
// red → green → blue. The music-note glyph shows only when currentUrl is "/music".
export const MusicPage = () => (
  <div style={{ position: 'relative', height: 300, width: 400 }}>
    <BgRectangle1 currentUrl="/music" parallax={0} />
  </div>
);

export const OtherPage = () => (
  <div style={{ position: 'relative', height: 300, width: 400 }}>
    <BgRectangle1 currentUrl="/" parallax={0} />
  </div>
);
