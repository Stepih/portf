import { FC } from "react";
import { Metadata } from "next";

import s from './page.module.scss'
import { offerTgButton, services } from "@/data/offer";
import LabSwitch, { LabVariant } from "./components/LabSwitch";
import VariantA from "./components/a/VariantA";
import VariantB from "./components/b/VariantB";
import VariantC from "./components/c/VariantC";

interface IProps {
    searchParams: Promise<{ v?: string | string[] }>
}

// Черновик страницы /ai (SERVICES_PLAN У4): два варианта раскладки и анимации на заглушках, владелец выбирает.
// Не в поиске и не в sitemap (/lab/* в next-sitemap.config.js); после выбора – перенос на /ai, черновик удаляется
export const metadata: Metadata = {
    title: 'Черновик /ai – варианты',
    robots: { index: false, follow: false },
};

const LabAiPage: FC<IProps> = async ({ searchParams }) => {
    const param = (await searchParams).v;
    const v: LabVariant = param === 'b' || param === 'c' ? param : 'a';
    // Ступени, уточнение и Telegram – настоящие данные главной (offer.ts), остальное – заглушки
    const ai = services.find((service) => service.tiers);
    const Variant = { a: VariantA, b: VariantB, c: VariantC }[v];

    return (
        <div className={s.page}>
            {/* key: при смене варианта сцены монтируются заново */}
            <Variant key={v} tiers={ai?.tiers ?? []} note={ai?.note ?? ''} tgHref={offerTgButton.href} />
            <LabSwitch current={v} />
        </div>
    );
};

export default LabAiPage;
