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
import { durFor, easeOut, fadeFor, lerp, move, offsetIn, span, useStickyScene } from "../scene";
import { ph, pipelineDemo, pipelineNote, pipelineStages, sections, tierText, tierTextC2 } from "@/data/aiPage";

// Путь сцены в экранах. Одна сцена от первого экрана до ступеней цены, герой – один шар. Порядок (владелец):
// сначала видно, что агент умеет, потом живой пример, потом цена. Шар едет в центр сцены «агент за работой» (4 примера) →
// раздувается в живой чат → плашка чата становится первой ступенью, свет шара шапки улетает в угол и становится шаром чата →
// вторая ступень ложится поверх первой. Серой плашки под сценой нет (владелец).
// Единая скорость (speed.ts): окна движений – от их путей (timesFor по замерам onMeasure), [от, до] в экранах.
// Стык со сценой агентов (AgentDeck, handoff): первая ступень и колонка слева гаснут, у второй тает текст, а под ней
// уже лежит такая же пустая карточка AgentDeck (её сцена начинается с handoff[0], OVER там). Текст растаял –
// AgentDeck забирает карточку (deckTook). На телефоне и низком экране – без стыка
interface ITimes {
    introOut: number[], ctaOut: number[], toWork: number[], pipeIn: number[], stagesFrom: number, stage: number,
    pipeOut: number[], toChat: number[], glassOut: number[], starOut: number[], lightIn: number[], handIn: number[],
    chatIn: number[], caption: number[], open: number[], chatOut: number[], handOut: number[], morph: number[],
    fly: number[], starIn: number[], flyFade: number[], leftIn: number[], card1: number[], card2: number[],
    card2Text: number[], handoff: number[], chatAt: number, path: number
}
// Пути для окон, px: см. onMeasure
interface IPaths { toWork: number, token: number, report: number, build: number, toChat: number, light: number, drop: number, morph: number, fly: number, rule: number, card2: number }
// Доля примера (Pipeline): вход летит FLY, отчёт раскрывается за REPORT_SHARE, деталь отчёта растёт за BUILD_SHARE
const REPORT_SHARE = .33;
const BUILD_SHARE = .3;
// Капли готовых вопросов чата летят половину его появления (InlineChat, FLIGHT)
const DROP_SHARE = .5;
// Линия ступени (TierCard): от трети карточки до конца
const RULE_SHARE = .875;
const OVER = .3;
const timesFor = (p: IPaths, h: number): ITimes => {
    const d = (px: number) => durFor(px, h);
    const fade = fadeFor(h);
    const at = (from: number, dur: number) => [from, from + dur];
    const toWork = at(.1, Math.max(.5, d(p.toWork)));
    const pipeIn = at(toWork[1] - .15, .3);
    const stagesFrom = pipeIn[1];
    // Пример – не короче полэкрана и не быстрее единой скорости для полёта входа, раскрытия отчёта и его деталей
    const stage = Math.max(.6, d(p.token) / FLY, d(p.report) / REPORT_SHARE, d(p.build) / BUILD_SHARE);
    // Отчёт последнего примера уходит за конец его доли (до 1,15)
    const stagesEnd = stagesFrom + KINDS.length * stage + .15 * stage;
    const pipeOut = at(stagesEnd, Math.max(fade, .2));
    const a = stagesEnd + .05;
    const chatLen = Math.max(.55, d(p.toChat));
    const toChat = at(a, chatLen);
    const chatIn = at(a + .4, Math.max(.55, d(p.drop) / DROP_SHARE));
    const open = at(Math.max(chatIn[1] - .15, a + chatLen), 1.15);
    const o = open[1];
    const morph = at(o + .05, Math.max(.4, d(p.morph)));
    const fly = at(o + .07, Math.max(.43, d(p.fly)));
    const card1 = at(morph[0] + .4, Math.max(.4, d(p.rule) / RULE_SHARE));
    const card2 = at(card1[1] + .15, Math.max(fade * 2, d(p.card2)));
    const card2Text = at(card2[0] + .25, Math.max(.4, d(p.rule) / RULE_SHARE));
    const handoff = at(card2Text[1] + .15, .25);
    return {
        introOut: [.05, .4], ctaOut: [.02, .2], toWork, pipeIn, stagesFrom, stage, pipeOut, toChat,
        glassOut: at(a + .2, .3), starOut: at(a + .05, .2), lightIn: at(a + .1, Math.max(chatLen - .1, d(p.light))),
        handIn: at(a + chatLen - .03, .08), chatIn, caption: at(chatIn[0] + .25, .2), open,
        chatOut: at(o, .15), handOut: at(o, .07), morph, fly, starIn: at(o + .15, .2), flyFade: at(fly[1], .07),
        leftIn: at(morph[0] + .3, .3), card1, card2, card2Text, handoff, chatAt: open[0] + .35, path: handoff[0] + OVER
    };
};
const noTimes = timesFor({ toWork: 300, token: 300, report: 380, build: 340, toChat: 500, light: 500, drop: 500, morph: 400, fly: 700, rule: 450, card2: 500 }, 900);

