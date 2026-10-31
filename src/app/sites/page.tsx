import { FC } from "react";
import { Metadata } from "next";

import s from './page.module.scss'
import { offerTgButton, services } from "@/data/offer";
import { baseOpenGraph } from "@/data/metadata";
import { build, nav, sitesDetails } from "@/data/sitesPage";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { ogSize } from "@/lib/og";
import { sitesPageURL } from "@/constants/urls";
import { serviceCases } from "@/scripts/services";
import SitesHead from "./components/SitesHead";
import SitesNav from "./components/SitesNav";
import BuildScene from "./components/build/BuildScene";
import SiteDetails from "./components/SiteDetails";
import CommonTerms from "./components/CommonTerms";
import MoreServices from "./components/MoreServices";
import SitesFaq from "./components/SitesFaq";
import SitesCta from "./components/SitesCta";

// Страница /sites (SERVICES_PLAN У5, раскладка – У5а): по аналогии с /ai. Каждый вид сайта – сцена «Сайт собирается
// на глазах» (окно браузера по скроллу, цена и «Узнать цену» рядом – лицо карточки главной, offer.ts), под ней – прайс
// опций, состав и кейсы. Дальше путь проекта и темы «Для всех сайтов», «Ещё делаю», FAQ, финал.
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
    const sites = services.filter((service) => service.id !== 'ai');

    return (
        <div className={s.page}>
            <SitesHead tgHref={offerTgButton.href} />
            <SitesNav items={nav} />
            {sites.map((service) => {
                if (service.id === 'ai') return null;
                const details = sitesDetails[service.id];
                const works = serviceCases(details.cases.map((c) => c.id), portfolioWorks, portfolioCases);
                const cases = works.map((work) => ({
                    ...work,
                    cover: portfolioWorks.find((w) => w.id === work.id)?.cover ?? '',
                    text: details.cases.find((c) => c.id === work.id)?.text,
                }));
                // Секция с якорем (/sites#corporate из карточки главной) – от начала сцены до кейсов
                return (
                    <section key={service.id} id={service.id} className={s.site} aria-labelledby={`${service.id}-title`}>
                        <BuildScene service={{ ...service, id: service.id }} callouts={build[service.id].callouts} />
                        <SiteDetails details={details} cases={cases} />
                    </section>
                );
            })}
            <CommonTerms />
            <MoreServices />
            <SitesFaq />
            <SitesCta tgHref={offerTgButton.href} />
        </div>
    );
};

export default SitesPage;
