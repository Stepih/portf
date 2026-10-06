import { Slider } from 'portfolio-ui';
import low from './assets/compare-low.jpg';
import high from './assets/compare-high.jpg';
import s1 from './assets/slide-1.jpg';
import s2 from './assets/slide-2.jpg';
import s3 from './assets/slide-3.jpg';

// Media slider (ImageMediaSlider in the app): images, before/after pairs
// ({id, low, high}) or videos ({id, srcVideo}). Click/right-click steps,
// dots below or to the right, LoadingBlock until media loads, and a
// "click to switch" Prompt on first hover. Fills its parent - give it a size and position: relative (the dots anchor to it).
export const Gallery = () => (
  <div style={{ position: 'relative', width: 560, height: 315, marginBottom: 56 }}>
    <Slider
      anim
      objectFit="cover"
      slideNotesPosition="bottom"
      content={[
        { id: 1, src: s1 },
        { id: 2, src: s2 },
        { id: 3, src: s3 },
      ]}
    />
  </div>
);

export const BeforeAfter = () => (
  <div style={{ position: 'relative', width: 560, height: 315, marginBottom: 56 }}>
    <Slider
      anim
      objectFit="cover"
      slideNotesPosition="bottom"
      content={[
        { id: 1, low, high },
        { id: 2, low, high },
      ]}
    />
  </div>
);

export const DotsRight = () => (
  <div style={{ position: 'relative', width: 420, height: 236, marginRight: 56 }}>
    <Slider
      anim={false}
      objectFit="contain"
      slideNotesPosition="right"
      content={[
        { id: 1, src: s1 },
        { id: 2, src: s2 },
        { id: 3, src: s3 },
      ]}
    />
  </div>
);
