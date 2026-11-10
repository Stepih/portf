import type { Metadata } from "next";

import "../styles/globals.scss";
import s from './layout.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";

import BackgroundPage from "@/components/bg-page/Background";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import YandexMetrika from "@/components/analytics/YandexMetrika";
import ChatProvider from "@/app/(home)/components/chat/ChatProvider";
import { baseOpenGraph } from "@/data/metadata";
import { offerTgButton } from "@/data/offer";
import { skipToContent } from "@/data/layout";


export const metadata: Metadata = {
  // Страницы задают title целиком, шаблон его не меняет. default – заголовок главной
  title: {
    default: "Сайты под ключ и ИИ-автоматизация – Степан Картузов",
    template: "%s",
  },
  // SERVICES_PLAN У1: без «договор» – его пока нет (вариант A)
  description: "Лендинг от 8 000 ₽ за 3–4 дня, сайт компании от 30 000 ₽, магазин от 50 000 ₽, ИИ-агенты от 15 000 ₽. Сначала макет, потом оплата",
  openGraph: {
    ...baseOpenGraph,
    title: "Сайты под ключ и ИИ-автоматизация – Степан Картузов",
    description: "Лендинг от 8 000 ₽ за 3–4 дня, сайт компании от 30 000 ₽, магазин от 50 000 ₽, ИИ-агенты от 15 000 ₽. Сначала макет, потом оплата",
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
          {/* Первая остановка Tab: мимо шапки сразу к странице. Видна только в фокусе (DESIGN_FIXES_7_PLAN Д39) */}
          <a href="#main" className={`${ralewayBold.className} ${s.skip}`}>{skipToContent}</a>
          <BackgroundPage />
          <ChatProvider tgButton={offerTgButton}>
            <Header />
            {/* tabIndex -1: ссылка «к содержимому» переносит в main и фокус, следующий Tab – первая ссылка страницы */}
            <main id="main" tabIndex={-1} className={`${ralewayRegular.className} ${s.main}`}>
              {children}
            </main>
            <Footer />
          </ChatProvider>
          <YandexMetrika />
      </body>
    </html>
  );
}
