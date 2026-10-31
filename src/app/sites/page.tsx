import { FC } from "react";
import { Metadata } from "next";

import s from './page.module.scss'
import { offerTgButton, services } from "@/data/offer";
import { baseOpenGraph } from "@/data/metadata";
import { nav, sitesDetails } from "@/data/sitesPage";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { ogSize } from "@/lib/og";
import { sitesPageURL } from "@/constants/urls";
import { serviceCases } from "@/scripts/services";
import SitesHead from "./components/SitesHead";
import SitesNav from "./components/SitesNav";
import SiteSection from "./components/SiteSection";
import CommonTerms from "./components/CommonTerms";
import MoreServices from "./components/MoreServices";
import SitesFaq from "./components/SitesFaq";
import SitesCta from "./components/SitesCta";

// Страница /sites (SERVICES_PLAN У5): состав, опции и условия трёх видов сайтов по макету page_C_sites (раскладка C).
// Тексты – src/data/sitesPage.ts (marketing:draft-content), лицо раздела – карточка главной (offer.ts). Статичная;
// скролл-сцены – шаг У5а. Не в поиске и не в sitemap (next-sitemap.config.js) – до команды владельца после финальной проверки
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
    const sites = services.filter((service) => service.id !== 'ai');

    return (
        <div className={s.page}>
            <SitesHead tgHref={offerTgButton.href} />
            <SitesNav items={nav} />
            {sites.map((service) => {
                if (service.id === 'ai') return null;
                const details = sitesDetails[service.id];
                const works = serviceCases(details.cases.map((c) => c.id), portfolioWorks, portfolioCases);
                const cases = works.map((work) => ({ ...work, text: details.cases.find((c) => c.id === work.id)?.text }));
                return <SiteSection key={service.id} service={service} details={details} cases={cases} />;
            })}
            <CommonTerms />
            <MoreServices />
            <SitesFaq />
            <SitesCta tgHref={offerTgButton.href} />
        </div>
    );
};

export default SitesPage;
