"use client";

import { CSSProperties, FC, ReactNode, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motionValue, useMotionValueEvent, useTransform } from "framer-motion";

import sc from '@/app/ai/components/scene.module.scss'
import p from '../Plate.module.scss'
import s from './BuildScene.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { clamp01, useStickyScene } from "@/app/ai/components/scene";
import { portfolioPageURL } from "@/constants/urls";
import { GOALS } from "@/constants/analytics";
import { IService } from "@/interfaces/offer";
import { IPortfolioWork } from "@/interfaces/portfolio";
import { IBuild, ISitesDetails } from "@/interfaces/sitesPage";
import { servicesButton } from "@/data/offer";
import { buildUi, columns, commonId } from "@/data/sitesPage";
import { CorporateMock, CorporateTabs, LandingMock, LeadToast, PanelMock, ShopBar, ShopMock, stepAt } from "./Mocks";

type Kind = Exclude<IService['id'], 'ai'>;

interface IProps {
    service: Pick<IService, 'title' | 'summary' | 'price' | 'term' | 'note'> & { id: Kind },
    build: IBuild,
    details: ISitesDetails,
    cases: (Pick<IPortfolioWork, 'id' | 'name' | 'cover'> & { text?: string })[]
}

// Фазы сцены – доли пути (владелец, У5а: одна сцена на вид, ~4 экрана). Сборка сайта в окне – первая половина,
// дальше колонка у окна сменяется: опции с ценой, «Не входит», оплата; на оплате под «Узнать цену» встают кейсы
const PHASES = { build: [0, .5], options: [.5, .78], excluded: [.78, .88], payment: [.88, 1] } as const;
type Phase = keyof typeof PHASES;
const ORDER: Phase[] = ['build', 'options', 'excluded', 'payment'];

// Строка фазы открывается равномерно по первым 85% её отрезка
const rowAt = (phase: Phase, i: number, n: number) => {
    const [from, to] = PHASES[phase];
    return from + i * (to - from) * .85 / Math.max(1, n);
};

// Без движения – последний кадр
const still = motionValue(1);

