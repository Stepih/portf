"use client";

import { CSSProperties, FC, MouseEvent, ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { animate, motion, MotionStyle, MotionValue, motionValue, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";

import sc from '@/app/ai/components/scene.module.scss'
import p from '../Plate.module.scss'
import s from './WindowScene.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { clamp01, easeOut, lerp, move, offsetIn, span, useStickyScene } from "@/app/ai/components/scene";
import { GOALS } from "@/constants/analytics";
import { IService } from "@/interfaces/offer";
import { IBuild, ISitesDetails } from "@/interfaces/sitesPage";
import { servicesButton } from "@/data/offer";
import { buildUi, columns } from "@/data/sitesPage";
import { CorporateMock, CorporateTabs, LandingMock, LeadToast, PanelMock, ShopBar, ShopMock, stepAt } from "./Mocks";
import { ANCHOR_AFTER, FADE, INTRO, IKindRows, IPlan, IState, Kind, KINDS, mockP, planFor, stateAt } from "./timeline";
import { windowEls, windowFade, windowTook } from "../scenes/handoff";

export interface IWindowKind {
    service: Pick<IService, 'title' | 'price' | 'term' | 'note'> & { id: Kind },
    build: IBuild,
    details: ISitesDetails
}

interface IProps {
    // Первый экран (SitesHead): над пустым окном, уходит вверх, когда окно встаёт по центру
    head: ReactNode,
    kinds: IWindowKind[]
}

// Окно в покое – меньше и ниже, под первым экраном (как шар на /ai): отступ от подсказки и масштаб
const REST_GAP = 32;
const REST_SCALE = .86;

const nbsp = ' ';
// Тихая строка под окном: опции без таблетки («ИИ-агент – отдельная услуга», запись с оговоркой) и «Цену назову на созвоне»
const quietLine = ({ build, details }: IWindowKind) => {
    const inPills = new Set(build.pills.map((pill) => pill.option));
    const rest = details.options
        .filter((_, i) => !inPills.has(i))
        .map((option) => option.price ? `${option.title}${nbsp}– ${option.price}${option.note ?? ''}` : option.title);
    return [...(rest.length ? [`${rest.join('; ')}.`] : []), `${columns.onCall} ${details.onCall}`].join(' ');
};

const rowsOf = (kinds: IWindowKind[]) => Object.fromEntries(kinds.map(({ service, build }) => [service.id, {
    groups: build.callouts.map((group) => group.at),
    steps: build.steps,
    pills: build.pills.length,
    terms: build.sum?.terms.length ?? 0,
}])) as Record<Kind, IKindRows>;

const formatRub = (v: number) => `${Math.round(v / 1000) * 1000}`.replace(/\B(?=(\d{3})+(?!\d))/g, nbsp);

// Без движения – последний кадр
const still = motionValue(1);
const shown = motionValue(1);

interface IWindow {
    kinds: IWindowKind[],
    // Вкладка, подсвеченная в строке окна
    active: Kind,
    // Какие виды нарисованы в окне (в сцене – все три слоями, без движения – один)
    layers: Kind[],
    p: Record<Kind, MotionValue<number>>,
    opacity?: Record<Kind, MotionValue<number>>,
    // Сколько таблеток опций и слагаемых счётчика стоит у вида
    pills: (kind: Kind) => number,
    terms: (kind: Kind) => number,
    onTab: (e: MouseEvent<HTMLAnchorElement>, kind: Kind) => void,
    style?: MotionStyle,
    // Стык с колодой кейсов: содержимое окна гаснет, остаётся пустая рамка (scenes/handoff.ts)
    contentOpacity?: MotionValue<number>,
    windowRef?: (el: HTMLElement | null) => void
}

// Окно браузера: сверху вкладки видов, ниже строка адреса (у сайта компании – его страницы, у магазина – поиск и
// корзина), в окне – нарисованный сайт, таблетки опций, заявка, панель и счётчик суммы
const BrowserWindow: FC<IWindow> = ({ kinds, active, layers, p, opacity, pills, terms, onTab, style, contentOpacity, windowRef }) => {
    const layer = (kind: Kind, className: string, children: ReactNode) => (
        <motion.div key={kind} className={className} style={{ opacity: opacity?.[kind] ?? shown }}>{children}</motion.div>
    );
    const shownKinds = kinds.filter(({ service }) => layers.includes(service.id));

    return (
        <motion.figure ref={windowRef} className={s.window} style={style}>
            <motion.div className={s.content} style={{ opacity: contentOpacity ?? shown }}>
            <div className={s.strip}>
                <span className={s.dots} aria-hidden="true"><i /><i /><i /></span>
                <nav className={`${ralewayBold.className} ${s.tabs}`} aria-label={buildUi.tabs}>
                    {kinds.map(({ service }) => (
                        <a
                            key={service.id}
                            href={`#${service.id}`}
                            className={`${s.tab} ${active === service.id ? s.tabOn : ''}`}
                            aria-current={active === service.id ? 'location' : undefined}
                            onClick={(e) => onTab(e, service.id)}
                        >
                            <span className={s.tabLabel}>{service.title}</span>
                        </a>
                    ))}
                </nav>
            </div>
            <div className={s.toolbar} aria-hidden="true">
                {shownKinds.map(({ service }) => layer(service.id, s.toolLayer, (
                    <>
                        {service.id === 'corporate' ? <CorporateTabs p={p.corporate} /> : <span className={s.address} />}
                        {service.id === 'shop' && <ShopBar p={p.shop} />}
                    </>
                )))}
            </div>
            <div className={s.view} aria-hidden="true">
                {shownKinds.map(({ service, build, details }) => layer(service.id, s.viewLayer, (
                    <>
                        {service.id === 'landing' && <LandingMock p={p.landing} />}
                        {service.id === 'corporate' && <CorporateMock p={p.corporate} />}
                        {service.id === 'shop' && <ShopMock p={p.shop} />}
                        {/* Опции – таблетками «+ имя · цена» поверх собранного сайта, по одной */}
                        <ul className={s.pills}>
                            {build.pills.map((pill, i) => (
                                <li key={pill.option} className={`${s.pill} ${i < pills(service.id) ? s.shown : ''}`}>
                                    + {pill.label} · <b className={ralewayBold.className}>{details.options[pill.option]?.price}</b>
                                </li>
                            ))}
                        </ul>
                    </>
                )))}
            </div>
            {shownKinds.map(({ service, build, details }) => layer(service.id, s.overLayer, (
                <>
                    {service.id === 'landing' && <LeadToast p={p.landing} />}
                    {service.id === 'corporate' && <PanelMock p={p.corporate} at={stepAt(2, 3)} />}
                    {service.id === 'shop' && <PanelMock p={p.shop} at={stepAt(4, 5)} orders />}
                    {build.sum && details.example && <Sum sum={build.sum} total={details.example.total} term={terms(service.id)} />}
                </>
            )))}
            </motion.div>
            <figcaption className={s.caption}>{buildUi.caption}</figcaption>
        </motion.figure>
    );
};

// Счётчик суммы сайта компании: слагаемые встают по одному, итог догоняет их счётом, в конце – «от 47 000 ₽»
const Sum: FC<{ sum: NonNullable<IBuild['sum']>, total: string, term: number }> = ({ sum, total, term }) => {
    const n = sum.terms.length;
    const target = term > 0 ? sum.totals[Math.min(term, n) - 1] : 0;
    const value = useMotionValue(target);
    useEffect(() => {
        const controls = animate(value, target, { duration: .6, ease: 'easeOut' });
        return () => controls.stop();
    }, [value, target]);
    const text = useTransform(value, (v) => `${formatRub(v)}${nbsp}₽`);
    const done = term > n;

    return (
        <div className={`${s.sum} ${term > 0 ? s.on : ''}`}>
            <p className={s.sumCaption}>{sum.caption}</p>
            <p className={s.terms}>
                {sum.terms.map((item, j) => (
                    <span key={item.value} className={`${s.term} ${j < term ? s.shown : ''}`}>
                        <span className={ralewayBold.className}>{j > 0 && '+ '}{item.value}</span>
                        <span className={s.termLabel}>{item.label}</span>
                    </span>
                ))}
            </p>
            <p className={`${ralewayBold.className} ${s.total}`}>
                {done ? total.replace(/ /g, nbsp) : <motion.span>{text}</motion.span>}
            </p>
        </div>
    );
};

// Строки под окном у вида: группы состава, опции (тихая строка), цена. Без движения – всё списком
const kindText = (item: IWindowKind) => ({
    groups: item.build.callouts,
    quiet: quietLine(item),
});

// Цена вида: название, «от 8 000 ₽ · 3–4 дня», уточнение, «Узнать цену» – одним фокусом
const Price: FC<{ item: IWindowKind, className?: string, hidden?: boolean }> = ({ item, className = '', hidden }) => {
    const { service } = item;
    return (
        <div className={`${s.price} ${className}`}>
            <div className={s.priceText}>
                <h2 id={`${service.id}-title`} className={`${ralewayBold.className} ${s.kindTitle}`}>{service.title}</h2>
                <p className={s.priceLine}>
                    <span className={`${ralewayBold.className} ${s.cost}`}>{service.price}</span>
                    <span className={s.termText}>{service.term}</span>
                </p>
                {service.note && <p className={s.note}>{service.note}</p>}
            </div>
            <ContactLink
                service={service.id}
                className={`${ralewayBold.className} ${p.button} ${s.button}`}
                data-goal={GOALS.serviceClick}
                data-goal-id={service.id}
                aria-label={`${servicesButton}: ${service.title}`}
                tabIndex={hidden ? -1 : undefined}
            >
                {servicesButton}
            </ContactLink>
        </div>
    );
};

// Сцена «окно-герой» /sites (SERVICES_PLAN У5б, этап 1; решение владельца «Окно-герой»): одна липкая сцена на три
// вида сайта, движок /ai (useStickyScene). На первом экране под заголовком – пустое окно браузера; по скроллу оно
// встаёт по центру, и в нём по очереди собираются лендинг, сайт компании и магазин (Mocks.tsx). Вид – вкладка в
// строке окна, клик прокручивает к началу его сборки; якоря /sites#landing|corporate|shop – метки на пути сцены.
// Под окном – одна строка текущего шага: состав группами → «Можно добавить» тихой строкой → цена и «Узнать цену».
// Опции – таблетками в окне, у сайта компании – счётчик суммы. Время и фазы – timeline.ts.
// При reduced-motion – обычные блоки: по каждому виду собранное окно, состав, опции и цена
const WindowScene: FC<IProps> = ({ head, kinds }) => {
    const reduceMotion = usePrefersReducedMotion();
    const phone = useMediaQuery('(max-width: 700px)');
    const plan = useMemo<IPlan>(() => planFor(phone), [phone]);
    // Метки якорей ставит CSS (до гидрации и на любой ширине): начало вида в экранах для компьютера и телефона
    const plans = useMemo(() => ({ desktop: planFor(false), phone: planFor(true) }), []);
    const rows = useMemo(() => rowsOf(kinds), [kinds]);

    const scene = useRef<HTMLDivElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const intro = useRef<HTMLDivElement>(null);
    const win = useRef<HTMLElement | null>(null);
    const [dy, setDy] = useState(0);

    // Путь окна с первого экрана на середину: от его места в покое (под подсказкой) до места в сцене
    const onMeasure = useCallback(() => {
        if (!stage.current || !intro.current || !win.current) return;
        const bottom = intro.current.offsetTop + intro.current.offsetHeight + REST_GAP;
        setDy(Math.max(0, bottom - offsetIn(win.current, stage.current).y));
    }, []);
    const { progress } = useStickyScene({ scene, path, screen }, onMeasure);

    // Стык с колодой кейсов (scenes/handoff.ts): колода кладёт пустую карточку точь-в-точь на окно; пока она гасит
    // содержимое окна и забирает рамку – окно прячется, строка под ним гаснет
    useLayoutEffect(() => {
        if (reduceMotion || !win.current || !screen.current) return;
        windowEls.set({ win: win.current, screen: screen.current });
        return () => windowEls.set(null);
    }, [reduceMotion]);
    const contentOn = useTransform(windowFade, (v) => 1 - v);
    const frameOn = useTransform(windowTook, (v) => 1 - v);
    const handedOff = useTransform(windowFade, (v) => v > .5 ? 'none' : 'auto');
    const time = useTransform(progress, (k) => k * plan.total);

    const [state, setState] = useState<IState>(() => stateAt(plan, rows, 0));
    const [atRest, setAtRest] = useState(true);
    const sync = useCallback((t: number) => {
        const next = stateAt(plan, rows, t);
        setState((prev) => next.kind !== prev.kind || next.phase !== prev.phase || next.row !== prev.row || next.term !== prev.term ? next : prev);
        setAtRest(t < INTRO * .4);
    }, [plan, rows]);
    useMotionValueEvent(time, 'change', sync);
    // План сменился (телефон известен только после монтирования) – строка под окном по новому плану
    useEffect(() => sync(time.get()), [sync, time]);

    // ---------- Первый экран → окно по центру ----------
    const introK = useTransform(time, (t) => move(span(t, 0, INTRO)));
    const headOpacity = useTransform(time, (t) => 1 - easeOut(span(t, .02, INTRO * .6)));
    const headY = useTransform(time, (t) => -60 * move(span(t, 0, INTRO * .7)));
    const winY = useTransform(introK, (m) => dy * (1 - m));
    const winScale = useTransform(introK, (m) => lerp(REST_SCALE, 1, m));

    // ---------- Виды в окне: прогресс сборки и слой ----------
    const kindPlan = (kind: Kind) => plan.kinds.find((k) => k.kind === kind) ?? plan.kinds[0];
    const pLanding = useTransform(time, (t) => mockP(kindPlan('landing'), t));
    const pCorporate = useTransform(time, (t) => mockP(kindPlan('corporate'), t));
    const pShop = useTransform(time, (t) => mockP(kindPlan('shop'), t));
    // Собранный сайт гаснет за FADE до начала следующего вида; следующий проявляется в то же время
    const layerAt = (kind: Kind, t: number) => {
        const i = KINDS.indexOf(kind);
        const k = kindPlan(kind);
        const fadeIn = i === 0 ? 1 : clamp01((t - (k.from - FADE)) / FADE);
        const fadeOut = i === KINDS.length - 1 ? 0 : clamp01((t - (k.to - FADE)) / FADE);
        return fadeIn * (1 - fadeOut);
    };
    const oLanding = useTransform(time, (t) => layerAt('landing', t));
    const oCorporate = useTransform(time, (t) => layerAt('corporate', t));
    const oShop = useTransform(time, (t) => layerAt('shop', t));

    const current = KINDS.indexOf(state.kind);
    // Таблетки и слагаемые прошлого вида стоят, пока его сайт гаснет
    const pillsOf = (kind: Kind) => {
        const i = KINDS.indexOf(kind);
        if (i < current) return rows[kind].pills;
        if (i > current) return 0;
        return state.phase === 'options' || state.phase === 'price' ? state.row : 0;
    };
    const termsOf = (kind: Kind) => {
        const i = KINDS.indexOf(kind);
        if (i < current) return rows[kind].terms + 1;
        return i === current ? state.term : 0;
    };

    // Клик по вкладке – плавно к началу вида (метка якоря на пути сцены или раздел без движения)
    const onTab = (e: MouseEvent<HTMLAnchorElement>, kind: Kind) => {
        const target = document.getElementById(kind);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', `#${kind}`);
    };

    // ---------- Без движения: обычные блоки ----------
    if (reduceMotion) {
        const stillP = { landing: still, corporate: still, shop: still };
        return (
            <div className={s.static}>
                {head}
                {kinds.map((item) => {
                    const { service, build, details } = item;
                    const text = kindText(item);
                    return (
                        <section key={service.id} id={service.id} className={s.staticKind} aria-labelledby={`${service.id}-title`}>
                            <BrowserWindow
                                kinds={kinds}
                                active={service.id}
                                layers={[service.id]}
                                p={stillP}
                                pills={() => build.pills.length}
                                terms={() => (build.sum?.terms.length ?? 0) + 1}
                                onTab={onTab}
                            />
                            <Price item={item} />
                            <div className={s.staticText}>
                                <h3 className={`${ralewayBold.className} ${s.staticLabel}`}>{columns.included}</h3>
                                <ul className={s.staticList}>
                                    {text.groups.flatMap((group) => [
                                        ...(group.label ? [<li key={group.label} className={`${ralewayBold.className} ${s.groupLabel}`}>{group.label}</li>] : []),
                                        ...group.items.map((line) => <li key={line}>{line}</li>),
                                    ])}
                                </ul>
                                <h3 className={`${ralewayBold.className} ${s.staticLabel}`}>{columns.options}</h3>
                                <ul className={s.staticList}>
                                    {build.pills.map((pill) => {
                                        const option = details.options[pill.option];
                                        return <li key={pill.option}>{option?.title}{nbsp}– <b className={ralewayBold.className}>{option?.price}</b>{option?.note}</li>;
                                    })}
                                </ul>
                                <p className={s.quiet}>{text.quiet}</p>
                            </div>
                        </section>
                    );
                })}
            </div>
        );
    }

    const on = (kind: Kind, phase: IState['phase'], row?: number) =>
        state.kind === kind && state.phase === phase && (row === undefined || state.row === row);

    return (
        <div
            ref={scene}
            className={`${sc.scene} ${s.scene}`}
            style={{
                '--scene-h': `calc(var(--screen-h) * ${plans.desktop.total + 1})`,
                '--scene-h-phone': `calc(var(--screen-h) * ${plans.phone.total + 1})`,
            } as CSSProperties}
        >
            <div ref={path} className={sc.path} aria-hidden="true" />
            {/* Метки якорей /sites#landing|corporate|shop: начало сборки вида на пути сцены */}
            {plans.desktop.kinds.map((k, i) => (
                <div
                    key={k.kind}
                    id={k.kind}
                    className={s.anchor}
                    style={{ '--at': k.from + ANCHOR_AFTER, '--at-phone': plans.phone.kinds[i].from + ANCHOR_AFTER } as CSSProperties}
                />
            ))}
            <div ref={screen} className={sc.screen}>
                <div ref={stage} className={s.stage}>
                    <motion.div
                        ref={intro}
                        className={`${s.intro} ${atRest ? '' : s.introGone}`}
                        style={{ opacity: headOpacity, y: headY }}
                    >
                        {head}
                    </motion.div>

                    <BrowserWindow
                        kinds={kinds}
                        active={state.kind}
                        layers={KINDS}
                        p={{ landing: pLanding, corporate: pCorporate, shop: pShop }}
                        opacity={{ landing: oLanding, corporate: oCorporate, shop: oShop }}
                        pills={pillsOf}
                        terms={termsOf}
                        onTab={onTab}
                        style={{ y: winY, scale: winScale, opacity: frameOn, pointerEvents: handedOff }}
                        contentOpacity={contentOn}
                        windowRef={(el) => { win.current = el }}
                    />

                    {/* Под окном – одна строка: текущая группа состава, опции тихой строкой или цена */}
                    <motion.div className={s.under} style={{ opacity: contentOn, pointerEvents: handedOff }}>
                        {kinds.map((item) => {
                            const { service } = item;
                            const text = kindText(item);
                            return [
                                ...text.groups.map((group, i) => (
                                    <div key={`${service.id}-g${i}`} className={`${s.cell} ${s.step} ${on(service.id, 'build', i) ? s.on : ''}`}>
                                        {group.label && <p className={`${ralewayBold.className} ${s.groupLabel}`}>{group.label}</p>}
                                        {group.items.map((line) => <p key={line} className={s.line}>{line}</p>)}
                                    </div>
                                )),
                                <div key={`${service.id}-o`} className={`${s.cell} ${s.step} ${on(service.id, 'options') ? s.on : ''}`}>
                                    <p className={`${ralewayBold.className} ${s.optionsLabel}`}>{columns.options}</p>
                                    <p className={s.quiet}>{text.quiet}</p>
                                </div>,
                                <section
                                    key={`${service.id}-p`}
                                    className={`${s.cell} ${on(service.id, 'price') ? s.on : ''}`}
                                    aria-labelledby={`${service.id}-title`}
                                >
                                    <Price item={item} hidden={!on(service.id, 'price')} />
                                </section>,
                            ];
                        })}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default WindowScene;
