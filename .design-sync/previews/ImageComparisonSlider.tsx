import { ImageComparisonSlider } from 'portfolio-ui';
import low from './assets/compare-low.jpg';
import high from './assets/compare-high.jpg';

// Before/after ("До" / "После") photo comparison: the divider follows the
// pointer. Fills its parent, which needs a size and position: relative.
export const BeforeAfter = () => (
  <div style={{ position: 'relative', width: 640, height: 360, borderRadius: 13, overflow: 'hidden' }}>
    <ImageComparisonSlider lowQualitySrc={low} highQualitySrc={high} step={0} handleLoad={() => {}} />
  </div>
);

export const Compact = () => (
  <div style={{ position: 'relative', width: 400, height: 225, borderRadius: 13, overflow: 'hidden' }}>
    <ImageComparisonSlider lowQualitySrc={low} highQualitySrc={high} step={1} handleLoad={() => {}} />
  </div>
);
