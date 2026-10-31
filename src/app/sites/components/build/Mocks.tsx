"use client";

import { CSSProperties, FC, ReactNode } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import TgIcon from '@/assets/_img/icons/tg-white.svg'

import s from './Mocks.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { buildUi } from "@/data/sitesPage";
import { ease, lerp, move, rise, span } from "@/app/ai/components/scene";

// Нарисованные сайты в окне сцены (У5а): блоки-заготовки тонами чернил, без цвета и без чужих скриншотов.
// Всё движется от прогресса сцены p (0–1): шаг i начинается в stepAt(i, n), появление – окно STEP. Первый шаг
// уже собран, когда сцена встаёт: окно не пустое. Последний с доводкой (заявка, панель) заканчивается к ~0,8 –
// дальше пауза чтения.
// Сдвиги не больше 40px за окно в 0,1 сцены (~0,25 экрана) – далеко ниже предела скорости 2 px/px (speed.ts)
export const STEP = .1;
export const stepAt = (i: number, n: number) => -STEP + i * .8 / n;

interface IAppear {
    p: MotionValue<number>,
    at: number,
    // До какого момента виден (смена страниц сайта компании)
    until?: number,
    y?: number,
    x?: number,
    className?: string,
    style?: CSSProperties,
    children?: ReactNode
}

// Блок проявляется и встаёт на место снизу (или сбоку)
export const Appear: FC<IAppear> = ({ p, at, until, y = 18, x = 0, className, style, children }) => {
    const k = useTransform(p, (v) => {
        const inK = rise(span(v, at, STEP));
        const outK = until === undefined ? 0 : ease(span(v, until, STEP * .6));
        return inK * (1 - outK);
    });
    const ty = useTransform(k, (v) => lerp(y, 0, v));
    const tx = useTransform(k, (v) => lerp(x, 0, v));
    return <motion.div className={className} style={{ ...style, opacity: k, y: ty, x: tx }}>{children}</motion.div>;
};

// Строка текста «пишется»: полоска растёт слева направо
const Line: FC<{ p: MotionValue<number>, at: number, w: string, strong?: boolean }> = ({ p, at, w, strong }) => {
    const scaleX = useTransform(p, (v) => ease(span(v, at, STEP)));
    return <motion.i className={`${s.line} ${strong ? s.strong : ''}`} style={{ width: w, scaleX }} />;
};

interface IMock {
    p: MotionValue<number>
}

// Лендинг: первый экран → блоки → тексты в блоках → форма и заявка в Telegram
export const LandingMock: FC<IMock> = ({ p }) => {
    const n = 4;
    const t = (i: number) => stepAt(i, n);
    return (
        <div className={s.page}>
            <Appear p={p} at={t(0)} className={`${s.block} ${s.hero}`}>
                <Line p={p} at={t(2)} w="58%" strong />
                <Line p={p} at={t(2) + .02} w="40%" />
                <span className={s.heroButton} />
            </Appear>
            <div className={s.row3}>
                {[0, 1, 2].map((i) => (
                    <Appear key={i} p={p} at={t(1) + i * .025} className={s.block}>
                        <span className={s.icon} />
                        <Line p={p} at={t(2) + .03 + i * .015} w="70%" strong />
                        <Line p={p} at={t(2) + .04 + i * .015} w="88%" />
                        <Line p={p} at={t(2) + .05 + i * .015} w="60%" />
                    </Appear>
                ))}
            </div>
            <Appear p={p} at={t(1) + .08} className={`${s.block} ${s.wide}`}>
                <Line p={p} at={t(2) + .06} w="36%" strong />
                <Line p={p} at={t(2) + .07} w="74%" />
            </Appear>
            <Appear p={p} at={t(3)} className={`${s.block} ${s.form}`}>
                <span className={s.field} />
                <span className={s.field} />
                <span className={s.formButton} />
            </Appear>
        </div>
    );
};

// Заявка вылетает из формы в Telegram – плашка у правого края окна
export const LeadToast: FC<IMock> = ({ p }) => (
    <Appear p={p} at={stepAt(3, 4) + .07} x={-28} y={0} className={`${s.toast} ${ralewayBold.className}`}>
        <span className={s.tg}><TgIcon aria-hidden="true" /></span>
        {buildUi.lead}
    </Appear>
);

