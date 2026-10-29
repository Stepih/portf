"use client";

import { CSSProperties, FC, useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, MotionValue, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import o from './OrbScene.module.scss'
import p from './Pipeline.module.scss'
import s from './ChatWorkScene.module.scss'
import OrbStar from "@/app/(home)/components/chat/OrbStar";
import { useChatDialog } from "@/app/(home)/components/chat/ChatProvider";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { ralewayBold } from "@/app/fonts/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { IServiceTier } from "@/interfaces/offer";
import { isTouchDevice } from "@/scripts/typeDevice";
import InlineChat from "../InlineChat";
import Rise from "../Rise";
import TierCard from "../TierCard";
import Pipeline, { Bar, FLY, flyFrom, IGeom, KINDS, Kind, Label, noGeom, PipelineStage, TOKENS } from "./Pipeline";
import TierSplit from "./TierSplit";
import { deckTook } from "./handoff";
import { ease, easeOut, lerp, offsetIn, span, useStickyScene } from "../scene";
import { ph, pipelineDemo, pipelineNote, pipelineStages, sections, tierText, tierTextC2 } from "@/data/aiPage";

// Путь сцены в экранах. Одна сцена от первого экрана до ступеней цены, герой – один шар. Порядок (владелец):
// сначала видно, что агент умеет, потом живой пример, потом цена. Шар едет в центр сцены «агент за работой» (4 примера) →
// раздувается в живой чат → плашка чата становится первой ступенью, свет шара шапки улетает в угол и становится шаром чата →
// вторая ступень ложится поверх первой. Серой плашки под сценой нет (владелец)
const T = {
    // Первый экран → шар в центр сцены
    introOut: [.05, .4],
    ctaOut: [.02, .2],
    toWork: [.1, .6],
    pipeIn: [.45, .75],
    // Четыре примера по полэкрана
    stagesFrom: .75,
    stage: .5,
    // Последний отчёт ушёл – шар раздувается в чат (как вариант A)
    pipeOut: [2.75, 2.95],
    toChat: [2.8, 3.35],
    glassOut: [3, 3.3],
    starOut: [2.85, 3.05],
    lightIn: [2.9, 3.35],
    handIn: [3.32, 3.4],
    chatIn: [3.2, 3.75],
    caption: [3.45, 3.65],
    // Чат открыт: принимает фокус и клики; держится больше экрана прокрутки
    open: [3.6, 4.75],
    // Плашка чата → первая ступень, свет шара шапки → шар в углу
    chatOut: [4.75, 4.9],
    handOut: [4.75, 4.82],
    morph: [4.8, 5.2],
    fly: [4.82, 5.25],
    starIn: [4.9, 5.1],
    flyFade: [5.25, 5.32],
    leftIn: [5.1, 5.4],
    card1: [5.2, 5.6],
    // Вторая ступень ложится поверх первой
    card2: [5.75, 6.25],
    card2Text: [6, 6.4],
    // Стык со сценой агентов (AgentDeck): первая ступень и колонка слева гаснут, у второй тает текст, а под ней уже лежит
    // такая же пустая карточка AgentDeck (её сцена начинается с handoff[0]). Текст растаял – AgentDeck забирает карточку
    // (deckTook) и ведёт её дальше, а экран этой сцены пропускает клики к полоскам слайдов под ним.
    // На телефоне и низком экране – как раньше, без стыка
    handoff: [6.55, 6.8],
};
// PATH − handoff[0] – то же, что OVER в AgentDeck
const PATH = 6.85;
// Клик по шару в покое – сразу к открытому чату
const CHAT_AT = 3.95;

// Доли пути
const f = (v: number) => v / PATH;
const k = (v: number, [a, b]: number[]) => span(v, f(a), f(b) - f(a));
const stageOf = (v: number, i: number) => span(v, f(T.stagesFrom + i * T.stage), f(T.stage));

interface IBox { x: number, y: number, w: number, h: number }
const noBox: IBox = { x: 0, y: 0, w: 0, h: 0 };
const center = (b: IBox) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const mix = (a: IBox, b: IBox, t: number): IBox => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

interface IGeo {
    slot: IBox,
    panel: IBox,
    head: IBox,
    work: IBox,
    card: IBox,
    fab: IBox,
    screen: IBox,
    inset: { x: number, y: number }
}
const noGeo: IGeo = { slot: noBox, panel: noBox, head: noBox, work: noBox, card: noBox, fab: noBox, screen: noBox, inset: { x: 0, y: 0 } };

// Где шар (его стекло) на пути: место в покое → центр сцены → плашка чата → первая ступень (там его сменяет карточка)
const shellAt = (v: number, g: IGeo): { box: IBox, round: number } => {
    if (v < f(T.toChat[0])) return { box: mix(g.slot, g.work, ease(k(v, T.toWork))), round: 0 };
    if (v < f(T.morph[0])) {
        const t = ease(k(v, T.toChat));
        return { box: mix(g.work, g.panel, t), round: t };
    }
    return { box: mix(g.panel, g.card, ease(k(v, T.morph))), round: 1 };
};

// Шар вздрагивает на каждой влетевшей капле
const pulseAt = (v: number) => {
    const i = Math.min(KINDS.length - 1, Math.floor((v - f(T.stagesFrom)) / f(T.stage)));
    if (i < 0 || v >= f(T.toChat[0])) return 1;
    const u = stageOf(v, i);
    let bump = 0;
    for (let j = 0; j < TOKENS; j++) {
        const x = (u - flyFrom(j) - FLY) / .06;
        if (x >= 0 && x <= 1) bump = Math.max(bump, Math.sin(Math.PI * x));
    }
    return 1 + .08 * bump;
};

// Где свет шара: в центре стекла, в чате – в шаре шапки, после чата – летит в угол
const lightAt = (v: number, g: IGeo): IBox => {
    if (v < f(T.toChat[0])) return shellAt(v, g).box;
    if (v < f(T.chatOut[0])) return mix(g.work, g.head, ease(k(v, T.lightIn)));
    return mix(g.head, g.fab, ease(k(v, T.fly)));
};

// Пример сцены: своя доля пути из общего прогресса
// Отчёт уходит и у последнего примера: дальше шар раздувается в чат
const CStage: FC<{ e: MotionValue<number>, i: number, kind: Kind, geoms: IGeom[], vertical: boolean, tokenRefs?: (j: number) => (el: HTMLDivElement | null) => void }> = ({ e, i, ...rest }) => {
    const u = useTransform(e, (v) => stageOf(v, i));
    return <PipelineStage u={u} last={false} {...rest} />;
};
const CLabel: FC<{ e: MotionValue<number>, i: number }> = ({ e, i }) => {
    const u = useTransform(e, (v) => stageOf(v, i));
    return <Label u={u} last={i === KINDS.length - 1}>{pipelineStages[i]}</Label>;
};
const CBar: FC<{ e: MotionValue<number>, i: number }> = ({ e, i }) => {
    const u = useTransform(e, (v) => stageOf(v, i));
    return <Bar u={u} />;
};

interface IChatWorkScene {
    tiers: IServiceTier[],
    note: string
}

// Вариант C (SERVICES_PLAN У4, черновик): первый экран и чат – из A, «агент за работой» – из B, ступени – колонка слева,
// карточки справа сменяют друг друга стопкой. Порядок: что умеет → живой пример → цена. Всё – одна липкая сцена: каждый кадр вырастает из предыдущего,
// а последний (ступени) уезжает вверх как обычный блок, без прыжка
const ChatWorkScene: FC<IChatWorkScene> = ({ tiers, note }) => {
    const reduceMotion = usePrefersReducedMotion();
    const vertical = useMediaQuery('(max-width: 700px)');
    const { setInlineShown } = useChatDialog();

    const scene = useRef<HTMLElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const slot = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const headOrb = useRef<HTMLSpanElement>(null);
    const area = useRef<HTMLDivElement>(null);
    const workOrb = useRef<HTMLDivElement>(null);
    const card = useRef<HTMLDivElement>(null);
    const tokens = useRef<(HTMLDivElement | null)[]>([]);

    const [g, setG] = useState<IGeo>(noGeo);
    const [geoms, setGeoms] = useState<IGeom[]>([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [atRest, setAtRest] = useState(true);
    const [tiersLive, setTiersLive] = useState(false);
    // Стык пройден: всё на экране погасло, клики идут к AgentDeck под ним
    const [handedOff, setHandedOff] = useState(false);
    // Стык с AgentDeck – только там, где она липкая сцена (те же условия, что в AgentDeck)
    const handoff = useMediaQuery('(min-width: 701px) and (min-height: 600px)');

    const onMeasure = useCallback(() => {
        const root = stage.current;
        const els = [slot.current, panel.current, headOrb.current, area.current, workOrb.current, card.current];
        if (!root || els.some((el) => !el)) return;
        const box = (el: HTMLElement): IBox => {
            const at = offsetIn(el, root);
            return { x: at.x, y: at.y, w: el.offsetWidth, h: el.offsetHeight };
        };
        const W = root.offsetWidth;
        const H = root.offsetHeight;
        // Шар в углу (Chat.module.scss, .fab): 60px в 24px от краёв, на телефоне 54px в 16px
        const phone = W <= 600;
        const fs = phone ? 54 : 60;
        const fm = phone ? 16 : 24;
        setG({
            slot: box(slot.current!),
            panel: box(panel.current!),
            head: box(headOrb.current!),
            work: box(workOrb.current!),
            card: box(card.current!),
            fab: { x: W - fm - fs, y: H - fm - fs, w: fs, h: fs },
            screen: { x: 0, y: 0, w: W, h: H },
            inset: { x: Math.max(16, (W - 1260) / 2), y: Math.max(12, H * .04) },
        });
        // Входы относительно шара сцены
        const a = area.current!;
        const wo = offsetIn(workOrb.current!, a);
        const ox = wo.x + workOrb.current!.offsetWidth / 2;
        const oy = wo.y + workOrb.current!.offsetHeight / 2;
        setGeoms(tokens.current.map((el) => {
            if (!el) return noGeom;
            const t = offsetIn(el, a);
            return { dx: ox - (t.x + el.offsetWidth / 2), dy: oy - (t.y + el.offsetHeight / 2), w: el.offsetWidth, h: el.offsetHeight };
        }));
    }, []);

    const { progress, scrollToProgress } = useStickyScene({ scene, path, screen }, onMeasure);

    // Тач-экран: пока фокус в чате (клавиатура двигает страницу), сцена держится на открытом чате.
    // Фокус ушёл – плавно возвращается к скроллу. На компьютере не нужно: клавиатура страницу не двигает
    const freeze = useMotionValue(0);
    const e = useTransform([progress, freeze], ([v, z]: number[]) => {
        const held = Math.min(Math.max(v, f(T.open[0]) + .002), f(T.open[1]) - .002);
        return v + (held - v) * z;
    });
    const onInteract = () => {
        if (isTouchDevice()) animate(freeze, 1, { duration: .3 });
    };
    const onLeave = () => {
        if (freeze.get() > 0) animate(freeze, 0, { duration: .6 });
    };

    // Шар в углу прячется, пока на экране большой шар; когда большой долетает до угла – передаёт ему место
    const fabHidden = useRef(false);
    const syncFab = useCallback((v: number) => {
        const hide = v < f(T.flyFade[0]);
        if (hide === fabHidden.current) return;
        fabHidden.current = hide;
        setInlineShown(hide);
    }, [setInlineShown]);
    useEffect(() => {
        if (reduceMotion) return;
        syncFab(e.get());
        return () => {
            fabHidden.current = false;
            setInlineShown(false);
        };
    }, [reduceMotion, e, syncFab, setInlineShown]);

    useMotionValueEvent(e, 'change', (v) => {
        syncFab(v);
        setChatOpen(v >= f(T.open[0]) && v <= f(T.open[1]));
        setAtRest(v < .002);
        setTiersLive(v >= f(T.morph[1]));
        setHandedOff(handoff && v >= f(T.handoff[1]));
    });

    // ---------- Первый экран ----------
    const introOpacity = useTransform(e, (v) => 1 - easeOut(k(v, T.introOut)));
    const introY = useTransform(e, (v) => -70 * ease(k(v, T.introOut)));
    const ctaOpacity = useTransform(e, (v) => 1 - k(v, T.ctaOut));

    // ---------- Шар: стекло (оболочка) ----------
    const shell = useTransform(e, (v) => shellAt(v, g));
    const shellTop = useTransform(shell, ({ box }) => box.y);
    const shellLeft = useTransform(shell, ({ box }) => box.x);
    const shellW = useTransform(shell, ({ box }) => box.w);
    const shellH = useTransform(shell, ({ box }) => box.h);
    const shellRadius = useTransform(shell, ({ box, round }) => lerp(box.w / 2, 13, round));
    const glass = useTransform(e, (v) => 1 - k(v, T.glassOut));
    // Долетела до места первой ступени – её сменяет настоящая карточка
    const shellOpacity = useTransform(e, (v) => v >= f(T.morph[1]) ? 0 : 1);
    // Шар вздрагивает на каждой влетевшей капле
    const pulse = useTransform(e, pulseAt);

    // ---------- Свет и звезда шара ----------
    const lightBox = useTransform(e, (v) => lightAt(v, g));
    const lightX = useTransform(lightBox, (b) => center(b).x - g.slot.w / 2);
    const lightY = useTransform(lightBox, (b) => center(b).y - g.slot.w / 2);
    const lightScale = useTransform(e, (v) => g.slot.w ? lightAt(v, g).w / g.slot.w * pulseAt(v) : 1);
    const lightOpacity = useTransform(e, (v) => (v < f(T.chatOut[0]) ? 1 - k(v, T.handIn) : k(v, T.handOut)) * (1 - k(v, T.flyFade)));
    const starOpacity = useTransform(e, (v) => v < f(T.chatOut[0]) ? 1 - k(v, T.starOut) : k(v, T.starIn));
    const starRotate = useTransform(e, (v) => 360 * span(v, f(T.stagesFrom), f(T.toChat[0] - T.stagesFrom)));
    const headOrbOpacity = useTransform(e, (v) => v < f(T.chatOut[0]) ? k(v, T.handIn) : 1 - k(v, T.handOut));

    // ---------- Чат ----------
    const clipPath = useTransform(shell, ({ box, round }) => {
        const pb = g.panel;
        const top = Math.max(0, box.y - pb.y);
        const left = Math.max(0, box.x - pb.x);
        const right = Math.max(0, pb.x + pb.w - box.x - box.w);
        const bottom = Math.max(0, pb.y + pb.h - box.y - box.h);
        return `inset(${top}px ${right}px ${bottom}px ${left}px round ${lerp(box.w / 2, 13, round)}px)`;
    });
    const chatIntro = useTransform(e, (v) => k(v, T.chatIn));
    const chatOpacity = useTransform(e, (v) => 1 - k(v, T.chatOut));
    const captionOpacity = useTransform(e, (v) => easeOut(k(v, T.caption)) * (1 - k(v, T.chatOut)));
    const captionY = useTransform(e, (v) => 12 * (1 - easeOut(k(v, T.caption))) - 12 * k(v, T.chatOut));

    // ---------- Агент за работой ----------
    const pipeOpacity = useTransform(e, (v) => easeOut(k(v, T.pipeIn)) * (1 - k(v, T.pipeOut)));
    const pipeY = useTransform(e, (v) => 24 * (1 - easeOut(k(v, T.pipeIn))) - 40 * ease(k(v, T.pipeOut)));

    // ---------- Чат → ступени ----------
    // Стык: всё, кроме пустой второй карточки, гаснет; саму карточку дальше рисует AgentDeck (deckTook)
    const handoffOut = useTransform(e, (v) => handoff ? 1 - ease(k(v, T.handoff)) : 1);
    const card1Opacity = useTransform([e, handoffOut], ([v, h]: number[]) => (v >= f(T.morph[1]) ? 1 : 0) * h);
    const card2Shown = useTransform(deckTook, (took) => handoff && took ? 0 : 1);

    const left = useTransform(e, (v) => k(v, T.leftIn));
    const c1 = useTransform(e, (v) => k(v, T.card1));
    const c2 = useTransform(e, (v) => k(v, T.card2Text));
    const arrive = useTransform(e, (v) => easeOut(k(v, T.card2)));
    const card2Y = useTransform(arrive, (a) => (g.screen.h - g.card.y) * (1 - a));
    const card1Scale = useTransform(arrive, (a) => 1 - .06 * a);
    // На телефоне сдвиг меньше: выше карточек – черты ступеней
    const card1Y = useTransform(arrive, (a) => (vertical ? -12 : -28) * a);
    const card1Dim = useTransform(arrive, (a) => 1 - .65 * a);
    const bar1 = useTransform(e, (v) => k(v, T.card1));
    const bar2 = useTransform(e, (v) => k(v, T.card2));

    const heading = (
        <>
            <p className={o.crumbs}>{ph.crumbs}</p>
            <h1 id="ai-title" className={`${ralewayBold.className} ${o.title}`}>{ph.title}</h1>
            <p className={o.lead}>{ph.lead}</p>
        </>
    );

    // «Уменьшить движение» – тот же порядок без движения: заголовок, примеры списком (B), чат в потоке, ступени
    if (reduceMotion) {
        return (
            <>
                <section className={o.static} aria-labelledby="ai-title">
                    <div className={o.staticHead}>
                        {heading}
                        <ContactLink className={`${ralewayBold.className} ${o.cta}`}>{ph.cta}</ContactLink>
                    </div>
                </section>
                <Pipeline />
                <div className={o.static}>
                    <p className={o.caption}>{ph.chatCaptionC}</p>
                    <div className={o.staticPanel}><InlineChat /></div>
                </div>
                <TierSplit tiers={tiers} note={note} />
            </>
        );
    }

    const tierCard = (i: number, progress: MotionValue<number>) => tiers[i] && (
        <TierCard
            tier={tiers[i]}
            text={i === 1 ? tierTextC2 : tierText[i]?.text ?? ''}
            examples={tierText[i]?.examples ?? []}
            progress={progress}
            textFrom={0}
            reveal
        />
    );

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${o.scene} ${s.scene}`}
            style={{ '--scene-h': `calc(var(--screen-h) + ${PATH * 100}vh)` } as CSSProperties}
            aria-labelledby="ai-title"
        >
            <div ref={screen} className={`${sc.screen} ${handedOff ? s.passed : ''}`}>
                <div ref={stage} className={o.stage}>
                    {/* Первый экран – как в варианте A */}
                    <div className={o.introLayer}>
                        <motion.div className={o.intro} style={{ opacity: introOpacity, y: introY }}>
                            {heading}
                        </motion.div>
                        <div ref={slot} className={o.slot}>
                            {atRest && (
                                <button type="button" className={o.orbButton} onClick={() => scrollToProgress(f(CHAT_AT))} aria-label={ph.orbLabel} />
                            )}
                        </div>
                        <motion.div className={o.ctaRow} style={{ opacity: ctaOpacity }}>
                            <ContactLink className={`${ralewayBold.className} ${o.cta}`} tabIndex={atRest ? undefined : -1}>{ph.cta}</ContactLink>
                            <p className={o.hint}>{ph.orbHintC}</p>
                        </motion.div>
                    </div>

                    {/* Агент за работой – как в варианте B, только шар – общий (оболочка ниже) */}
                    <div className={`${p.content} ${p.frost} ${s.pipe}`}>
                        <motion.div className={p.top} style={{ opacity: pipeOpacity, y: pipeY }}>
                            <h2 className={`${ralewayBold.className} ${p.title}`}>{sections.pipeline.title}</h2>
                            <p className={p.description}>{sections.pipeline.text}</p>
                            <div className={p.indicators}>
                                {KINDS.map((kind, i) => <CBar key={kind} e={e} i={i} />)}
                            </div>
                            <div className={p.labels}>
                                {KINDS.map((kind, i) => <CLabel key={kind} e={e} i={i} />)}
                            </div>
                        </motion.div>

                        <div ref={area} className={p.area}>
                            {KINDS.map((kind, i) => (
                                <CStage
                                    key={kind}
                                    e={e}
                                    i={i}
                                    kind={kind}
                                    geoms={geoms}
                                    vertical={vertical}
                                    tokenRefs={i === 0 ? (j) => (el) => { tokens.current[j] = el } : undefined}
                                />
                            ))}
                            {/* Место шара сцены: сам шар – оболочка, сюда она садится */}
                            <div ref={workOrb} className={`${p.orb} ${s.ghost}`} aria-hidden="true" />
                        </div>

                        <motion.p className={p.note} style={{ opacity: pipeOpacity }}>{pipelineNote} · {pipelineDemo}</motion.p>
                    </div>

                    {/* Ступени: слева заголовок и уточнение, справа карточки стопкой */}
                    <div className={`${s.tiers} ${tiersLive ? s.live : ''}`}>
                        <motion.div className={s.side} style={{ opacity: handoffOut }}>
                            <h2 className={`${ralewayBold.className} ${s.sideTitle}`}>
                                <Rise progress={left} from={0} dur={.5}>{sections.tiers.title}</Rise>
                            </h2>
                            <Rise progress={left} from={.15} dur={.5} tag="div">
                                <p className={s.sideText}>{sections.tiers.text}</p>
                            </Rise>
                            <Rise progress={left} from={.3} dur={.5} tag="div">
                                <p className={s.sideNote}>{note}</p>
                            </Rise>
                            <motion.div className={p.indicators} style={{ opacity: left }}>
                                <Bar u={bar1} />
                                <Bar u={bar2} />
                            </motion.div>
                        </motion.div>
                        <div className={s.stack}>
                            <motion.div ref={card} className={s.card} style={{ opacity: card1Opacity, scale: card1Scale, y: card1Y }}>
                                <motion.div className={s.cardBody} style={{ opacity: card1Dim }}>{tierCard(0, c1)}</motion.div>
                            </motion.div>
                            {/* data-deck-from: AgentDeck меряет эту карточку и в стыке рисует такую же на её месте */}
                            <motion.div className={s.card} style={{ y: card2Y, opacity: card2Shown }} data-deck-from="">
                                <motion.div className={s.cardBody} style={{ opacity: handoffOut }}>{tierCard(1, c2)}</motion.div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Стекло шара: в покое – шар, в центре сцены – шар агента, потом плашка чата, в конце – первая ступень */}
                    <motion.div
                        className={`${o.shell} ${s.shell} ${atRest ? o.breathe : ''}`}
                        style={{ top: shellTop, left: shellLeft, width: shellW, height: shellH, borderRadius: shellRadius, scale: pulse, opacity: shellOpacity }}
                        aria-hidden="true"
                    >
                        <motion.span className={o.glass} style={{ opacity: glass }} />
                    </motion.div>

                    <motion.div
                        className={`${s.lightBox} ${atRest ? o.breathe : ''}`}
                        style={{ width: g.slot.w, height: g.slot.w, x: lightX, y: lightY, scale: lightScale, opacity: lightOpacity }}
                        aria-hidden="true"
                    >
                        <span className={o.light} />
                        <motion.span className={o.star} style={{ opacity: starOpacity, rotate: starRotate }}>
                            <OrbStar className={o.starIcon} />
                        </motion.span>
                    </motion.div>

                    <div className={`${o.chatLayer} ${s.chatLayer}`}>
                        <motion.p className={o.caption} style={{ opacity: captionOpacity, y: captionY }}>{ph.chatCaptionC}</motion.p>
                        <motion.div ref={panel} className={o.panel} style={{ clipPath, opacity: chatOpacity }}>
                            <InlineChat
                                bare
                                intro={chatIntro}
                                orbRef={headOrb}
                                orbOpacity={headOrbOpacity}
                                inert={!chatOpen}
                                onInteract={onInteract}
                                onLeave={onLeave}
                                manageFab={false}
                            />
                        </motion.div>
                    </div>
                </div>
            </div>

            <div ref={path} className={sc.path} aria-hidden="true" />
        </section>
    );
};

export default ChatWorkScene;

