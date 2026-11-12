"use client";

import { CSSProperties, FC, FocusEvent, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cubicBezier, easeInOut, easeOut, motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

import photo from '@/assets/_img/rectangles/title-page/i.png'

import s from './HeroExpand.module.scss'
import HeroSlides from "./HeroSlides";
import { SceneAfterContext } from "./sceneAfter";
import { burstLength, chipDelay, chipPeak, CHIP_UP, CLEAR_LIFT, DESKTOP_DEFAULT, DRAIN, FILLED, FLIGHT, ISceneTiming, LIFT, OTHER_FROM, OTHER_RISE, PHONE_DEFAULT, sameTiming, sceneTiming, SPREAD, WAVE } from "./timing";
import { drop, move } from "@/app/ai/components/speed";
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";
import ContactLink from "../contact-link/ContactLink";
import { formButton, heroInterval, heroPrice, heroPriceNote, heroSlides, heroTitleSlide, industriesDescription, industriesOther, industriesOtherQuestion, industriesTitle, industryChipCount } from "@/data/offer";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { IIndustryChip } from "@/interfaces/portfolio";
import { withIndustry } from "@/scripts/portfolioIndustry";
import { plural } from "@/scripts/portfolioStats";
import { isTouchDevice } from "@/scripts/typeDevice";

interface HeroExpandProps {
    chips: IIndustryChip[],
    // Сколько работ в портфолио, число в кружке над заголовком
    worksCount: number,
    // Блок после сцены («Избранные кейсы»): виден сквозь дыру портала и стоит на месте, пока она открывается
    children?: ReactNode
}

// Время сцены – timing.ts: окна движений от их путей, скорость как у сцен /sites и /ai (владелец 11.11.2026).
// Доводки нет, этапы проходятся только скроллом (Д30). Телефон – до 700px, как @media стилей .scene и .nextTrack
const PHONE_QUERY = "(max-width: 700px)";

// Сглаживание прогресса: щелчки колеса мыши не дёргают анимацию. Без перелёта, догоняет за ~0,3 с
const SMOOTH = { stiffness: 170, damping: 30, restDelta: .0001 };
// Потолок отставания пружины от скролла, в экранах: при рывке (ползунок, End, сильный свайп) она перескакивает до него,
// остаток догоняет как обычно. Меньше запаса липкости (--hold в стилях, 1 экран): экран сцены отпускается, когда дыра
// уже на весь экран, при любой скорости. Колесо и тачпад отстают на 100–300px – потолок не срабатывает (DESIGN_FIXES_6_PLAN С3)
const LAG_CAP = .8;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Отступ края фона: от отступа карточки при t = 0 до нуля при t = 1
const useInset = (t: MotionValue<number>, edge: MotionValue<number>) =>
    useTransform([t, edge], ([p, e]: number[]) => e * (1 - p));

// Кадр от значений и времени сцены: пересчитывается и при скролле, и когда замер меняет время
const useTimed = <T,>(tmv: MotionValue<ISceneTiming>, inputs: MotionValue<number>[], fn: (v: number[], tm: ISceneTiming) => T) =>
    useTransform([...inputs, tmv] as MotionValue[], (all) => fn(all.slice(0, -1) as number[], all[all.length - 1] as ISceneTiming));

// Сдвиг или масштаб фото: от 0 (или 1) при t = 0 до цели при t = 1
const useToward = (t: MotionValue<number>, target: MotionValue<number>, from = 0) =>
    useTransform([t, target], ([p, v]: number[]) => from + (v - from) * p);

// Положение элемента внутри root без transform: сумма offsetLeft/Top по цепочке offsetParent
const offsetIn = (el: HTMLElement, root: HTMLElement) => {
    let x = 0;
    let y = 0;
    let node: HTMLElement | null = el;
    while (node && node !== root) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
    }
    return { x, y };
};

// Портал: off – не начался, on – идёт, open – дыра почти на весь экран, клики проходят к блоку под сценой
type PortalState = 'off' | 'on' | 'open';

// ---------- Брызги из круга, по скроллу ----------
// Таймлайн в секундах, но время берётся из скролла: весь путь брызг (timing.ts) – вся их длительность.
// Скролл назад проигрывает их в обратную сторону теми же кадрами

// Капля летит FLIGHT, растекается в залитый чип SPREAD, стоит залитой FILLED и стекает слева направо за DRAIN;
// волна от кружка идёт WAVE, с (timing.ts). Путь брызг в экранах – от путей капель и волны: в среднем они не быстрее
// сцен /sites и /ai (владелец 11.11.2026); волна длиннее, чем была (.45 с), чтобы не обгонять капли.
// Подпись чипа – над каплей (DESIGN_FIXES_7_PLAN Д37, выбор владельца): в капле её копия цветом фона, как у чипа
// при наведении, под каплей – обычная. Где заливка, текст светлый, где её уже нет – тёмный: чёрной пилюли без подписи нет ни в одном кадре
// Кнопка и цена первого экрана держатся, пока волна не открыла заголовок, и гаснут до того, как лягут капли (Д37)
const CTA_OUT_FROM = .5;
const CTA_OUT_TO = .75;
// Размер капли в полёте, px
const DROP = 12;