// «Блоки на выбор: а; б; в» → список блоков
const blocksOf = (note: string) => note.replace(/^[^:]*:\s*/, '').split(/;\s*/);
// Короткое имя опции для пунктирного блока в окне: до двоеточия или запятой
const shortName = (title: string) => title.split(/[:,(]/)[0].trim();

// Сцена «Сайт собирается на глазах» (SERVICES_PLAN У5а, выбор владельца): липкий экран, в центре – окно браузера,
// в нём по скроллу складывается сайт. Слева – колонка по фазам (состав → опции → «Не входит» → оплата), справа –
// цена, срок и «Узнать цену» из карточки главной, в конце – кейсы. Путь 4 экрана (на телефоне 3,5), движок /ai
// (useStickyScene). При reduced-motion – обычный блок: сайт собран, все фазы списком
const BuildScene: FC<IProps> = ({ service, build, details, cases }) => {
    const scene = useRef<HTMLDivElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const reduceMotion = usePrefersReducedMotion();
    const { progress } = useStickyScene({ scene, path, screen });
    // Окно собирается за фазу сборки: прогресс окна 0–1 – первая половина сцены
    const assembly = useTransform(progress, (k) => clamp01(k / PHASES.build[1]));
    const v = reduceMotion ? still : assembly;

    // Строки фаз: состав – группами, опции (с примером расчёта и «Цену назову на созвоне»), «Не входит», оплата
    const optionRows = details.options.length + 1 + (details.example ? 1 : 0);
    const rows: Record<Phase, number> = {
        build: build.callouts.length,
        options: optionRows,
        excluded: details.excluded.length,
        payment: details.payment.length,
    };

    // Текущая фаза и сколько строк в ней открыто. Группа состава открывается со своим шагом окна
    const stateOf = (k: number): { phase: Phase, row: number } => {
        const phase = [...ORDER].reverse().find((ph) => k >= PHASES[ph][0]) ?? 'build';
        let row = 0;
        if (phase === 'build') {
            const a = clamp01(k / PHASES.build[1]);
            build.callouts.forEach((group, i) => { if (a >= stepAt(group.at, build.steps)) row = i; });
        } else {
            for (let i = 0; i < rows[phase]; i++) if (k >= rowAt(phase, i, rows[phase])) row = i;
        }
        return { phase, row };
    };
    const [state, setState] = useState(() => stateOf(progress.get()));
    useMotionValueEvent(progress, 'change', (k) => {
        const next = stateOf(k);
        if (next.phase !== state.phase || next.row !== state.row) setState(next);
    });
    const at = ORDER.indexOf(state.phase);
    // Без движения – всё открыто
    const phaseOn = (ph: Phase) => reduceMotion || ph === state.phase;
    const rowOn = (ph: Phase, i: number) => reduceMotion || ORDER.indexOf(ph) < at || (ph === state.phase && i <= state.row);
    const rowCurrent = (ph: Phase, i: number) => !reduceMotion && ph === state.phase && i === state.row;
    const priced = details.options.filter((option) => option.price);
    const optionsShown = reduceMotion || at > 1 ? details.options.length : at === 1 ? state.row + 1 : 0;
    const casesOn = reduceMotion || state.phase === 'payment';

    const row = (ph: Phase, i: number, children: ReactNode, className = '') => (
        <li
            key={i}
            className={`${s.row} ${rowOn(ph, i) ? s.shown : ''} ${rowCurrent(ph, i) ? s.current : ''} ${className}`}
        >
            {children}
        </li>
    );

    const titleId = `${service.id}-title`;

    return (
        <div
            ref={scene}
            className={`${sc.scene} ${s.scene} ${reduceMotion ? s.still : ''}`}
            style={{ '--scene-h': 'calc(var(--screen-h) * 5)', '--scene-h-phone': 'calc(var(--screen-h) * 4.5)' } as CSSProperties}
        >
            <div ref={path} className={sc.path} />
            <div ref={screen} className={`${sc.screen} ${s.screen}`}>
                <div className={s.stage}>
                    <div className={s.column}>
                        <section className={`${s.phase} ${phaseOn('build') ? s.on : ''}`} aria-label={columns.included}>
                            <h3 className={`${ralewayBold.className} ${s.heading}`}>{columns.included}</h3>
                            <ol className={s.list}>
                                {build.callouts.map((group, i) => row('build', i, (
                                    <>
                                        {group.label && <span className={`${ralewayBold.className} ${s.groupLabel}`}>{group.label}</span>}
                                        {group.items.map((item) => <span key={item} className={s.item}>{item}</span>)}
                                        {/* Блоки лендинга на выбор – таблетками под «До 8 блоков» */}
                                        {i === 1 && details.included[0]?.note && (
                                            <ul className={s.chips} aria-label={details.included[0].note.split(':')[0]}>
                                                {blocksOf(details.included[0].note).map((block) => <li key={block}>{block}</li>)}
                                            </ul>
                                        )}
                                    </>
                                ), s.group))}
                            </ol>
                            <a href={`#${commonId}`} className={`${p.link} ${s.common}`}>{columns.common}</a>
                        </section>

                        <section className={`${s.phase} ${phaseOn('options') ? s.on : ''}`} aria-label={columns.options}>
                            <h3 className={`${ralewayBold.className} ${s.heading}`}>{columns.options}</h3>
                            <ul className={s.list}>
                                {details.options.map((option, i) => row('options', i, (
                                    <>
                                        <span className={s.name}>
                                            {option.title}
                                            {option.note && <span className={s.tail}>{option.note.replace(/^[,:]?\s*/, '')}</span>}
                                        </span>
                                        {option.price && <span className={`${ralewayBold.className} ${s.cost}`}>{option.price}</span>}
                                    </>
                                ), `${s.option} ${option.price ? '' : s.plain}`))}
                                {details.example && row('options', details.options.length, (
                                    <span className={s.example}>
                                        {details.example.text.replace(/,\s*$/, '')}
                                        <span className={`${ralewayBold.className} ${s.total}`}>{details.example.total}</span>
                                    </span>
                                ))}
                                {row('options', optionRows - 1, (
                                    <span className={s.onCall}>{columns.onCall} {details.onCall}</span>
                                ))}
                            </ul>
                        </section>

                        <section className={`${s.phase} ${phaseOn('excluded') ? s.on : ''}`} aria-label={columns.excluded}>
                            <h3 className={`${ralewayBold.className} ${s.heading}`}>{columns.excluded}</h3>
                            <ul className={s.list}>
                                {details.excluded.map((item, i) => row('excluded', i, (
                                    <>
                                        <svg className={s.minus} viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
                                        <span>{item}</span>
                                    </>
                                ), s.no))}
                            </ul>
                        </section>

                        <section className={`${s.phase} ${phaseOn('payment') ? s.on : ''}`} aria-label={columns.payment}>
                            <h3 className={`${ralewayBold.className} ${s.heading}`}>{columns.payment}</h3>
                            <ul className={s.list}>
                                {details.payment.map((item, i) => {
                                    // Доли из текста: «50% … 50%» – шкала, если в сумме 100
                                    const parts = (item.match(/\d+(?=%)/g) ?? []).map(Number);
                                    const whole = parts.reduce((a, b) => a + b, 0) === 100;
                                    return row('payment', i, (
                                        <span className={s.pay}>
                                            {whole && <span className={s.split} aria-hidden="true">{parts.map((part, k) => <i key={k} style={{ flexGrow: part }} />)}</span>}
                                            {item}
                                        </span>
                                    ));
                                })}
                            </ul>
                        </section>
                    </div>

                    <figure className={`${s.window} ${!reduceMotion && at > 0 ? s.after : ''}`}>
                        <div className={s.bar}>
                            <span className={s.dots} aria-hidden="true"><i /><i /><i /></span>
                            {service.id === 'corporate' ? <CorporateTabs p={v} /> : <span className={s.address} />}
                            {service.id === 'shop' && <ShopBar p={v} />}
                        </div>
                        <div className={s.view} aria-hidden="true">
                            {service.id === 'landing' && <LandingMock p={v} />}
                            {service.id === 'corporate' && <CorporateMock p={v} />}
                            {service.id === 'shop' && <ShopMock p={v} />}
                            {/* Опции – пунктирными блоками «+» поверх собранного сайта, по одной со строкой опции */}
                            <ul className={`${ralewayBold.className} ${s.plus} ${optionsShown > 0 ? s.on : ''}`}>
                                {priced.map((option) => (
                                    <li key={option.title} className={details.options.indexOf(option) < optionsShown ? s.shown : ''}>
                                        + {shortName(option.title)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {service.id === 'landing' && <LeadToast p={v} />}
                        {service.id === 'corporate' && <PanelMock p={v} at={stepAt(2, 3)} />}
                        {service.id === 'shop' && <PanelMock p={v} at={stepAt(4, 5)} orders />}
                        <figcaption className={s.caption}>{buildUi.caption}</figcaption>
                    </figure>

                    <div className={s.side}>
                        <h2 id={titleId} className={`${ralewayBold.className} ${s.title}`}>{service.title}</h2>
                        <p className={s.summary}>{service.summary}</p>
                        <p className={`${ralewayBold.className} ${s.price}`}>{service.price}</p>
                        <p className={s.term}>{service.term}</p>
                        {service.note && <p className={s.note}>{service.note}</p>}
                        <ContactLink
                            service={service.id}
                            className={`${ralewayBold.className} ${p.button} ${s.button}`}
                            data-goal={GOALS.serviceClick}
                            data-goal-id={service.id}
                            aria-label={`${servicesButton}: ${service.title}`}
                        >
                            {servicesButton}
                        </ContactLink>
                        {cases.length > 0 && (
                            <div className={`${s.cases} ${casesOn ? s.on : ''}`}>
                                <p className={s.casesTitle}>{columns.cases}</p>
                                <ul>
                                    {cases.map((work) => (
                                        <li key={work.id}>
                                            <Link href={`${portfolioPageURL}/${work.id}`} className={s.case}>
                                                <span className={s.thumb}><Image src={work.cover} alt="" fill sizes="64px" /></span>
                                                <span className={s.caseInfo}>
                                                    <span className={ralewayBold.className}>{work.name}</span>
                                                    {work.text && <span className={s.caseText}>{work.text}</span>}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildScene;
