import { FC, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";

import p from './Plate.module.scss'
import s from './SiteDetails.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import { IPortfolioWork } from "@/interfaces/portfolio";
import { ISitesDetails, ISitesOption } from "@/interfaces/sitesPage";
import { columns, commonId } from "@/data/sitesPage";

// Опция прайса: название слева, цена справа через отточие, хвост после цены – мелкой строкой под названием
export const PriceRow: FC<{ option: ISitesOption }> = ({ option }) => (
    <li className={`${s.row} ${option.price ? '' : s.plain}`}>
        <span className={s.name}>
            {option.title}
            {option.note && <span className={s.tail}>{option.note.replace(/^[,:]?\s*/, '')}</span>}
        </span>
        {option.price && <span className={`${ralewayBold.className} ${s.cost}`}>{option.price}</span>}
    </li>
);

// Длинный состав (магазин – 10 пунктов) не стеной: первые SHOWN видны, остальные – под «Ещё N» (все факты на странице)
const SHOWN = 6;
const more = (n: number) => `Ещё ${n} ${n % 10 === 1 && n % 100 !== 11 ? 'пункт' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'пункта' : 'пунктов'}`;

// «Блоки на выбор: а; б; в» → список блоков
const blocksOf = (note: string) => note.replace(/^[^:]*:\s*/, '').split(/;\s*/);

interface IProps {
    details: ISitesDetails,
    cases: (Pick<IPortfolioWork, 'id' | 'name' | 'cover'> & { text?: string })[]
}

// Под сценой вида сайта (У5а, владелец: «окно + опции рядом»): главное – прайс «Можно добавить» на плашке, рядом
// без плашки – полный состав, «Не входит» и «Оплата». Ниже – кейсы скриншотами. У каждого вида свой акцент:
// у лендинга – блоки на выбор таблетками, у сайта компании – пример расчёта формулой, у магазина – две колонки
// «Магазин / Каталог без корзины»
const SiteDetails: FC<IProps> = ({ details, cases }) => {
    const twoGroups = details.included.length > 1;

    return (
        <div className={s.details}>
            <div className={`${p.plate} ${s.prices}`}>
                <h3 className={`${ralewayBold.className} ${s.heading}`}>{columns.options}</h3>
                <ul className={s.list}>
                    {details.options.map((option) => <PriceRow key={option.title} option={option} />)}
                </ul>
                <p className={s.onCall}>{columns.onCall} {details.onCall}</p>
            </div>

            <div className={`${s.terms} ${twoGroups ? s.wide : ''}`}>
                <h3 className={`${ralewayBold.className} ${s.heading}`}>{columns.included}</h3>
                <div className={twoGroups ? s.groups : undefined}>
                    {details.included.map((group, i) => (
                        <Fragment key={i}>
                            <div>
                                {group.label && <p className={`${ralewayBold.className} ${s.group}`}>{group.label}</p>}
                                <ul className={`${p.list} ${s.included}`}>
                                    <li><a href={`#${commonId}`} className={p.link}>{columns.common}</a></li>
                                    {group.items.slice(0, SHOWN).map((item) => <li key={item}>{item}</li>)}
                                </ul>
                                {group.items.length > SHOWN && (
                                    <details className={s.rest}>
                                        <summary className={ralewayBold.className}>{more(group.items.length - SHOWN)}</summary>
                                        <ul className={`${p.list} ${s.included}`}>
                                            {group.items.slice(SHOWN).map((item) => <li key={item}>{item}</li>)}
                                        </ul>
                                    </details>
                                )}
                            </div>
                        </Fragment>
                    ))}
                </div>
                {details.included.map((group, i) => group.note && (
                    <ul key={i} className={s.blocks} aria-label={group.note.split(':')[0]}>
                        {blocksOf(group.note).map((block) => <li key={block}>{block}</li>)}
                    </ul>
                ))}

                <div className={s.pair}>
                    <div>
                        <h3 className={`${ralewayBold.className} ${s.heading}`}>{columns.excluded}</h3>
                        <ul className={`${p.list} ${s.small}`}>
                            {details.excluded.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h3 className={`${ralewayBold.className} ${s.heading}`}>{columns.payment}</h3>
                        <ul className={`${p.list} ${s.small}`}>
                            {details.payment.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            </div>

            {details.example && (
                // «Пример: что считаем – формула,» → подпись и формула крупно, итог – крупнее
                <p className={s.example}>
                    <span className={s.what}>{details.example.text.split(/\s–\s/)[0]}</span>
                    <span className={s.formula}>
                        {details.example.text.split(/\s–\s/).slice(1).join(' – ').replace(/,\s*$/, '')}
                        <svg className={s.arrow} viewBox="0 0 28 12" aria-hidden="true"><path d="M0 6h26M21 1l5 5-5 5" /></svg>
                        <span className={`${ralewayBold.className} ${s.total}`}>{details.example.total}</span>
                    </span>
                </p>
            )}

            {cases.length > 0 && (
                <div className={s.cases}>
                    <h3 className={`${ralewayBold.className} ${s.heading}`}>{columns.cases.replace(/:$/, '')}</h3>
                    <ul className={s.caseList}>
                        {cases.map((work) => (
                            <li key={work.id} className={s.case}>
                                <Link href={`${portfolioPageURL}/${work.id}`} className={s.caseLink}>
                                    <span className={s.shot}>
                                        <Image src={work.cover} alt="" fill sizes="(max-width: 700px) 80vw, 280px" />
                                    </span>
                                    <span className={`${ralewayBold.className} ${s.caseName}`}>{work.name}</span>
                                </Link>
                                {work.text && <span className={s.caseText}>{work.text}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SiteDetails;
