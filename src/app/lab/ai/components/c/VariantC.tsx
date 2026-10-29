import { FC } from "react";

import { IServiceTier } from "@/interfaces/offer";
import ChatWorkScene from "./ChatWorkScene";
import AgentDeck from "./AgentDeck";
import HowWeWork from "../sections/HowWeWork";
import Monthly from "../sections/Monthly";
import Terms from "../sections/Terms";
import AiFaq from "../sections/AiFaq";
import CtaScene from "./CtaScene";

interface IVariant {
    tiers: IServiceTier[],
    note: string,
    tgHref: string
}

// Вариант C «Работа → чат → цены» (выбор владельца): первый экран и чат из A, «агент за работой» из B и ступени –
// одной сценой: что умеет → живой пример → цена. Вторая ступень продолжается сценой агентов (AgentDeck: две карточки
// и шар между ними, слайды по два); карточки втягиваются в шар, из него собирается линия шагов HowWeWork (joined).
// Ниже – общие разделы, как в A и B
const VariantC: FC<IVariant> = ({ tiers, note, tgHref }) => (
    <>
        <ChatWorkScene tiers={tiers} note={note} />
        <AgentDeck />
        <HowWeWork joined />
        <Monthly />
        <Terms />
        <AiFaq />
        <CtaScene tgHref={tgHref} />
    </>
);

export default VariantC;
