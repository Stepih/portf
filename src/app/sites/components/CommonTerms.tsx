import { FC } from "react";

import p from './Plate.module.scss'
import s from './CommonTerms.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { commonId, commonTopics, sections } from "@/data/sitesPage";
import { ISitesTopic } from "@/interfaces/sitesPage";
import ProjectPath from "./ProjectPath";

// Место темы в сетке – по порядку commonTopics: «Входит в каждый сайт» – крупная, «Сайт остаётся вам» – залита
// чернилами (главное обещание), хостинг и работа по часу – с крупной цифрой, оформление и платформа – без плашки
const look: Record<string, string> = {
    'Входит в каждый сайт': s.every,
    'Макет и правки': s.mockup,
    'Срок': s.term,
    'Оплата': s.payment,
    'Гарантия и поддержка': s.warranty,
    'Хостинг и домен': s.hosting,
    'Сайт остаётся вам': s.yours,
    'Работа по часу': s.hourly,
    'Оформление и связь': s.contact,
    'На чём делаю': s.stack,
};

// Шкала долей платежа: отрезки по долям, подпись – пункт списка
const Split: FC<{ parts: number[], text: string }> = ({ parts, text }) => (
    <li className={s.split}>
        <span className={s.bar} aria-hidden="true">
            {parts.map((part, i) => <i key={i} style={{ flexGrow: part }} />)}
        </span>
        <span>{text}</span>
    </li>
);

const Topic: FC<{ topic: ISitesTopic }> = ({ topic }) => {
    const splits = topic.splits ?? [];
    return (
        <div className={`${s.topic} ${look[topic.title] ?? ''}`}>
            <h3 className={`${ralewayBold.className} ${s.name}`}>{topic.title}</h3>
            {topic.figure && <p className={`${ralewayBold.className} ${s.figure}`}>{topic.figure}</p>}
            <ul className={`${p.list} ${s.list}`}>
                {topic.items.map((item, i) => splits[i]
                    ? <Split key={item} parts={splits[i]} text={item} />
                    : <li key={item}>{item}</li>)}
            </ul>
            {topic.notes?.map((note) => <p key={note} className={p.note}>{note}</p>)}
        </div>
    );
};

// «Для всех сайтов» (У5а, владелец: «путь + сетка»): сначала путь проекта, ниже – темы раздела 1 списка сеткой
// разного размера. Сюда ведут строки «Всё, что есть в каждом сайте»
const CommonTerms: FC = () => {
    return (
        <section id={commonId} className={s.common} aria-labelledby={`${commonId}-title`}>
            <div className={s.head}>
                <h2 id={`${commonId}-title`} className={`${ralewayBold.className} ${p.title}`}>{sections.common.title}</h2>
                <p className={p.text}>{sections.common.text}</p>
            </div>

            <ProjectPath />

            <div className={s.grid}>
                {commonTopics.map((topic) => <Topic key={topic.title} topic={topic} />)}
            </div>
        </section>
    )
}

export default CommonTerms
