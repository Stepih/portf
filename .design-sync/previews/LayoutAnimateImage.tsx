import { LayoutAnimateImage } from 'portfolio-ui';
import slide from './assets/slide-1.jpg';

// Rounded, clipping frame for one slide. Click = next, right-click = previous
// (handleNext receives the event). With anim, each step change springs the
// slide in from above/below; without, it swaps instantly. Fills its parent.
export const Animated = () => (
  <div style={{ width: 560, height: 315 }}>
    <LayoutAnimateImage anim step={0} handleNext={() => {}}>
      <img src={slide} alt="Медиа-пример" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </LayoutAnimateImage>
  </div>
);

export const Static = () => (
  <div style={{ width: 400, height: 225 }}>
    <LayoutAnimateImage anim={false} step={1} handleNext={() => {}}>
      <img src={slide} alt="Медиа-пример" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </LayoutAnimateImage>
  </div>
);
