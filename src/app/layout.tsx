import type { Metadata } from "next";

import "../styles/globals.scss";
import s from './layout.module.scss'
import { ralewayRegular } from "@/app/fonts/fonts";

import BackgroundPage from "@/components/bg-page/Background";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import YandexMetrika from "@/components/analytics/YandexMetrika";
import { baseOpenGraph } from "@/data/metadata";


export const metadata: Metadata = {
  // Страницы задают title целиком, шаблон его не меняет. default — заголовок главной
  title: {
    default: "Work Portfolio By Kartuzov Stepan",
    template: "%s",
  },
  description: "Это мой личный сайт, некое портфолио, которое ознакомит Вас с разными отраслями моего творчества",
  keywords: "Портфолио музыканта и программиста, создание музыки, веб-разработка, разработка приложений, программирование, фриланс, графический дизайн, музыкальные треки, разработка сайтов, проектирование интерфейсов, продюсирование музыки, разработка ПО, UI/UX дизайн, музыкальные проекты, программирование на Python, создание альбомов, веб-дизайн, звуковое оформление, React, Node.js, фронтенд и бэкенд разработки",
  openGraph: {
    ...baseOpenGraph,
    title: 'Work Portfolio By Kartuzov Stepan',
    description: 'Это мой личный сайт, некое портфолио, которое ознакомит Вас с разными отраслями моего творчества',
  },
  robots: {
    index: true,
    follow: true
  },
  authors: {
      url: 'https://t.me/polo_ymniy',
      name: 'Kartuzov Stepan'
  }
};

// Ставит сохранённую тему до первой отрисовки, иначе у тёмной темы мелькает светлая (AUDIT.md, B7)
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${s.body}`}>
          <BackgroundPage />
          <Header />
          <main id="main" className={`${ralewayRegular.className} ${s.main}`}>
            {children}
          </main>
          <Footer />
          <YandexMetrika />
      </body>
    </html>
  );
}
