// Library entry for the design-sync build (.design-sync/build-dist.mjs).
// The app has no package entry of its own - this barrel names the shared
// components under src/components as the design system's public surface.
import '@/styles/globals.scss';

export { default as ActionButton } from '@/components/ui/buttons/button-action/ActionButton';
export { default as ButtonDown } from '@/components/ui/buttons/button-down/ButtonDown';
export { default as ButtonRight } from '@/components/ui/buttons/button-right/ButtonRight';
export { default as ButtonUp } from '@/components/ui/buttons/button-up/ButtonUp';
export { default as ErrorMessage } from '@/components/ui/errorMessage/ErrorMessage';
export { default as LoadingBlock } from '@/components/ui/loading/LoadingBlock';
export { default as PopupParent } from '@/components/ui/popup/PopupParent';
export { default as Prompt } from '@/components/ui/prompt/Prompt';
export { default as ScrollToArrow } from '@/components/ui/scrollToArrow/ScrollToArrow';
export { default as ArrowLink } from '@/components/arrow-link/ArrowLink';
export { default as Background } from '@/components/bg-page/Background';
export { default as BgFocus } from '@/components/bg-page/BgFocus';
export { BgRectangle1, BgRectangle2 } from '@/components/bg-page/BgRectangle';
export { default as Breadcrumbs } from '@/components/breadCrumb/BreadCrumb';
export { default as Footer } from '@/components/footer/Footer';
export { default as Header } from '@/components/header/Header';
export { default as SelectThemeButton } from '@/components/header/SelectThemeButton';
export { default as ImageComparisonSlider } from '@/components/slider/ImageComparisonSlider';
export { default as LayoutAnimateImage } from '@/components/slider/LayoutAnimateImage';
export { default as SlideNotes } from '@/components/slider/SlideNotes';
export { default as Slider } from '@/components/slider/Slider';
export { default as TitleBlockPage } from '@/components/title-block-page/TitleBlockPage';
export { default as AnimatedButton } from '@/components/title-block-page/button/AnimatedButton';