// Доли пути
const f = (t: ITimes, v: number) => v / t.path;
const k = (t: ITimes, v: number, [a, b]: number[]) => span(v, f(t, a), f(t, b) - f(t, a));
const stageOf = (t: ITimes, v: number, i: number) => span(v, f(t, t.stagesFrom + i * t.stage), f(t, t.stage));
// Без ограничения 0–1: отчёт примера уходит уже в начале следующего (Pipeline, REPORT_OUT)
const stageRaw = (t: ITimes, v: number, i: number) => (v - f(t, t.stagesFrom + i * t.stage)) / f(t, t.stage);

interface IBox { x: number, y: number, w: number, h: number }
const noBox: IBox = { x: 0, y: 0, w: 0, h: 0 };
const center = (b: IBox) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const mix = (a: IBox, b: IBox, t: number): IBox => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

interface IGeo {
    t: ITimes,
    slot: IBox,
    panel: IBox,
    head: IBox,
    work: IBox,
    card: IBox,
    fab: IBox,
    screen: IBox,
    inset: { x: number, y: number }
}
const noGeo: IGeo = { t: noTimes, slot: noBox, panel: noBox, head: noBox, work: noBox, card: noBox, fab: noBox, screen: noBox, inset: { x: 0, y: 0 } };

// Где шар (его стекло) на пути: место в покое → центр сцены → плашка чата → первая ступень (там его сменяет карточка)
const shellAt = (v: number, g: IGeo): { box: IBox, round: number } => {
    const t = g.t;
    if (v < f(t, t.toChat[0])) return { box: mix(g.slot, g.work, move(k(t, v, t.toWork))), round: 0 };
    if (v < f(t, t.morph[0])) {
        const m = move(k(t, v, t.toChat));
        return { box: mix(g.work, g.panel, m), round: m };
    }
    return { box: mix(g.panel, g.card, move(k(t, v, t.morph))), round: 1 };
};

// Шар вздрагивает на каждой влетевшей капле
const pulseAt = (t: ITimes, v: number) => {
    const i = Math.min(KINDS.length - 1, Math.floor((v - f(t, t.stagesFrom)) / f(t, t.stage)));
    if (i < 0 || v >= f(t, t.toChat[0])) return 1;
    const u = stageOf(t, v, i);
    let bump = 0;
    for (let j = 0; j < TOKENS; j++) {
        const x = (u - flyFrom(j) - FLY) / .06;
        if (x >= 0 && x <= 1) bump = Math.max(bump, Math.sin(Math.PI * x));
    }
    return 1 + .08 * bump;
};

// Где свет шара: в центре стекла, в чате – в шаре шапки, после чата – летит в угол
const lightAt = (v: number, g: IGeo): IBox => {
    const t = g.t;
    if (v < f(t, t.toChat[0])) return shellAt(v, g).box;
    if (v < f(t, t.chatOut[0])) return mix(g.work, g.head, move(k(t, v, t.lightIn)));
    return mix(g.head, g.fab, move(k(t, v, t.fly)));
};