// Страница сайта компании: у каждой своя раскладка
const CorpPage: FC<{ p: MotionValue<number>, i: number, at: number, until?: number }> = ({ p, i, at, until }) => (
    <Appear p={p} at={at} until={until} y={10} className={s.layer}>
        {i === 0 && (
            <>
                <div className={`${s.block} ${s.hero} ${s.heroShort}`}><i className={`${s.line} ${s.strong} ${s.on}`} style={{ width: '52%' }} /><span className={s.heroButton} /></div>
                <div className={s.row3}>{[0, 1, 2].map((k) => <div key={k} className={s.block}><span className={s.icon} /><i className={`${s.line} ${s.on}`} style={{ width: '80%' }} /></div>)}</div>
            </>
        )}
        {i === 1 && [0, 1, 2, 3].map((k) => (
            <div key={k} className={`${s.block} ${s.listRow}`}>
                <span className={s.thumb} />
                <div className={s.stack}><i className={`${s.line} ${s.strong} ${s.on}`} style={{ width: '40%' }} /><i className={`${s.line} ${s.on}`} style={{ width: '76%' }} /></div>
            </div>
        ))}
        {i === 2 && (
            <div className={s.about}>
                <span className={`${s.block} ${s.photo}`} />
                <div className={s.stack}>
                    <i className={`${s.line} ${s.strong} ${s.on}`} style={{ width: '60%' }} />
                    {[92, 84, 88, 70, 80].map((w) => <i key={w} className={`${s.line} ${s.on}`} style={{ width: `${w}%` }} />)}
                </div>
            </div>
        )}
        {i === 3 && (
            <div className={s.about}>
                <div className={`${s.block} ${s.form} ${s.formTall}`}><span className={s.field} /><span className={s.field} /><span className={s.field} /><span className={s.formButton} /></div>
                <span className={`${s.block} ${s.map}`}>
                    <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                        <path className={s.road} d="M-10 120 C50 100 90 60 210 40" />
                        <path className={s.street} d="M60 -10 L90 170 M140 -10 L120 170 M-10 60 L210 90" />
                        <path className={s.pin} d="M104 44a14 14 0 0 1 14 14c0 11-14 26-14 26s-14-15-14-26a14 14 0 0 1 14-14z" />
                        <circle className={s.pinDot} cx="104" cy="58" r="5" />
                    </svg>
                </span>
            </div>
        )}
    </Appear>
);

// Сайт компании: 4 страницы листаются по вкладкам, служебные – пунктиром, панель выезжает из-за окна
export const CorporateMock: FC<IMock> = ({ p }) => {
    const t0 = stepAt(0, 3);
    const t1 = stepAt(1, 3);
    // Страницы сменяют друг друга внутри первого шага и немного второго
    const pageAt = (i: number) => t0 + i * (t1 + STEP - t0) / 4;
    return (
        <div className={`${s.page} ${s.pages}`}>
            {[0, 1, 2, 3].map((i) => (
                <CorpPage key={i} p={p} i={i} at={pageAt(i)} until={i < 3 ? pageAt(i + 1) : undefined} />
            ))}
        </div>
    );
};

// Вкладки страниц в строке адреса: четыре настоящих и три служебных пунктиром
export const CorporateTabs: FC<IMock> = ({ p }) => {
    const t0 = stepAt(0, 3);
    const t1 = stepAt(1, 3);
    const pageAt = (i: number) => t0 + i * (t1 + STEP - t0) / 4;
    return (
        <div className={s.tabs}>
            {buildUi.pages.map((page, i) => (
                <Tab key={page} p={p} at={pageAt(i)} until={i < 3 ? pageAt(i + 1) : undefined} label={page} />
            ))}
            {[0, 1, 2].map((i) => (
                <Appear key={i} p={p} at={t1 + .04 + i * .025} y={8} className={`${s.tab} ${s.ghost}`} />
            ))}
        </div>
    );
};

// Вкладка проявляется, пока её страница на экране – залита
const Tab: FC<{ p: MotionValue<number>, at: number, until?: number, label: string }> = ({ p, at, until, label }) => {
    const shown = useTransform(p, (v) => rise(span(v, at - .04, STEP * .6)));
    const active = useTransform(p, (v) => v >= at && (until === undefined || v < until) ? 1 : 0);
    const y = useTransform(shown, (v) => lerp(8, 0, v));
    // Подпись залитой вкладки – цветом фона (переменная темы, без перехода цвета)
    const color = useTransform(active, (v) => v ? 'var(--color-bg)' : 'var(--color-text-100)');
    return (
        <motion.span className={s.tab} style={{ opacity: shown, y }}>
            <motion.span className={s.tabFill} style={{ opacity: active }} />
            <motion.span className={s.tabLabel} style={{ color }}>{label}</motion.span>
        </motion.span>
    );
};

// Панель управления: поле «Цена» заполняется, «Сохранить» нажимается. lines – строки списка (заказы магазина)
export const PanelMock: FC<IMock & { at: number, orders?: boolean }> = ({ p, at, orders }) => {
    const typed = useTransform(p, (v) => ease(span(v, at + STEP, STEP)));
    const press = useTransform(p, (v) => 1 - .06 * Math.sin(Math.PI * span(v, at + STEP * 2, STEP * .5)));
    return (
        <Appear p={p} at={at} x={40} y={0} className={s.panel}>
            <p className={`${ralewayBold.className} ${s.panelTitle}`}>{buildUi.panel}</p>
            {orders ? (
                [0, 1, 2].map((k) => (
                    <div key={k} className={s.order}>
                        <i className={`${s.line} ${s.on}`} style={{ width: '46%' }} />
                        <motion.span className={s.status} style={{ opacity: k === 0 ? typed : 1 }} />
                    </div>
                ))
            ) : (
                <>
                    <span className={s.panelLabel}>{buildUi.price}</span>
                    <span className={s.input}><motion.i className={s.typed} style={{ scaleX: typed }} /></span>
                </>
            )}
            <motion.span className={`${ralewayBold.className} ${s.save}`} style={{ scale: press }}>{buildUi.save}</motion.span>
        </Appear>
    );
};

