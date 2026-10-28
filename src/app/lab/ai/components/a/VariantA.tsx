import { FC } from "react";

import { IServiceTier } from "@/interfaces/offer";
import OrbScene from "./OrbScene";
import TierDeck from "./TierDeck";
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

// Вариант A «Шар раскрывается»: первый экран – шар демо-чата, скролл открывает его в живой чат;
// дальше ступени из колоды, таблица агентов, как работаем, расходы, условия, FAQ
const VariantA: FC<IVariant> = ({ tiers, note, tgHref }) => (
    <>
        <OrbScene />
        <TierDeck tiers={tiers} note={note} />
        <AgentsTable />
        <HowWeWork />
        <Monthly />
        <Terms />
        <AiFaq />
        <FinalCta tgHref={tgHref} />
    </>
);

export default VariantA;