// Чип относительно кружка: сдвиг от места чипа до центра кружка и размер чипа
interface ChipGeom { i: number, dx: number, dy: number, w: number, h: number }
// Волна по заголовку и подписи: центр кружка относительно их блока, радиус кружка и до какого радиуса волна растёт
interface WaveGeom { x: number, y: number, from: number, to: number }

const noWave: WaveGeom = { x: 0, y: 0, from: 0, to: 0 };

const circle = (r: number, { x, y }: WaveGeom) => `circle(${r}px at ${x}px ${y}px)`;
// Капля – тёмная пилюля поверх чипа, в полёте обрезана до точки
const dot = ({ w, h }: ChipGeom) => `inset(${(h - DROP) / 2}px ${(w - DROP) / 2}px round 24px)`;

const flyEase = cubicBezier(.3, .5, .5, 1);
const spreadEase = cubicBezier(.2, .9, .3, 1);
// Волна: наклон на старте 1,5 (WAVE_SLOPE в timing.ts – менять вместе), а не 3 – без рывка в первом кадре
const waveEase = cubicBezier(.3, .45, .4, 1);
const riseEase = cubicBezier(.2, .8, .2, 1);
// Доля отрезка [from, from + dur] к моменту time
const span = (time: number, from: number, dur: number) => clamp01((time - from) / dur);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
// Значение по ключевым кадрам, между кадрами – по прямой
const keys = (k: number, values: number[], times: number[]) => {
    for (let i = 1; i < times.length; i++) {
        if (k <= times[i]) return lerp(values[i - 1], values[i], (k - times[i - 1]) / (times[i] - times[i - 1]));
    }
    return values[values.length - 1];
};

// Заголовок и подпись проявляются кругом, который расходится от кружка; кружок вздрагивает
const waveFrame = (time: number, g: WaveGeom) => {
    const k = span(time, .05, WAVE);
    const r = lerp(g.from, g.to, waveEase(k));
    return {
        clip: circle(r, g),
        lead: time >= .05 ? 1 : 0,
        pulse: keys(span(time, 0, .6), [1, 1.1, .97, 1], [0, .3, .65, 1]),
    };
};

// Чип в момент time: полёт из кружка по дуге, как из фонтана, капля растекается в залитый чип с подписью
// и стекает слева направо, открывая обычный чип
const chipFrame = (time: number, g: ChipGeom) => {
    const d = chipDelay(g.i);
    const f = span(time, d, FLIGHT);
    // Растекается, когда долетела: в полёте пилюля прошла бы по подписи отраслей (на телефоне чипы далеко внизу)
    const spreadFrom = d + FLIGHT;
    const spread = spreadEase(span(time, spreadFrom, SPREAD));
    const drain = easeInOut(span(time, spreadFrom + SPREAD + FILLED, DRAIN));
    return {
        x: g.dx * (1 - flyEase(f)),
        // Падение – кривой drop, как у падающей линии /ai: разгон и ровно до удара, без разгона в самой посадке
        y: f < CHIP_UP ? g.dy - LIFT * easeOut(f / CHIP_UP) : (g.dy - LIFT) * (1 - drop((f - CHIP_UP) / (1 - CHIP_UP))),
        clip: drain > 0
            ? `inset(0px 0px 0px ${g.w * drain}px round 24px)`
            : `inset(${(g.h - DROP) / 2 * (1 - spread)}px ${(g.w - DROP) / 2 * (1 - spread)}px round 24px)`,
        // .999, а не 1: в конце брызг (1,5 − 1,3) / 0,2 даёт 0,999…
        drop: time < d || drain > .999 ? 0 : 1,
        // Обычный чип открывается под каплей, когда она растеклась целиком: до этого он летел бы вместе с ней
        face: time >= spreadFrom + SPREAD ? 1 : 0,
    };
};

interface ScrubChipProps {
    // Время брызг, с
    time: MotionValue<number>,
    geom: ChipGeom,
    itemRef: (el: HTMLLIElement | null) => void,
    // Подпись чипа в капле – копия цветом фона
    fill: ReactNode,
    children: ReactNode
}

// Чип брызг: кадр считается из времени, без своих анимаций
const ScrubChip: FC<ScrubChipProps> = ({ time, geom, itemRef, fill, children }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const clip = useMotionValue(dot(geom));
    const drop = useMotionValue(0);
    const face = useMotionValue(0);

    const paint = useCallback((v: number) => {
        const f = chipFrame(v, geom);
        x.set(f.x);
        y.set(f.y);
        clip.set(f.clip);
        drop.set(f.drop);
        face.set(f.face);
    }, [geom, x, y, clip, drop, face]);
    useMotionValueEvent(time, 'change', paint);
    useEffect(() => paint(time.get()), [paint, time]);

    return (
        <motion.li ref={itemRef} className={s.chipItem} style={{ x, y }}>
            <motion.span className={s.drop} style={{ clipPath: clip, opacity: drop }} aria-hidden="true">
                <span className={`${s.chip} ${s.chipFill}`}>{fill}</span>
            </motion.span>
            <motion.div style={{ opacity: face }}>{children}</motion.div>
        </motion.li>
    );
};

// ---------- Круг-портал ----------

