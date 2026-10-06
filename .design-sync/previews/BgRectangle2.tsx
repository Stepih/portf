import { BgRectangle2 } from 'portfolio-ui';

// Bottom-right decorative glow of the page Background: blurred blue circle
// cycling blue → red → green. The music-note glyph shows only on "/music".
export const MusicPage = () => (
  <div style={{ position: 'relative', height: 320, width: 420 }}>
    <BgRectangle2 currentUrl="/music" parallax={0} />
  </div>
);

export const OtherPage = () => (
  <div style={{ position: 'relative', height: 320, width: 420 }}>
    <BgRectangle2 currentUrl="/media" parallax={0} />
  </div>
);
