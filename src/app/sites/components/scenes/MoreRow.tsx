"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import x from './Scenes.module.scss'
import s from './MoreRow.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import Rise from "@/app/ai/components/Rise";
import { easeOut, rise, span } from "@/app/ai/components/scene";
import { moreId, morePills, sections } from "@/data/sitesPage";
import Scene, { ISceneMode } from "./Scene";
import { moreTimes, TEXT } from "./times";

// Таблетка встаёт снизу с проявлением, по одной
const Pill: FC<{ time: MotionValue<number>, at: number, animated: boolean, title: string, price?: string }> = ({ time, at, animated, title, price }) => {
    const k = useTransform(time, (v) => span(v, at, TEXT));
    const opacity = useTransform(k, (v) => easeOut(v));
    const y = useTransform(k, (v) => 14 * (1 - rise(v)));
    return (
        <motion.li className={s.pill} style={animated ? { opacity, y } : undefined}>
            {title}{price && <> · <b className={ralewayBold.className}>{price}</b></>}
        </motion.li>
    );
};

const MoreBody: FC<{ time: MotionValue<number>, mode: ISceneMode, onLen: (len: number) => void }> = ({ time, mode, onLen }) => {
    const t = useMemo(() => moreTimes(morePills.pills.length), []);
    useEffect(() => onLen(t.path), [onLen, t.path]);
    const headOn = useTransform(time, (v) => easeOut(span(v, t.head, .1)));

    return (
        <>
            <motion.div className={s.head} style={mode.sticky ? { opacity: headOn } : undefined}>
                <h2 id={`${moreId}-title`} className={`${ralewayBold.className} ${x.title}`}>{sections.more.title}</h2>
                <p className={x.description}>{sections.more.text}</p>
            </motion.div>
            <ul className={s.pills}>
                {morePills.pills.map((pill, i) => (
                    <Pill key={pill.title} time={time} at={t.pills[i]} animated={mode.sticky} title={pill.title} price={pill.price} />
                ))}
            </ul>
            <p className={s.quiet}>
                <Rise progress={time} from={t.quiet} dur={TEXT}>{morePills.quiet}</Rise>
            </p>
        </>
    );
};

// «Ещё делаю» (SERVICES_PLAN У5б, этап 2) – одной строкой таблеток «имя · цена» (как опции в окне, но сплошным
// контуром: это отдельные услуги, а не добавки к сайту), под ними тихая строка – поддержка по часу, перенос, партнёры
const MoreRow: FC = () => {
    const [len, setLen] = useState(1);
    return (
        <Scene id={moreId} labelledBy={`${moreId}-title`} len={len}>
            {(time, mode) => <MoreBody time={time} mode={mode} onLen={setLen} />}
        </Scene>
    );
};

export default MoreRow;