// Доли пути портала (timing.ts): к clearTo отрасли погасли и диск начинает расти, к diskTo дорос, на openAt в нём
// открывается дыра; между ними он стоит с надписью. Рост диска – кривой move (speed.ts), как движения /sites и /ai
const diskGrow = (v: number, tm: ISceneTiming) => move((v - tm.clearTo) / (tm.diskTo - tm.clearTo));
// Ход дыры – тоже move: радиус дыры растёт с постоянной скоростью (SPEED) от нуля до дальнего угла экрана.
// Раньше старт был резким (1 − (1 − k)⁴, до ~18 px/px на 1400×900) – владелец 11.11.2026: «резко расширяется, неприятно»
const holeEase = (v: number, tm: ISceneTiming) => move((v - tm.openAt) / (1 - tm.openAt));
// Диск до открытия дыры: радиус, px, но не больше доли ширины экрана
const DISK = 150;
const DISK_SHARE = .3;
// Запас от диска до краёв экрана, px. Где диск с ним не влезает (короткий телефон), он вместе со знаком, пока растёт,
// сдвигается внутрь экрана ровно настолько, насколько нужно; размер не меняется (DESIGN_FIXES_6_PLAN С2, решение владельца)
const DISK_GAP = 12;
// Знак «10 проектов» не гаснет полупрозрачным в дыре (Д37): он целый, пока дыра его не съела, и пропадает,
// когда дыра шире этой доли диска – надписи знака в ней уже целиком, снаружи остался только чёрный круг, как диск.
// Кружок-знак над маской до «Лучших проектов» владелец отклонил (04.11.2026): короткий кадр открытия дыры
// без целого текста (~20px прокрутки на 1400, ~50 на 820) принят
const MARK_GONE = .75;
// Кольцо между дырой и краем диска гаснет в этом отрезке хода дыры (holeEase),
// пока оно ещё толстое: не сжимается в волосяную дугу (DESIGN_FIXES_2_PLAN, Д9). Раньше – .3–.7: чёрный «бублик»
// стоял ~190px прокрутки, потом ~90 (DESIGN_FIXES_6_PLAN Д30), с быстрым стартом дыры – ~30 (Д37)
const RING_FADE_FROM = .2;
const RING_FADE_TO = .5;

