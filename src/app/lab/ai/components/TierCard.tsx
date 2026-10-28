"use client";

import { FC, ReactNode } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import s from './TierCard.module.scss'
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { ralewayBold } from "@/app/fonts/fonts";
import { IServiceTier } from "@/interfaces/offer";
import Rise from "./Rise";
import { easeOut, span } from "./scene";
import { tierButton } from "../placeholders";

interface ITierCard {
    tier: IServiceTier,
    text: string,
    examples: string[],
    progress: MotionValue<number>,
    // С какой доли прогресса выезжает первая строка; дальше – через LINE_STEP
    textFrom: number,
    // Цена своим элементом (вариант B – счётчик); нет – строкой
    price?: ReactNode,
    // Вариант C: линия и кнопка тоже появляются по прогрессу – карточка рождается пустой из отчёта
    reveal?: boolean
}

const LINE_STEP = .05;
const LINE_DUR = .3;

// Ступень ИИ на странице /ai (черновик): название, цена, срок и условие – из offer.ts (как в карточке главной),
// описание и примеры – заглушки. Строки выезжают из-под масок по прогрессу родителя
const TierCard: FC<ITierCard> = ({ tier, text, examples, progress, textFrom, price, reveal }) => {
    const at = (n: number) => textFrom + n * LINE_STEP;
    const rule = useTransform(progress, (v) => reveal ? easeOut(span(v, at(2.5), LINE_DUR)) : 1);
    const button = <ContactLink className={`${ralewayBold.className} ${s.button}`}>{tierButton}</ContactLink>;

    return (
        <div className={s.body}>
            <h3 className={`${ralewayBold.className} ${s.name}`}>
                <Rise progress={progress} from={at(0)} dur={LINE_DUR}>{tier.title}</Rise>
            </h3>
            <div className={`${ralewayBold.className} ${s.price}`}>
                {price ?? <Rise progress={progress} from={at(1)} dur={LINE_DUR}>{tier.price}</Rise>}
            </div>
            <Rise progress={progress} from={at(2)} dur={LINE_DUR} tag="div">
                <p className={s.meta}>{tier.term} · <span className={s.condition}>{tier.condition}</span></p>
            </Rise>

            <motion.div className={s.rule} style={{ scaleX: rule }} />

            <Rise progress={progress} from={at(3)} dur={LINE_DUR} tag="div">
                <p className={s.text}>{text}</p>
            </Rise>
            {examples.length > 0 && (
                <ul className={s.examples}>
                    {examples.map((example, i) => (
                        <li key={example}>
                            <Rise progress={progress} from={at(4 + i * .5)} dur={LINE_DUR}><span className={s.bulleted}>{example}</span></Rise>
                        </li>
                    ))}
                </ul>
            )}

            <div className={s.actions}>
                {reveal ? <Rise progress={progress} from={at(6)} dur={LINE_DUR} tag="div">{button}</Rise> : button}
            </div>
        </div>
    );
};

export default TierCard;
