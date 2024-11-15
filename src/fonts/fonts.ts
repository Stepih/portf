import { Allerta_Stencil, Raleway, Radio_Canada } from 'next/font/google';

export const allerta = Allerta_Stencil({
  subsets: ['latin'],
  weight: '400',
  display: 'swap', 
});

export const ralewayRegular = Raleway({
  subsets: ['latin'],
  weight: '400',
});

export const ralewayBold = Raleway({
  subsets: ['latin'],
  weight: '700',
});

export const canada = Radio_Canada({
  subsets: ['latin'],
  weight: '400',
  
});