// Первый экран главной (SALES_PLAN 3.1), блок отраслей (3.2) и вход в «Избранные кейсы» одной сценой
// (ANIMATION_PLAN, 1Г + 2Г). Всё ведёт скролл, вперёд и назад, без доводки.
// Сцена высотой в несколько экранов, внутри липкий экран. Фон карточки раскрывается до краёв окна,
// фото летит в кружок над заголовком и перетекает в число работ. Из кружка расходится волна с заголовком,
// чипы вылетают каплями и растекаются по местам. Дальше кружок растёт в диск, в нём открывается дыра,
// сквозь неё видны кейсы; дыра уходит за края экрана, а кейсы ещё прилипают, пока скролл раздаёт их из колоды.
// Чип ведёт на /portfolio?for=<id>, отрасли без работ не показываются
const HeroExpand: FC<HeroExpandProps> = ({ chips, worksCount, children }) => {
    const reduceMotion = usePrefersReducedMotion();
    // Время сцены: до замера – по типичному экрану, после – по путям на этом экране (timing.ts).
    // В состоянии – для высоты сцены, в tmv – для кадров: useTransform пересчитывает кадр, когда меняется время
    // До замера длина сцены – из CSS по ширине (типичный компьютер или телефон): высота страницы не прыгает после загрузки
    const [tm, setTm] = useState(DESKTOP_DEFAULT);
    const [measured, setMeasured] = useState(false);
    const tmv = useMotionValue(tm);
    const applyTiming = useCallback((next: ISceneTiming) => {
        setMeasured(true);
        if (sameTiming(next, tmv.get())) return;
        tmv.set(next);
        setTm(next);
    }, [tmv]);

    const scene = useRef<HTMLElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const card = useRef<HTMLDivElement>(null);
    const photoBox = useRef<HTMLDivElement>(null);
    const slot = useRef<HTMLDivElement>(null);
    const root = useRef<HTMLDivElement>(null);
    const lead = useRef<HTMLDivElement>(null);
    const chipEls = useRef<(HTMLLIElement | null)[]>([]);
    const [portalState, setPortalState] = useState<PortalState>('off');
    // Путь после портала: распорка в треке кейсов (на телефоне её нет – высота 0) и доля пути
    const afterEl = useRef<HTMLDivElement>(null);
    const nextTrack = useRef<HTMLDivElement>(null);
    const afterProgress = useMotionValue(0);
    const [afterOn, setAfterOn] = useState(false);
    const smoothAfter = useSpring(afterProgress, SMOOTH);
    // Блок кейсов и его отступ липкости: по центру экрана, если короче него (на телефоне длиннее – 0)
    const nextEl = useRef<HTMLDivElement>(null);
    const [nextTop, setNextTop] = useState(0);
    const [waveGeom, setWaveGeom] = useState<WaveGeom>(noWave);
    const [chipGeoms, setChipGeoms] = useState<ChipGeom[]>([]);

    // Прогресс – от начала сцены до конца пути: путь – высота слоя пути (path) без высоты экрана.
    // Сцена длиннее пути на запас липкости (--hold): экран держится, пока сглаженный прогресс догоняет скролл (DESIGN_FIXES_6_PLAN С3).
    // Не useScroll по сцене ('end end' меряет по окну): экран выше окна, пока панели браузера развёрнуты,
    // и прогресс не доходил бы до 1, когда экран уже уезжает (DESIGN_FIXES_6_PLAN С1)
    const sceneTop = useMotionValue(0);
    const sceneLen = useMotionValue(1);
    // LAG_CAP в долях пути
    const lagCap = useMotionValue(1);
    const { scrollY } = useScroll();
    const rawProgress = useTransform([scrollY, sceneTop, sceneLen], ([y, top, len]: number[]) => clamp01((y - top) / len));
    // Анимация идёт за сглаженным прогрессом; сам скролл страницы не трогаем
    const scrollYProgress = useSpring(rawProgress, SMOOTH);
    // Потолок отставания: прогресс без обрезки по [0, 1] – за концом пути скролл идёт дальше, а пружина должна успеть до 1.
    // jump останавливает пружину, set запускает её снова к цели
    useMotionValueEvent(scrollY, 'change', (y) => {
        const p = (y - sceneTop.get()) / sceneLen.get();
        const v = scrollYProgress.get();
        const lo = clamp01(p - lagCap.get());
        const hi = clamp01(p + lagCap.get());
        if (v >= lo && v <= hi) return;
        scrollYProgress.jump(v < lo ? lo : hi);
        scrollYProgress.set(clamp01(p));
    });
    // Раскрытие: фон до краёв, фото в кружок – кривой move, как движения /sites и /ai
    const t = useTimed(tmv, [scrollYProgress], ([p], m) => move((p - m.expandFrom) / (m.expandTo - m.expandFrom)));

    // Отступы карточки от краёв липкого экрана, меряются при загрузке и ресайзе
    const top = useMotionValue(0);
    const right = useMotionValue(0);
    const bottom = useMotionValue(0);
    const left = useMotionValue(0);
    // Куда едет фото: сдвиг до кружка над заголовком и масштаб под его размер
    const photoDx = useMotionValue(0);
    const photoDy = useMotionValue(0);
    const photoScale = useMotionValue(1);
    // Портал: центр и радиус кружка в координатах экрана, диск до дыры, сдвиг его центра внутрь экрана, радиус до дальнего угла
    const cx = useMotionValue(0);
    const cy = useMotionValue(0);
    const r0 = useMotionValue(0);
    const diskMax = useMotionValue(DISK);
    const diskDy = useMotionValue(0);
    const rMax = useMotionValue(0);

    // Объявлены до замера: useTransform подписывается на края в своём эффекте,
    // и замер, сделанный раньше подписки, фон бы не увидел
    const bgTop = useInset(t, top);
    const bgRight = useInset(t, right);
    const bgBottom = useInset(t, bottom);
    const bgLeft = useInset(t, left);
    const radius = useTransform(t, [0, 1], [13, 0]);
    const towardX = useToward(t, photoDx);
    const towardY = useToward(t, photoDy);
    const towardScale = useToward(t, photoScale, 1);

    useLayoutEffect(() => {
        if (!screen.current || !card.current || !photoBox.current) return;
        const measure = () => {
            if (!screen.current || !card.current || !photoBox.current || !scene.current || !path.current) return;
            scene.current.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
            // offsetTop, а не getBoundingClientRect: страница въезжает на 20px (template.tsx), и замер во время въезда сбивал бы путь
            sceneTop.set(offsetIn(scene.current, document.body).y);
            const len = Math.max(1, path.current.offsetHeight - screen.current.offsetHeight);
            sceneLen.set(len);
            lagCap.set(LAG_CAP * screen.current.offsetHeight / len);
            const box = screen.current.getBoundingClientRect();
            // offsetTop/Left не видят transform, поэтому уехавшие слайды и фото не сбивают замер
            const c = card.current;
            top.set(c.offsetTop);
            left.set(c.offsetLeft);
            right.set(box.width - c.offsetLeft - c.offsetWidth);
            bottom.set(box.height - c.offsetTop - c.offsetHeight);

            if (!slot.current) return;
            const p = photoBox.current.getBoundingClientRect();
            const target = slot.current.getBoundingClientRect();
            photoDx.set(target.left + target.width / 2 - (p.left + p.width / 2));
            photoDy.set(target.top + target.height / 2 - (p.top + p.height / 2));
            photoScale.set(target.width / p.width);

            // Портал: кружок в координатах липкого экрана
            const x = target.left + target.width / 2 - box.left;
            const y = target.top + target.height / 2 - box.top;
            cx.set(x);
            cy.set(y);
            r0.set(target.width / 2);
            const dm = Math.min(DISK, box.width * DISK_SHARE);
            diskMax.set(dm);
            // Центр диска – ближайшая к кружку точка, где диск с запасом влезает в экран по высоте (по ширине влезает всегда:
            // радиус не больше 30% ширины); экран ниже диска с запасами – по центру
            const lo = dm + DISK_GAP;
            const hi = box.height - dm - DISK_GAP;
            const dy = (lo <= hi ? Math.min(Math.max(y, lo), hi) : box.height / 2) - y;
            diskDy.set(dy);
            // Дыра открывается из нового центра
            rMax.set(Math.hypot(Math.max(x, box.width - x), Math.max(y + dy, box.height - y - dy)) + 2);
            // Брызги: где заголовок и чипы относительно кружка
            if (!root.current || !lead.current) return;
            const r = root.current;
            const o = offsetIn(slot.current, r);
            const sx = o.x + slot.current.offsetWidth / 2;
            const sy = o.y + slot.current.offsetHeight / 2;
            const l = offsetIn(lead.current, r);
            const lx = sx - l.x;
            const ly = sy - l.y;
            setWaveGeom({
                x: lx,
                y: ly,
                from: slot.current.offsetWidth / 2,
                to: Math.hypot(Math.max(lx, lead.current.offsetWidth - lx), lead.current.offsetHeight - ly) + 8,
            });
            setChipGeoms(chipEls.current.map((el, i) => {
                if (!el) return { i, dx: 0, dy: 0, w: 0, h: 0 };
                const ch = offsetIn(el, r);
                return {
                    i,
                    dx: sx - (ch.x + el.offsetWidth / 2),
                    dy: sy - (ch.y + el.offsetHeight / 2),
                    w: el.offsetWidth,
                    h: el.offsetHeight,
                };
            }));

            // Время сцены – от путей на этом экране (timing.ts)
            const chipOffsets = chipEls.current.map((el) => {
                if (!el) return [0, 0];
                const ch = offsetIn(el, r);
                return [sx - ch.x - el.offsetWidth / 2, sy - ch.y - el.offsetHeight / 2];
            });
            const phoneNow = window.matchMedia(PHONE_QUERY).matches;
            applyTiming(sceneTiming({
                h: box.height,
                phone: phoneNow,
                chips: chipEls.current.length,
                photo: Math.hypot(photoDx.get(), photoDy.get()),
                inset: Math.max(top.get(), right.get(), bottom.get(), left.get()),
                chip: Math.max(0, ...chipOffsets.map(([dx, dy]) => Math.hypot(dx, dy))),
                chipPeak: Math.max(0, ...chipOffsets.map(([dx, dy]) => chipPeak(dx, dy))),
                wave: Math.hypot(Math.max(lx, lead.current.offsetWidth - lx), lead.current.offsetHeight - ly),
                grow: Math.max(dm - target.width / 2, Math.abs(dy)),
                open: rMax.get(),
                // Крайняя карта колоды едет на ширину колонки (три в ряд); на телефоне раздачи от сцены нет
                deal: phoneNow || !nextEl.current ? 0 : nextEl.current.offsetWidth / 3,
            }));
        };
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        [scene.current, path.current, screen.current, card.current, photoBox.current, slot.current, root.current, lead.current, nextEl.current]
            .forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, [reduceMotion, sceneTop, sceneLen, lagCap, top, right, bottom, left, photoDx, photoDy, photoScale, cx, cy, r0, diskMax, diskDy, rMax, applyTiming]);

    // Тач-экран: экран сцены не ниже наибольшего innerHeight при этой ширине окна (--screen-max-h в стилях).
    // Только растёт – панели браузера сворачиваются и разворачиваются на скролле; при смене ширины (поворот) – заново.
    // На компьютере lvh и так равна окну, а растущий запас мешал бы при уменьшении окна по высоте
    useEffect(() => {
        if (reduceMotion || !isTouchDevice()) return;
        let width = 0;
        let max = 0;
        const update = () => {
            if (window.innerWidth !== width) {
                width = window.innerWidth;
                max = 0;
            }
            if (window.innerHeight <= max) return;
            max = window.innerHeight;
            [scene.current, nextTrack.current].forEach((el) => el?.style.setProperty('--screen-max-h', `${max}px`));
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [reduceMotion]);

    // Доля пути портала
    const q = useTimed(tmv, [scrollYProgress], ([p], m) => clamp01((p - m.portalFrom) / (1 - m.portalFrom)));

    // На подлёте к кружку фото перетекает в знак: фото гаснет, знак проявляется и дорастает до размера.
    // В портале знак с надписью растёт вместе с диском и гаснет, когда в диске открывается дыра
    const photoOpacity = useTransform(t, [.7, 1], [1, 0]);
    const markIn = useTransform(t, [.7, 1], [0, 1]);
    const markScaleIn = useTransform(t, [.7, 1], [.6, 1]);

    // Надпись и подпись слайда гаснут сразу – на их месте проступит заголовок сцены. Кнопка и цена держатся,
    // пока заголовок не открылся (CTA_OUT_*, ниже): в кадре всегда есть что прочитать (DESIGN_FIXES_7_PLAN Д37, выбор владельца)
    const slidesOpacity = useTimed(tmv, [scrollYProgress], ([p], m) => 1 - clamp01((p - m.expandFrom) / (m.slidesOut - m.expandFrom)));
    const slidesY = useTimed(tmv, [scrollYProgress], ([p], m) => -60 * clamp01((p - m.expandFrom) / (m.expandTo - m.expandFrom)));

    // Отрасли втягиваются к кружку и гаснут до того, как он начнёт расти
    const cleared = useTimed(tmv, [q], ([v], m) => clamp01(v / m.clearTo));
    const contentOpacity = useTransform(cleared, [0, 1], [1, 0]);
    const contentScale = useTransform(cleared, [0, 1], [1, .9]);
    const contentY = useTransform(cleared, [0, 1], [0, -CLEAR_LIFT]);

    // Диск растёт из кружка до DISK, стоит с надписью до openAt, потом в нём открывается дыра. Радиус дыры растёт
    // с постоянной скоростью до дальнего угла экрана, диск – впереди неё на кольцо, которое тоньшает до нуля
    const disk = useTimed(tmv, [q, r0, diskMax, rMax], ([v, r, dm, rm], m) => {
        if (v < m.openAt) return r + (dm - r) * diskGrow(v, m);
        const u = holeEase(v, m);
        return rm * u + dm * (1 - u) * (1 - u);
    });
    // Сдвиг центра внутрь экрана идёт вместе с ростом диска, дальше стоит: край диска не заходит за запас ни в одном кадре
    const diskY = useTimed(tmv, [q, diskDy], ([v, dy], m) => dy * diskGrow(v, m));
    const diskCy = useTransform([cy, diskY], ([y, d]: number[]) => y + d);
    // Знак «10 работ» растёт вместе с диском до его размера перед дырой: круг, число и подпись – одним целым
    const markScale = useTransform([markScaleIn, q, r0, disk, diskMax], ([a, v, r, d, dm]: number[]) =>
        a * (v > 0 && r > 0 ? Math.min(d, dm) / r : 1));
    const hole = useTimed(tmv, [q, rMax], ([v, rm], m) => v <= m.openAt ? 0 : rm * holeEase(v, m));
    const markOut = useTransform([hole, diskMax], ([h, dm]: number[]): number => h < dm * MARK_GONE ? 1 : 0);
    const markOpacity = useTransform([markIn, markOut], ([a, b]: number[]) => a * b);
    const diskBg = useTransform([q, cx, diskCy, disk], ([v, x, y, d]: number[]) => v <= 0
        ? "none"
        : `radial-gradient(circle at ${x}px ${y}px, var(--color-text-100) ${d}px, transparent ${d + 1}px)`);
    const ringOpacity = useTimed(tmv, [q], ([v], m) =>
        1 - clamp01((holeEase(v, m) - RING_FADE_FROM) / (RING_FADE_TO - RING_FADE_FROM)));
    const holeMask = useTransform([hole, cx, diskCy], ([h, x, y]: number[]) => h <= 0
        ? 'none'
        : `radial-gradient(circle at ${x}px ${y}px, transparent ${h}px, #000 ${h + 1}px)`);
    // Сплошная подложка под фоном раскрытой карточки: кейсы не просвечивают до портала
    const baseOpacity = useTransform(t, [.8, 1], [0, 1]);

    useMotionValueEvent(q, 'change', (v) => {
        // Клики проходят к кейсам, когда дыра почти на весь экран
        setPortalState(v <= 0 ? 'off' : v < .9 ? 'on' : 'open');
    });

    // Путь после портала: сколько проехали за концом сцены, в долях распорки
    const updateAfter = useCallback(() => {
        if (!afterEl.current) return;
        const extra = afterEl.current.offsetHeight;
        const passed = window.scrollY - sceneTop.get() - sceneLen.get();
        afterProgress.set(extra > 0 ? clamp01(passed / extra) : 0);
    }, [afterProgress, sceneTop, sceneLen]);
    useMotionValueEvent(scrollY, 'change', updateAfter);
    // Есть ли путь (на телефоне распорки нет) – при загрузке и ресайзе
    useEffect(() => {
        const measure = () => {
            setAfterOn((afterEl.current?.offsetHeight ?? 0) > 0);
            updateAfter();
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [updateAfter]);
    // Высота блока меняется со шрифтами и шириной: следим за ним и за окном
    useEffect(() => {
        const el = nextEl.current;
        if (!el) return;
        const measure = () => setNextTop(Math.max(0, Math.round((window.innerHeight - el.offsetHeight) / 2)));
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        window.addEventListener('resize', measure);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [reduceMotion]);

    // Брызги: время их таймлайна, с, и кадр волны, кружка и строки «Другая сфера?»
    const burstTotal = burstLength(chips.length);
    // До посадки последней капли – скоростью капель, после – коротким хвостом (timing.ts, TAIL_MAX)
    const burstTime = useTimed(tmv, [scrollYProgress], ([p], m) => p < m.landAt
        ? clamp01((p - m.burstFrom) / (m.landAt - m.burstFrom)) * m.landSec
        : m.landSec + clamp01((p - m.landAt) / (m.burstTo - m.landAt)) * (burstTotal - m.landSec));
    const ctaOpacity = useTransform(burstTime, [CTA_OUT_FROM, CTA_OUT_TO], [1, 0]);
    const [burstShown, setBurstShown] = useState(false);
    const leadClip = useMotionValue('none');
    const leadOpacity = useMotionValue(0);
    const pulseScale = useMotionValue(1);
    const otherOpacity = useMotionValue(0);
    const otherY = useMotionValue(16);
    const paintBurst = useCallback((v: number) => {
        const w = waveFrame(v, waveGeom);
        leadClip.set(w.clip);
        leadOpacity.set(w.lead);
        pulseScale.set(w.pulse);
        const e = riseEase(span(v, chipDelay(chips.length - 1) + FLIGHT + OTHER_FROM, OTHER_RISE));
        otherOpacity.set(e);
        otherY.set(16 * (1 - e));
    }, [waveGeom, chips.length, leadClip, leadOpacity, pulseScale, otherOpacity, otherY]);
    useMotionValueEvent(burstTime, 'change', (v) => {
        paintBurst(v);
        setBurstShown(v >= burstTotal * .95);
    });
    useEffect(() => paintBurst(burstTime.get()), [paintBurst, burstTime]);

    // Чипы кликаются мышью, только пока видны. С клавиатуры они доступны всегда (ниже)
    const live = reduceMotion || (burstShown && portalState === 'off');

    // Клавиатура (DESIGN_FIXES_PLAN, Д3): фокус ведёт сцену. Tab к элементу, который сейчас не виден,
    // прокручивает страницу туда, где сцена его показывает; анимация догоняет за сглаженным прогрессом.
    // Только для фокуса с клавиатуры: клик мышью страницу не двигает
    const sceneSpan = () => scene.current ? { top: sceneTop.get(), len: sceneLen.get() } : null;
    const byKeyboard = (e: FocusEvent<HTMLElement>) => e.target.matches(':focus-visible');
    // Прогресс сцены вне [from, to] – прокрутить к at
    const holdScene = (from: number, to: number, at: number) => {
        const span = sceneSpan();
        if (!span) return;
        const p = (window.scrollY - span.top) / span.len;
        if (p < from || p > to) window.scrollTo({ top: span.top + at * span.len, behavior: 'instant' });
    };
    // Первый экран: черты слайдов и кнопка – пока карточка не начала раскрываться
    const focusHero = (e: FocusEvent<HTMLElement>) => {
        if (byKeyboard(e)) holdScene(-Infinity, tm.expandFrom, 0);
    };
    // Отрасли: брызги разлетелись, портал ещё не начался
    const focusIndustries = (e: FocusEvent<HTMLElement>) => {
        if (byKeyboard(e)) holdScene(tm.burstTo, tm.portalFrom, (tm.burstTo + tm.portalFrom) / 2);
    };
    // Кейсы: сцена кончилась и колода роздана, блок стоит на своём месте в потоке, дальше – к самой карточке
    const focusCases = (e: FocusEvent<HTMLElement>) => {
        const span = sceneSpan();
        if (!span || !byKeyboard(e)) return;
        const end = span.top + span.len + (afterEl.current?.offsetHeight ?? 0);
        if (window.scrollY < end) window.scrollTo({ top: end, behavior: 'instant' });
        (e.target.closest('article') ?? e.target).scrollIntoView({ block: 'nearest', behavior: 'instant' });
    };
    const geomOf = (i: number): ChipGeom => chipGeoms[i] ?? { i, dx: 0, dy: 0, w: 0, h: 0 };

    // Число подписано: «· 2 проекта» (DESIGN_FIXES_7_PLAN Д35)
    const chipFace = (chip: IIndustryChip) => (
        <>
            {chip.label}
            <span className={s.count} aria-hidden="true">·</span>
            <span className={s.count}>{industryChipCount(chip.count)}</span>
        </>
    );
    const chipLink = (chip: IIndustryChip) => (
        <Link
            href={withIndustry(portfolioPageURL, chip.id)}
            className={s.chip}
            data-goal="industry_click"
            data-goal-id={chip.id}
            aria-label={`${chip.label}, ${industryChipCount(chip.count)}`}
        >
            {chipFace(chip)}
        </Link>
    );

    // Призыв первого экрана (DESIGN_FIXES_PLAN Д2): одна залитая кнопка на форму и строка с ценой.
    // Форма – на главной, прыжок мимо сцены (DESIGN_FIXES_3_PLAN Д13).
    // Вне слайдов, чтобы не сменялся вместе с ними
    const cta = (
        <div className={s.cta} data-goal-place="hero">
            <ContactLink className={`${ralewayBold.className} ${s.ctaButton}`}>
                {formButton}
            </ContactLink>
            <p className={s.ctaNote}>
                <b className={ralewayBold.className}>{heroPrice}</b>
                <span className={s.ctaDot}> · </span>
                <span>{heroPriceNote}</span>
            </p>
        </div>
    );

    const industries = (
        <div
            ref={root}
            className={`${ralewayRegular.className} ${s.industries}`}
            aria-labelledby="industries-title"
            role="region"
            onFocus={focusIndustries}
        >
            {/* Кружок над заголовком: сюда прилетает фото первого экрана и превращается в число работ */}
            {!reduceMotion && (
                <div ref={slot} className={s.slot} aria-hidden="true">
                    <motion.div className={s.mark} style={{ opacity: markOpacity, scale: markScale, y: diskY }}>
                        <motion.span className={s.works} style={{ scale: pulseScale }}>
                            <b className={ralewayBold.className}>{worksCount}</b>
                            {/* «проекты» – как в заголовке кейсов и строке доверия (DESIGN_FIXES_6_PLAN Д33, выбор владельца) */}
                            <span>{plural(worksCount, ['проект', 'проекта', 'проектов'])}</span>
                        </motion.span>
                    </motion.div>
                </div>
            )}

            <motion.div
                className={s.content}
                style={reduceMotion ? undefined : { opacity: contentOpacity, scale: contentScale, y: contentY }}
            >
                <motion.div
                    ref={lead}
                    className={s.lead}
                    style={reduceMotion ? undefined : { clipPath: leadClip, opacity: leadOpacity }}
                >
                    <h2 id="industries-title" className={`${ralewayBold.className} ${s.title}`}>{industriesTitle}</h2>
                    <p className={s.description}>{industriesDescription}</p>
                </motion.div>

                <ul className={s.chips}>
                    {chips.map((chip, i) => reduceMotion ? (
                        <li key={chip.id} className={s.chipItem}>{chipLink(chip)}</li>
                    ) : (
                        <ScrubChip key={chip.id} time={burstTime} geom={geomOf(i)} itemRef={(el) => { chipEls.current[i] = el }} fill={chipFace(chip)}>
                            {chipLink(chip)}
                        </ScrubChip>
                    ))}
                </ul>

                {/* Чипы – только примеры: клиент из другой сферы идёт сразу в форму */}
                <motion.p className={s.other} style={reduceMotion ? undefined : { opacity: otherOpacity, y: otherY }}>
                    <b className={ralewayBold.className}>{industriesOtherQuestion}</b>{' '}
                    {industriesOther}{' '}
                    <ContactLink
                        className={s.otherLink}
                        data-goal="cta_click"
                        data-goal-id="industries_other"
                    >
                        {formButton}
                    </ContactLink>
                </motion.p>
            </motion.div>
        </div>
    );

    // «Уменьшить движение»: без липкой сцены, первый экран, отрасли и кейсы просто идут друг за другом
    if (reduceMotion) {
        return (
            <>
                <section className={s.static} aria-labelledby="hero-title">
                    <Image className={s.photo} src={photo} alt="Степан Картузов" priority />
                    <div className={`${ralewayRegular.className} ${s.card} ${s.cardStatic}`}>
                        <HeroSlides slides={heroSlides} titleSlide={heroTitleSlide} interval={heroInterval} />
                        {cta}
                    </div>
                    {industries}
                </section>
                {children}
            </>
        );
    }

    return (
        <>
            <section
                ref={scene}
                className={s.scene}
                style={{
                    '--scene-h-desktop': `calc(var(--screen-h) + ${DESKTOP_DEFAULT.length * 100}vh)`,
                    '--scene-h-phone': `calc(var(--screen-h) + ${PHONE_DEFAULT.length * 100}vh)`,
                    ...(measured ? { '--scene-h': `calc(var(--screen-h) + ${tm.length * 100}vh)` } : {}),
                } as CSSProperties}
                aria-labelledby="hero-title"
                // Время сцены на этом экране – для e2e (tests/home.spec.ts: доли пути этапов)
                data-timing={JSON.stringify(tm)}
            >
                <motion.div
                    ref={screen}
                    className={`${s.screen} ${portalState === 'open' ? s.passThrough : ''}`}
                    style={{ maskImage: holeMask, WebkitMaskImage: holeMask }}
                >
                    <motion.div className={s.base} style={{ opacity: baseOpacity }} aria-hidden="true" />
                    <motion.div
                        className={s.bg}
                        style={{ top: bgTop, right: bgRight, bottom: bgBottom, left: bgLeft, borderRadius: radius }}
                        aria-hidden="true"
                    />

                    <div className={s.hero}>
                        <div ref={photoBox} className={s.photoBox}>
                            <motion.div style={{ x: towardX, y: towardY, scale: towardScale, opacity: photoOpacity }}>
                                <Image className={s.photo} src={photo} alt="Степан Картузов" priority />
                            </motion.div>
                        </div>

                        <div ref={card} className={`${ralewayRegular.className} ${s.card}`} onFocus={focusHero}>
                            <motion.div style={{ y: slidesY }}>
                                <motion.div style={{ opacity: slidesOpacity }}>
                                    <HeroSlides slides={heroSlides} titleSlide={heroTitleSlide} interval={heroInterval} />
                                </motion.div>
                                <motion.div style={{ opacity: ctaOpacity }}>{cta}</motion.div>
                            </motion.div>
                        </div>
                    </div>

                    <div className={`${s.layer} ${live ? s.layerShown : ''}`}>
                        {/* Диск портала: под кружком «10 работ», над отраслями */}
                        <motion.div className={s.disk} style={{ background: diskBg, opacity: ringOpacity }} aria-hidden="true" />
                        {industries}
                    </div>
                </motion.div>

                {/* Путь анимации – сцена без запаса липкости: от него меряется прогресс */}
                <div ref={path} className={s.path} aria-hidden="true" />
            </section>

            {/* Кейсы прилипают к экрану на время портала и отпускаются в конце пути сцены: --exit – путь портала.
                Липкость нативная, поэтому за скроллом блок не дёргается; сам он не масштабируется и не сдвигается.
                До начала портала он прозрачен: иначе просвечивает под первым экраном */}
            <div
                ref={nextTrack}
                className={`${s.nextTrack} ${portalState === 'off' ? s.nextHidden : ''}`}
                style={{
                    '--exit-desktop': `${DESKTOP_DEFAULT.portal * 100}vh`,
                    '--exit-phone': `${PHONE_DEFAULT.portal * 100}vh`,
                    ...(measured ? { '--exit': `${tm.portal * 100}vh` } : {}),
                    '--next-top': `${nextTop}px`,
                } as CSSProperties}
                onFocus={focusCases}
            >
                <div ref={nextEl} className={s.next}>
                    <SceneAfterContext.Provider value={afterOn ? smoothAfter : null}>
                        {children}
                    </SceneAfterContext.Provider>
                </div>
                <div ref={afterEl} className={s.after} style={{ height: `${tm.after * 100}vh` }} aria-hidden="true" />
            </div>
        </>
    );
}

export default HeroExpand
