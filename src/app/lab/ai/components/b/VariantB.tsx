import { FC } from "react";

import { IServiceTier } from "@/interfaces/offer";
import HeroChat from "./HeroChat";
import Pipeline from "./Pipeline";
import TierSplit from "./TierSplit";
import AgentsTable from "../sections/AgentsTable";
import HowWeWork from "../sections/HowWeWork";
import Monthly from "../sections/Monthly";
import Terms from "../sections/Terms";
import AiFaq from "../sections/AiFaq";
import FinalCta from "../sections/FinalCta";

interface IVariant {
    tiers: IServiceTier[],
    note: string,
    tgHref: string
}

// Вариант B «Агент за работой»: живой чат на первом экране, сцена «вход → шар → отчёт» на четырёх примерах,
// ступени делятся из одной карточки, дальше таблица агентов и те же разделы, что в A
const VariantB: FC<IVariant> = ({ tiers, note, tgHref }) => (
    <>
        <HeroChat tgHref={tgHref} />
        <Pipeline />
        <TierSplit tiers={tiers} note={note} />
        <AgentsTable compact />
        <HowWeWork />
        <Monthly />
        <Terms />
        <AiFaq />
        <FinalCta tgHref={tgHref} />
    </>
);

export default VariantB;
