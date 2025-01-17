import localFont from 'next/font/local';

export const allerta = localFont({
  src: './AllertaStencil-Regular.ttf',
  weight: '400',
  style: 'normal',
});

export const ralewayRegular = localFont({
  src: './Raleway-Regular.ttf',
  weight: '400',
  style: 'normal'
});

export const ralewayBold = localFont({
  src: './Raleway-Bold.ttf',
  weight: '700',
  style: 'normal'
});

export const canada = localFont({
  src: './RadioCanada-Regular.ttf',
  weight: '400',
  style: 'normal',
  preload: true
});
