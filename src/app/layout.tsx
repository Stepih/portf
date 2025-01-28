import type { Metadata } from "next";

import "../styles/globals.scss";
import s from './layout.module.scss'
import { ralewayRegular } from "../styles/fonts/fonts";

import BackgroundPage from "@/components/bg-page/Background";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";


export const metadata: Metadata = {
  title: "Work Portfolio By Kartuzov Stepan",
  description: "Это мой личный сайт, некое портфолио, которое ознакомит Вас с разными отраслями моего творчества",
  keywords: "Портфолио музыканта и программиста, создание музыки, веб-разработка, разработка приложений, программирование, фриланс, графический дизайн, музыкальные треки, разработка сайтов, проектирование интерфейсов, продюсирование музыки, разработка ПО, UI/UX дизайн, музыкальные проекты, программирование на Python, создание альбомов, веб-дизайн, звуковое оформление, React, Node.js, фронтенд и бэкенд разработки",
  openGraph: {
    title: 'Work Portfolio By Kartuzov Stepan',
    description: 'Это мой личный сайт, некое портфолио, которое ознакомит Вас с разными отраслями моего творчества',
    locale: 'ru_RU'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="ru">
      <body className={`${s.body}`}>
          <BackgroundPage />
          <Header />
          <main id="main" className={`${ralewayRegular.className} ${s.main}`}>
            {children}
          </main>
          <Footer />
      </body>
    </html>
  );
}
