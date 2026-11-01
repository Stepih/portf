import { FC } from "react";
import { Metadata } from "next";

import s from './page.module.scss'
import { offerTgButton, services } from "@/data/offer";
import { baseOpenGraph } from "@/data/metadata";
import { build, sitesDetails } from "@/data/sitesPage";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { ogSize } from "@/lib/og";
import { sitesPageURL } from "@/constants/urls";
import { serviceCases } from "@/scripts/services";
import SitesHead from "./components/SitesHead";
import WindowScene, { IWindowKind } from "./components/window/WindowScene";
import CasesDeck, { IDeckCase } from "./components/scenes/CasesDeck";
import ProjectFlow from "./components/scenes/ProjectFlow";
import PaymentScale from "./components/scenes/PaymentScale";
import TermsColumns from "./components/scenes/TermsColumns";
import MoreRow from "./components/scenes/MoreRow";
import SitesFaq from "./components/SitesFaq";
import SitesCta from "./components/SitesCta";

// Страница /sites (SERVICES_PLAN У5, раскладка – У5а, окно-герой – У5б). Первый экран и три вида сайта – одна сцена
// «окно-герой»: пустое окно браузера встаёт по центру, в нём по очереди собираются лендинг, сайт компании и магазин;
// виды – вкладки окна, под окном – одна строка шага, в конце вида – цена и «Узнать цену» (лицо карточки главной,
// offer.ts). Ниже – сцены на липком экране, как на /ai (У5б, этап 2, components/scenes): кейсы колодой (окно уходит
// в первую карточку), как идёт проект, оплата одной шкалой, «Что входит / Не входит / Остаётся вам», «Ещё делаю»
// строкой; FAQ и финал.
// Тексты – src/data/sitesPage.ts (marketing:draft-content). Не в поиске и не в sitemap (next-sitemap.config.js) –
// до команды владельца после финальной проверки
const title = 'Сайты под ключ: лендинг, сайт компании, магазин – Степан Картузов';
const description = 'Лендинг от 8 000 ₽ за 3–4 дня, сайт компании от 30 000 ₽, магазин от 50 000 ₽. Что входит, опции с ценами, макет до оплаты';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        ...baseOpenGraph,
        title,
        description,
        // Своя картинка из opengraph-image.tsx рядом: общая из baseOpenGraph иначе перебивает её
        images: [{ url: `${sitesPageURL}/opengraph-image`, width: ogSize.width, height: ogSize.height }],
    },
    robots: { index: false, follow: false },
};

const SitesPage: FC = () => {
    // Три вида сайтов – в порядке карточек главной
    const kinds: IWindowKind[] = services.flatMap((service) => service.id === 'ai' ? [] : [{
        service: { ...service, id: service.id },
        build: build[service.id],
        details: sitesDetails[service.id],
    }]);
    // Кейсы трёх видов без повторов: у кейса из двух разделов – оба вида, подпись – первая непустая
    const deckCases: IDeckCase[] = [];
    kinds.forEach(({ service, details }) => {
        serviceCases(details.cases.map((c) => c.id), portfolioWorks, portfolioCases).forEach((work) => {
            const text = details.cases.find((c) => c.id === work.id)?.text;
            const seen = deckCases.find((item) => item.id === work.id);
            if (seen) {
                seen.kinds.push(service.title);
                seen.text = seen.text ?? text;
                return;
            }
            deckCases.push({ ...work, cover: portfolioWorks.find((w) => w.id === work.id)?.cover ?? '', kinds: [service.title], text });
        });
    });

    return (
        <div className={s.page}>
            <WindowScene head={<SitesHead tgHref={offerTgButton.href} />} kinds={kinds} />
            <CasesDeck cases={deckCases} />
            <ProjectFlow />
            <PaymentScale />
            <TermsColumns />
            <MoreRow />
            <SitesFaq />
            <SitesCta tgHref={offerTgButton.href} />
        </div>
    );
};

export default SitesPage;
