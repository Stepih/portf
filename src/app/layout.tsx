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
  // Страницы задают title целиком, шаблон его не меняет. default – заголовок главной
  title: {
    default: "Сайты под ключ и ИИ-автоматизация – Степан Картузов",
    template: "%s",
  },
  description: "Лендинг от 8 000 ₽ за 3–4 дня, сайт компании от 30 000 ₽, интернет-магазин от 50 000 ₽. Дизайн, разработка, ИИ-боты. Самозанятый, договор",
  openGraph: {
    ...baseOpenGraph,
    title: "Сайты под ключ и ИИ-автоматизация – Степан Картузов",
    description: "Лендинг от 8 000 ₽ за 3–4 дня, сайт компании от 30 000 ₽, интернет-магазин от 50 000 ₽. Дизайн, разработка, ИИ-боты. Самозанятый, договор",
  },
  robots: {
    index: true,
    follow: true
  },
  authors: {
      url: 'https://t.me/polo_ymniy',
      name: 'Степан Картузов'
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