// Пример сцены: своя доля пути из общего прогресса
// Отчёт уходит и у последнего примера: дальше шар раздувается в чат
const CStage: FC<{ e: MotionValue<number>, t: ITimes, i: number, kind: Kind, geoms: IGeom[], vertical: boolean, tokenRefs?: (j: number) => (el: HTMLDivElement | null) => void, outputRef?: (el: HTMLDivElement | null) => void }> = ({ e, t, i, ...rest }) => {
    const u = useTransform(e, (v) => stageRaw(t, v, i));
    return <PipelineStage u={u} last={false} {...rest} />;
};
const CLabel: FC<{ e: MotionValue<number>, t: ITimes, i: number }> = ({ e, t, i }) => {
    const u = useTransform(e, (v) => stageOf(t, v, i));
    return <Label u={u} last={i === KINDS.length - 1}>{pipelineStages[i]}</Label>;
};
const CBar: FC<{ e: MotionValue<number>, t: ITimes, i: number }> = ({ e, t, i }) => {
    const u = useTransform(e, (v) => stageOf(t, v, i));
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
    const output = useRef<HTMLDivElement | null>(null);

    const [g, setG] = useState<IGeo>(noGeo);
    const [geoms, setGeoms] = useState<IGeom[]>([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [atRest, setAtRest] = useState(true);
    const [tiersLive, setTiersLive] = useState(false);
    // Стык пройден: всё на экране погасло, клики идут к AgentDeck под ним
    const [handedOff, setHandedOff] = useState(false);
    // Стык с AgentDeck – только там, где она липкая сцена (те же условия, что в AgentDeck)
    const handoff = useMediaQuery('(min-width: 701px) and (min-height: 600px)');

    // Путь капель готовых вопросов – меряет InlineChat (onDropPath); до замера – оценка от высоты панели
    const dropPath = useRef(0);

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
        // Входы относительно шара сцены
        const a = area.current!;
        const wo = offsetIn(workOrb.current!, a);
        const ox = wo.x + workOrb.current!.offsetWidth / 2;
        const oy = wo.y + workOrb.current!.offsetHeight / 2;
        const tokenGeoms = tokens.current.map((el) => {
            if (!el) return noGeom;
            const p = offsetIn(el, a);
            return { dx: ox - (p.x + el.offsetWidth / 2), dy: oy - (p.y + el.offsetHeight / 2), w: el.offsetWidth, h: el.offsetHeight };
        });
        setGeoms(tokenGeoms);
        const geo = {
            slot: box(slot.current!),
            panel: box(panel.current!),
            head: box(headOrb.current!),
            work: box(workOrb.current!),
            card: box(card.current!),
            fab: { x: W - fm - fs, y: H - fm - fs, w: fs, h: fs },
            screen: { x: 0, y: 0, w: W, h: H },
            inset: { x: Math.max(16, (W - 1260) / 2), y: Math.max(12, H * .04) },
        };
        // Пути движений: сдвиг центра или изменение размера – что больше
        const change = (p: IBox, q: IBox) => Math.max(Math.hypot(center(q).x - center(p).x, center(q).y - center(p).y), Math.abs(q.w - p.w), Math.abs(q.h - p.h));
        const report = output.current;
        const paths: IPaths = {
            toWork: change(geo.slot, geo.work),
            token: Math.max(0, ...tokenGeoms.map((q) => Math.hypot(q.dx, q.dy))),
            // Отчёт раскрывается вбок, на телефоне – вниз
            report: report ? (vertical ? report.offsetHeight : report.offsetWidth) : 380,
            // Детали отчёта растут вбок и на телефоне
            build: report ? report.offsetWidth * .9 : 340,
            toChat: change(geo.work, geo.panel),
            light: change(geo.work, geo.head),
            // Капли готовых вопросов: от шара в шапке до кнопок, по дуге
            drop: dropPath.current || geo.panel.h * .9,
            morph: change(geo.panel, geo.card),
            fly: change(geo.head, geo.fab),
            rule: geo.card.w,
            card2: H - geo.card.y,
        };
        setG({ ...geo, t: timesFor(paths, H) });
    }, [vertical]);

    const { progress, measure, scrollToProgress } = useStickyScene({ scene, path, screen }, onMeasure);
    const onDropPath = useCallback((px: number) => {
        if (Math.abs(px - dropPath.current) < 1) return;
        dropPath.current = px;
        measure();
    }, [measure]);

    // Тач-экран: пока фокус в чате (клавиатура двигает страницу), сцена держится на открытом чате.
    // Фокус ушёл – плавно возвращается к скроллу. На компьютере не нужно: клавиатура страницу не двигает
    const freeze = useMotionValue(0);
    const t = g.t;
    const e = useTransform([progress, freeze], ([v, z]: number[]) => {
        const held = Math.min(Math.max(v, f(t, t.open[0]) + .002), f(t, t.open[1]) - .002);
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
        const hide = v < f(t, t.flyFade[0]);
        if (hide === fabHidden.current) return;
        fabHidden.current = hide;
        setInlineShown(hide);
    }, [setInlineShown, t]);
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
        setChatOpen(v >= f(t, t.open[0]) && v <= f(t, t.open[1]));
        setAtRest(v < .002);
        setTiersLive(v >= f(t, t.morph[1]));
        setHandedOff(handoff && v >= f(t, t.handoff[1]));
    });

    // ---------- Первый экран ----------
    const introOpacity = useTransform(e, (v) => 1 - easeOut(k(t, v, t.introOut)));
    const introY = useTransform(e, (v) => -70 * move(k(t, v, t.introOut)));
    const ctaOpacity = useTransform(e, (v) => 1 - k(t, v, t.ctaOut));

    // ---------- Шар: стекло (оболочка) ----------
    const shell = useTransform(e, (v) => shellAt(v, g));
    const shellTop = useTransform(shell, ({ box }) => box.y);
    const shellLeft = useTransform(shell, ({ box }) => box.x);
    const shellW = useTransform(shell, ({ box }) => box.w);
    const shellH = useTransform(shell, ({ box }) => box.h);
    const shellRadius = useTransform(shell, ({ box, round }) => lerp(box.w / 2, 13, round));
    const glass = useTransform(e, (v) => 1 - k(t, v, t.glassOut));
    // Долетела до места первой ступени – её сменяет настоящая карточка
    const shellOpacity = useTransform(e, (v) => v >= f(t, t.morph[1]) ? 0 : 1);
    // Шар вздрагивает на каждой влетевшей капле
    const pulse = useTransform(e, (v) => pulseAt(t, v));

    // ---------- Свет и звезда шара ----------
    const lightBox = useTransform(e, (v) => lightAt(v, g));
    const lightX = useTransform(lightBox, (b) => center(b).x - g.slot.w / 2);
    const lightY = useTransform(lightBox, (b) => center(b).y - g.slot.w / 2);
    const lightScale = useTransform(e, (v) => g.slot.w ? lightAt(v, g).w / g.slot.w * pulseAt(t, v) : 1);
    const lightOpacity = useTransform(e, (v) => (v < f(t, t.chatOut[0]) ? 1 - k(t, v, t.handIn) : k(t, v, t.handOut)) * (1 - k(t, v, t.flyFade)));
    const starOpacity = useTransform(e, (v) => v < f(t, t.chatOut[0]) ? 1 - k(t, v, t.starOut) : k(t, v, t.starIn));
    const starRotate = useTransform(e, (v) => 360 * span(v, f(t, t.stagesFrom), f(t, t.toChat[0] - t.stagesFrom)));
    const headOrbOpacity = useTransform(e, (v) => v < f(t, t.chatOut[0]) ? k(t, v, t.handIn) : 1 - k(t, v, t.handOut));

    // ---------- Чат ----------
    const clipPath = useTransform(shell, ({ box, round }) => {
        const pb = g.panel;
        const top = Math.max(0, box.y - pb.y);
        const left = Math.max(0, box.x - pb.x);
        const right = Math.max(0, pb.x + pb.w - box.x - box.w);
        const bottom = Math.max(0, pb.y + pb.h - box.y - box.h);
        return `inset(${top}px ${right}px ${bottom}px ${left}px round ${lerp(box.w / 2, 13, round)}px)`;
    });
    const chatIntro = useTransform(e, (v) => k(t, v, t.chatIn));
    const chatOpacity = useTransform(e, (v) => 1 - k(t, v, t.chatOut));
    const captionOpacity = useTransform(e, (v) => easeOut(k(t, v, t.caption)) * (1 - k(t, v, t.chatOut)));
    const captionY = useTransform(e, (v) => 12 * (1 - easeOut(k(t, v, t.caption))) - 12 * k(t, v, t.chatOut));

    // ---------- Агент за работой ----------
    const pipeOpacity = useTransform(e, (v) => easeOut(k(t, v, t.pipeIn)) * (1 - k(t, v, t.pipeOut)));
    const pipeY = useTransform(e, (v) => 24 * (1 - move(k(t, v, t.pipeIn))) - 40 * move(k(t, v, t.pipeOut)));

    // ---------- Чат → ступени ----------
    // Стык: всё, кроме пустой второй карточки, гаснет; саму карточку дальше рисует AgentDeck (deckTook)
    const handoffOut = useTransform(e, (v) => handoff ? 1 - k(t, v, t.handoff) : 1);
    const card1Opacity = useTransform([e, handoffOut], ([v, h]: number[]) => (v >= f(t, t.morph[1]) ? 1 : 0) * h);
    const card2Shown = useTransform(deckTook, (took) => handoff && took ? 0 : 1);

    const left = useTransform(e, (v) => k(t, v, t.leftIn));
    const c1 = useTransform(e, (v) => k(t, v, t.card1));
    const c2 = useTransform(e, (v) => k(t, v, t.card2Text));
    const arrive = useTransform(e, (v) => move(k(t, v, t.card2)));
    const card2Y = useTransform(arrive, (a) => (g.screen.h - g.card.y) * (1 - a));
    const card1Scale = useTransform(arrive, (a) => 1 - .06 * a);
    // На телефоне сдвиг меньше: выше карточек – черты ступеней
    const card1Y = useTransform(arrive, (a) => (vertical ? -12 : -28) * a);
    const card1Dim = useTransform(arrive, (a) => 1 - .65 * a);
    const bar1 = useTransform(e, (v) => k(t, v, t.card1));
    const bar2 = useTransform(e, (v) => k(t, v, t.card2));

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
            style={{ '--scene-h': `calc(var(--screen-h) + ${t.path * 100}vh)` } as CSSProperties}
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
                                <button type="button" className={o.orbButton} onClick={() => scrollToProgress(f(t, t.chatAt))} aria-label={ph.orbLabel} />
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
                                {KINDS.map((kind, i) => <CBar key={kind} e={e} t={t} i={i} />)}
                            </div>
                            <div className={p.labels}>
                                {KINDS.map((kind, i) => <CLabel key={kind} e={e} t={t} i={i} />)}
                            </div>
                        </motion.div>

                        <div ref={area} className={p.area}>
                            {KINDS.map((kind, i) => (
                                <CStage
                                    key={kind}
                                    e={e}
                                    t={t}
                                    i={i}
                                    kind={kind}
                                    geoms={geoms}
                                    vertical={vertical}
                                    tokenRefs={i === 0 ? (j) => (el) => { tokens.current[j] = el } : undefined}
                                    outputRef={i === 0 ? (el) => { output.current = el } : undefined}
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
                        {/* Вне окна чата панель прозрачна для кликов: в покое её обрезка совпадает с шаром и закрывала кнопку шара */}
                        <motion.div ref={panel} className={`${o.panel} ${chatOpen ? '' : s.panelIdle}`} style={{ clipPath, opacity: chatOpacity }}>
                            <InlineChat
                                bare
                                intro={chatIntro}
                                orbRef={headOrb}
                                orbOpacity={headOrbOpacity}
                                inert={!chatOpen}
                                onInteract={onInteract}
                                onLeave={onLeave}
                                manageFab={false}
                                onDropPath={onDropPath}
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

