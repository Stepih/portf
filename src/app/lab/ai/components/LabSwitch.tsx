import { FC } from "react";
import Link from "next/link";

import s from './LabSwitch.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";

export type LabVariant = 'a' | 'b' | 'c';

const labels: Record<LabVariant, string> = { a: 'A · Шар раскрывается', b: 'B · Агент за работой', c: 'C · Работа → чат → цены' };

// Переключатель вариантов черновика (ANIMATION_PLAN: демо – ?v=), служебный, на сайт не идёт
const LabSwitch: FC<{ current: LabVariant }> = ({ current }) => (
    <nav className={`${ralewayRegular.className} ${s.switch}`} aria-label="Варианты страницы">
        <span className={s.note}>Черновик /ai, заглушки</span>
        {(Object.keys(labels) as LabVariant[]).map((v) => (
            <Link
                key={v}
                href={`?v=${v}`}
                className={`${s.link} ${v === current ? `${s.current} ${ralewayBold.className}` : ''}`}
                aria-current={v === current ? 'page' : undefined}
                scroll
            >
                {labels[v]}
            </Link>
        ))}
    </nav>
);

export default LabSwitch;
