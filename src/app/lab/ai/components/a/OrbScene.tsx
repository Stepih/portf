"use client";

import { CSSProperties, FC, useCallback, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";

import sc from '../scene.module.scss'
import s from './OrbScene.module.scss'
import OrbStar from "@/app/(home)/components/chat/OrbStar";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { ralewayBold } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { isTouchDevice } from "@/scripts/typeDevice";
import InlineChat from "../InlineChat";
import { ease, easeOut, lerp, offsetIn, span, useStickyScene } from "../scene";
import { ph } from "../../placeholders";

// Путь сцены в экранах (компьютер и телефон) – раскрытие шара короче портала главной: это вход в страницу, а не её смысл
const PATH = 1.25;
const PATH_PHONE = 1;

// Точки сцены в долях пути: заголовок уходит вверх, фон шара растёт в плашку, свет летит в шар шапки чата,
// чат проявляется (капли готовых вопросов), подпись над ним
const INTRO_OUT = [.04, .3];
const GROW = [.12, .6];
const GLASS_OUT = [.32, .58];
const LIGHT = [.2, .6];
const HANDOVER = [.58, .64];
const CHAT_IN = [.5, .95];
const CAPTION_IN = [.72, .9];
// С этой доли чат принимает клики и фокус
const OPEN_AT = .85;

const k = (v: number, [from, to]: number[]) => span(v, from, to - from);

// Коробка в координатах экрана сцены
interface IBox { x: number, y: number, w: number, h: number }
const noBox: IBox = { x: 0, y: 0, w: 0, h: 0 };

// Вариант A, первый экран /ai (SERVICES_PLAN У4, черновик): шар демо-чата в центре, как в правом нижнем углу, только большой.
// Скролл раздувает его стекло в плашку (круг → карточка, как фото → кружок на главной), свет шара улетает в малый шар
// шапки чата, готовые вопросы вылетают из него каплями – и на экране живой чат. Клик по шару проигрывает сцену сам.
// Скролл назад собирает чат обратно в шар; на тач-экране после первого касания чата сцена больше не сворачивается
// (клавиатура двигает страницу)
const OrbScene: FC = () => {
    const reduceMotion = usePrefersReducedMotion();

    const scene = useRef<HTMLElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const slot = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const headOrb = useRef<HTMLSpanElement>(null);

    const [slotBox, setSlotBox] = useState<IBox>(noBox);
    const [panelBox, setPanelBox] = useState<IBox>(noBox);
    // Свет шара: куда лететь (центр шара шапки) и во сколько раз уменьшиться
    const [light, setLight] = useState({ dx: 0, dy: 0, scale: 1 });
    const [open, setOpen] = useState(false);
    const [atRest, setAtRest] = useState(true);

    const onMeasure = useCallback(() => {
        const root = stage.current;
        if (!root || !slot.current || !panel.current || !headOrb.current) return;
        const so = offsetIn(slot.current, root);
        const sb = { x: so.x, y: so.y, w: slot.current.offsetWidth, h: slot.current.offsetHeight };
        const po = offsetIn(panel.current, root);
        const pb = { x: po.x, y: po.y, w: panel.current.offsetWidth, h: panel.current.offsetHeight };
        const ho = offsetIn(headOrb.current, root);
        const hw = headOrb.current.offsetWidth;
        setSlotBox(sb);
        setPanelBox(pb);
        setLight({
            dx: ho.x + hw / 2 - (sb.x + sb.w / 2),
            dy: ho.y + hw / 2 - (sb.y + sb.h / 2),
            scale: hw / sb.w,
        });
    }, []);

    const { progress, scrollToProgress } = useStickyScene({ scene, path, screen }, onMeasure);

    // Тач-экран: после касания чата сцена стоит раскрытой
    const lock = useMotionValue(0);
    const p = useTransform([progress, lock], ([v, l]: number[]) => l ? 1 : v);
    const onInteract = () => {
        if (isTouchDevice()) lock.set(1);
    };

    useMotionValueEvent(p, 'change', (v) => {
        setOpen(v >= OPEN_AT);
        setAtRest(v < .01);
    });

    const introOpacity = useTransform(p, (v) => 1 - easeOut(k(v, INTRO_OUT)));
    const introY = useTransform(p, (v) => -70 * ease(k(v, INTRO_OUT)));
    const ctaOpacity = useTransform(p, (v) => 1 - k(v, [.02, .16]));

    // Фон-оболочка: края от кружка шара до плашки чата, скругление от круга до 13px
    const grow = useTransform(p, (v) => ease(k(v, GROW)));
    const shellTop = useTransform(grow, (g) => lerp(slotBox.y, panelBox.y, g));
    const shellLeft = useTransform(grow, (g) => lerp(slotBox.x, panelBox.x, g));
    const shellW = useTransform(grow, (g) => lerp(slotBox.w, panelBox.w, g));
    const shellH = useTransform(grow, (g) => lerp(slotBox.h, panelBox.h, g));
    const shellRadius = useTransform(grow, (g) => lerp(slotBox.w / 2, 13, g));
    const glassOpacity = useTransform(p, (v) => 1 - k(v, GLASS_OUT));

    // Содержимое чата обрезано по оболочке, пока она растёт
    const clipPath = useTransform(grow, (g) => {
        const top = lerp(slotBox.y, panelBox.y, g) - panelBox.y;
        const left = lerp(slotBox.x, panelBox.x, g) - panelBox.x;
        const w = lerp(slotBox.w, panelBox.w, g);
        const h = lerp(slotBox.h, panelBox.h, g);
        const r = lerp(slotBox.w / 2, 13, g);
        return `inset(${top}px ${panelBox.w - left - w}px ${panelBox.h - top - h}px ${left}px round ${r}px)`;
    });

    // Свет большого шара летит в шар шапки и уменьшается до его света; звезда гаснет по дороге
    const fly = useTransform(p, (v) => ease(k(v, LIGHT)));
    const lightX = useTransform(fly, (f) => light.dx * f);
    const lightY = useTransform(fly, (f) => light.dy * f);
    const lightScale = useTransform(fly, (f) => lerp(1, light.scale, f));
    const lightOpacity = useTransform(p, (v) => 1 - k(v, HANDOVER));
    const starOpacity = useTransform(p, (v) => 1 - k(v, [.16, .34]));
    const headOrbOpacity = useTransform(p, (v) => k(v, HANDOVER));

    const intro = useTransform(p, (v) => k(v, CHAT_IN));
    const captionOpacity = useTransform(p, (v) => easeOut(k(v, CAPTION_IN)));
    const captionY = useTransform(p, (v) => 12 * (1 - easeOut(k(v, CAPTION_IN))));

    const heading = (
        <>
            <p className={s.crumbs}>{ph.crumbs}</p>
            <h1 id="ai-title" className={`${ralewayBold.className} ${s.title}`}>{ph.title}</h1>
            <p className={s.lead}>{ph.lead}</p>
        </>
    );

    // «Уменьшить движение»: заголовок, под ним чат в потоке страницы
    if (reduceMotion) {
        return (
            <section className={s.static} aria-labelledby="ai-title">
                <div className={s.staticHead}>
                    {heading}
                    <ContactLink className={`${ralewayBold.className} ${s.cta}`}>{ph.cta}</ContactLink>
                </div>
                <p className={s.caption}>{ph.chatCaption}</p>
                <div className={s.staticPanel}><InlineChat /></div>
            </section>
        );
    }

    return (
        <section
            ref={scene}
            className={`${sc.scene} ${s.scene}`}
            style={{
                '--scene-h': `calc(var(--screen-h) + ${PATH * 100}vh)`,
                '--scene-h-phone': `calc(var(--screen-h) + ${PATH_PHONE * 100}vh)`,
            } as CSSProperties}
            aria-labelledby="ai-title"
        >
            <div ref={screen} className={sc.screen}>
                <div ref={stage} className={s.stage}>
                    {/* Стекло шара → плашка чата. Цвет стекла гаснет, под ним – цвет фона, как у окна чата */}
                    <motion.div
                        className={`${s.shell} ${atRest ? s.breathe : ''}`}
                        style={{ top: shellTop, left: shellLeft, width: shellW, height: shellH, borderRadius: shellRadius }}
                        aria-hidden="true"
                    >
                        <motion.span className={s.glass} style={{ opacity: glassOpacity }} />
                    </motion.div>

                    <div className={s.introLayer}>
                        <motion.div className={s.intro} style={{ opacity: introOpacity, y: introY }}>
                            {heading}
                        </motion.div>

                        {/* Место шара в покое. Кнопка поверх – открыть чат без скролла: сцена проиграется сама */}
                        <div ref={slot} className={s.slot}>
                            {atRest && (
                                <button type="button" className={s.orbButton} onClick={() => scrollToProgress(1)} aria-label={ph.orbLabel} />
                            )}
                        </div>

                        <motion.div className={s.ctaRow} style={{ opacity: ctaOpacity }}>
                            <ContactLink className={`${ralewayBold.className} ${s.cta}`} tabIndex={atRest ? undefined : -1}>{ph.cta}</ContactLink>
                            <p className={s.hint}>{ph.orbHint}</p>
                        </motion.div>
                    </div>

                    {/* Свет и звезда большого шара: от его центра – в шар шапки чата */}
                    <motion.div
                        className={`${s.lightBox} ${atRest ? s.breathe : ''}`}
                        style={{ left: slotBox.x + slotBox.w / 2, top: slotBox.y + slotBox.h / 2, width: slotBox.w, height: slotBox.w, x: lightX, y: lightY, scale: lightScale, opacity: lightOpacity }}
                        aria-hidden="true"
                    >
                        <span className={s.light} />
                        <motion.span className={s.star} style={{ opacity: starOpacity }}>
                            <OrbStar className={s.starIcon} />
                        </motion.span>
                    </motion.div>

                    <div className={s.chatLayer}>
                        <motion.p className={s.caption} style={{ opacity: captionOpacity, y: captionY }}>{ph.chatCaption}</motion.p>
                        <motion.div ref={panel} className={s.panel} style={{ clipPath }}>
                            <InlineChat
                                bare
                                intro={intro}
                                orbRef={headOrb}
                                orbOpacity={headOrbOpacity}
                                inert={!open}
                                onInteract={onInteract}
                            />
                        </motion.div>
                    </div>
                </div>
            </div>

            <div ref={path} className={sc.path} aria-hidden="true" />
        </section>
    );
};

export default OrbScene;
