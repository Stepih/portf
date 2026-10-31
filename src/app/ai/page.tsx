import { FC } from "react";
import { Metadata } from "next";

import s from './page.module.scss'
import { offerTgButton, services } from "@/data/offer";
import { baseOpenGraph } from "@/data/metadata";
import { ogSize } from "@/lib/og";
import { aiPageURL } from "@/constants/urls";
import ChatWorkScene from "./components/scenes/ChatWorkScene";
import AgentDeck from "./components/scenes/AgentDeck";
import HowWeWork from "./components/sections/HowWeWork";
import Monthly from "./components/sections/Monthly";
import Terms from "./components/sections/Terms";
import AiFaq from "./components/sections/AiFaq";
import CtaScene from "./components/scenes/CtaScene";

// Страница /ai (SERVICES_PLAN У4), раскладка «Работа → чат → цены» – выбор владельца из трёх черновиков (A и B – в истории git).
// Тексты – src/data/aiPage.ts (marketing:draft-content). Страница не в поиске и не в sitemap (next-sitemap.config.js) –
// откроется по команде владельца после финальной проверки (SERVICES_PLAN У4)
const title = 'ИИ-агенты для бизнеса – Степан Картузов';
const description = 'ИИ-агенты под процесс вашего бизнеса: контроль звонков, отзывы, отчёт по маркетингу, проверка документов, заявки и запись. Демо – бесплатно, серверы в России';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        ...baseOpenGraph,
        title,
        description,
        // Своя картинка из opengraph-image.tsx рядом: общая из baseOpenGraph иначе перебивает её
        images: [{ url: `${aiPageURL}/opengraph-image`, width: ogSize.width, height: ogSize.height }],
    },
    robots: { index: false, follow: false },
};

// Первый экран и чат, «агент за работой» и ступени – одной сценой: что умеет → живой пример → цена. Вторая ступень
// продолжается сценой агентов (AgentDeck: две карточки и шар между ними, слайды по два); карточки втягиваются в шар,
// из него собирается линия шагов HowWeWork (joined). Дальше разделы связаны стыками на неподвижном экране (scenes/handoff.ts)
const AiPage: FC = () => {
    // Ступени, уточнение и Telegram – данные главной (offer.ts), остальные тексты – src/data/aiPage.ts
    const ai = services.find((service) => service.tiers);

    return (
        <div className={s.page}>
            <ChatWorkScene tiers={ai?.tiers ?? []} note={ai?.note ?? ''} />
            <AgentDeck />
            <HowWeWork joined />
            <Monthly />
            <Terms />
            <AiFaq />
            <CtaScene tgHref={offerTgButton.href} />
        </div>
    );
};

export default AiPage;
