// Stand-in for src/app/fonts/fonts.ts (next/font/local) outside Next.js.
// Same export names; each className maps to a real class in fonts.css, which
// declares the @font-face rules for the repo's own .ttf files.
import './fonts.css';

const font = (className: string, family: string, weight: number) => ({
  className,
  style: { fontFamily: `'${family}'`, fontWeight: weight, fontStyle: 'normal' },
});

export const allerta = font('font-allerta', 'Allerta Stencil', 400);
export const ralewayRegular = font('font-raleway', 'Raleway', 400);
export const ralewayBold = font('font-raleway-bold', 'Raleway', 700);
export const canada = font('font-canada', 'Radio Canada', 400);