// Магазин: каталог → фильтры и поиск → карточка в корзину и оформление → оплата и чек
export const ShopMock: FC<IMock> = ({ p }) => {
    const n = 5;
    const t = (i: number) => stepAt(i, n);
    const pick = useTransform(p, (v) => 1 + .06 * rise(span(v, t(2), STEP)));
    const dim = useTransform(p, (v) => 1 - .55 * rise(span(v, t(2) + .03, STEP)));
    // Самые длинные проезды сцены (каталог ~210px, оформление до ~340px) – кривой move с ограниченным наклоном
    // и окном в 1,3 шага: пик не выше 2 px/px и на телефоне (speed.ts)
    const shift = useTransform(p, (v) => `${lerp(0, 28, move(span(v, t(1), STEP * 1.3)))}%`);
    const checkout = useTransform(p, (v) => move(span(v, t(2) + .06, STEP * 1.3)));
    const sheetX = useTransform(checkout, (v) => `${lerp(104, 0, v)}%`);
    const paid = useTransform(p, (v) => ease(span(v, t(3), STEP)));
    const unpaid = useTransform(paid, (v) => 1 - v);
    return (
        <div className={`${s.page} ${s.shop}`}>
            <Appear p={p} at={t(1)} x={-24} y={0} className={s.filters}>
                <p className={`${ralewayBold.className} ${s.filtersTitle}`}>{buildUi.filters}</p>
                {[64, 80, 52, 72].map((w, k) => (
                    <span key={w} className={s.check}><span className={`${s.box} ${k === 1 ? s.boxOn : ''}`} /><i className={`${s.line} ${s.on}`} style={{ width: `${w}%` }} /></span>
                ))}
            </Appear>
            <motion.div className={s.catalog} style={{ marginLeft: shift }}>
                <div className={s.chips}>
                    {[0, 1, 2, 3].map((k) => <Appear key={k} p={p} at={t(0) + k * .015} y={8} className={`${s.chip} ${k === 0 ? s.chipOn : ''}`} />)}
                </div>
                <div className={s.grid}>
                    {[0, 1, 2, 3, 4, 5].map((k) => (
                        <Appear key={k} p={p} at={t(0) + .02 + k * .015} className={s.cardWrap}>
                            <motion.div className={s.product} style={k === 1 ? { scale: pick } : { opacity: dim }}>
                                <span className={s.productImg} />
                                <i className={`${s.line} ${s.on}`} style={{ width: '70%' }} />
                                <i className={`${s.line} ${s.strong} ${s.on}`} style={{ width: '40%' }} />
                                {k === 1 && (
                                    <Appear p={p} at={t(2)} y={6} className={`${ralewayBold.className} ${s.toCart}`}>{buildUi.toCart}</Appear>
                                )}
                            </motion.div>
                        </Appear>
                    ))}
                </div>
            </motion.div>
            <motion.div className={s.sheet} style={{ x: sheetX }}>
                <div className={s.item}>
                    <span className={s.thumb} />
                    <div className={s.stack}><i className={`${s.line} ${s.on}`} style={{ width: '70%' }} /><i className={`${s.line} ${s.strong} ${s.on}`} style={{ width: '36%' }} /></div>
                </div>
                <span className={s.field} />
                <span className={s.field} />
                <div className={s.methods}><span className={`${s.method} ${s.methodOn}`} /><span className={s.method} /></div>
                <div className={s.pay}>
                    <motion.span className={`${ralewayBold.className} ${s.formButton} ${s.payButton}`} style={{ opacity: unpaid }}>{buildUi.checkout}</motion.span>
                    <motion.span className={`${ralewayBold.className} ${s.paid}`} style={{ opacity: paid }}>
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>
                        {buildUi.paid}
                    </motion.span>
                </div>
            </motion.div>
        </div>
    );
};

// Поиск и корзина в строке адреса магазина
export const ShopBar: FC<IMock> = ({ p }) => {
    const t = (i: number) => stepAt(i, 5);
    const count = useTransform(p, (v) => v >= t(2) + .05 ? 1 : 0);
    return (
        <div className={s.shopBar}>
            <Appear p={p} at={t(1) + .03} y={6} className={s.search}>{buildUi.search}</Appear>
            <span className={s.cart}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 3h2.5l2 10h9l1.8-7H5.4" /><circle cx="8" cy="16.5" r="1.3" /><circle cx="15" cy="16.5" r="1.3" /></svg>
                <motion.span className={`${ralewayBold.className} ${s.badge}`} style={{ scale: count, opacity: count }}>1</motion.span>
            </span>
        </div>
    );
};
