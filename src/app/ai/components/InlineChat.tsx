"use client"

import { FC, FormEventHandler, KeyboardEventHandler, ReactNode, RefObject, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useTransform } from "framer-motion";

import c from '@/app/(home)/components/chat/Chat.module.scss'
import s from './InlineChat.module.scss'
import ChatLeadForm from "@/app/(home)/components/chat/ChatLeadForm";
import { useChatDialog } from "@/app/(home)/components/chat/ChatProvider";
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { chatGreeting, chatLeadOpen, chatLeadSuccess, chatLimitText, chatPlaceholder, chatSend, chatStarters, chatStartersLabel, chatSubtitle, chatTitle } from "@/data/chat";
import { formButton } from "@/data/inputsFeedBack";
import { CHAT_LIMITS } from "@/lib/chat/request";
import { HONEYPOT_FIELD } from "@/lib/validation/feedback";
import { chatQuestions } from "@/scripts/chat";
import { drop, easeOut, move, offsetIn, span } from "./scene";

// Шкала появления (intro, 0–1): приветствие, капли готовых вопросов из шара в шапке, поле ввода снизу.
// Капли – как брызги отраслей на главной: тёмная точка летит по дуге, растекается в таблетку и растворяется в кнопку
// Единая скорость (speed.ts): капли летят половину появления (ChatWorkScene считает его длину от пути капли)
const dropFrom = (i: number) => .15 + i * .05;
const FLIGHT = .5;
const SPREAD = .12;
const FADE = .1;
const DROP = 10;
const LIFT = 36;

// Готовый вопрос относительно шара в шапке: сдвиг от центра кнопки до центра шара и коробка кнопки в панели
interface IDropGeom {
    dx: number,
    dy: number,
    x: number,
    y: number,
    w: number,
    h: number
}

const Drop: FC<{ intro: MotionValue<number>, i: number, geom: IDropGeom }> = ({ intro, i, geom }) => {
    const d = dropFrom(i);
    const x = useTransform(intro, (v) => geom.dx * (1 - move(span(v, d, FLIGHT))));
    // По дуге: подскакивает на LIFT и падает на место
    const y = useTransform(intro, (v) => {
        const f = span(v, d, FLIGHT);
        return geom.dy * (1 - drop(f)) - LIFT * Math.sin(Math.PI * f);
    });
    const clipPath = useTransform(intro, (v) => {
        const k = move(span(v, d + FLIGHT - .02, SPREAD));
        return `inset(${(geom.h - DROP) / 2 * (1 - k)}px ${(geom.w - DROP) / 2 * (1 - k)}px round 24px)`;
    });
    const opacity = useTransform(intro, (v) => v < d ? 0 : 1 - span(v, d + FLIGHT + SPREAD, FADE));

    return (
        <motion.span
            className={s.drop}
            style={{ left: geom.x, top: geom.y, width: geom.w, height: geom.h, x, y, clipPath, opacity }}
        />
    );
};

// Кнопка проступает под каплей, до того как та растворится
const Face: FC<{ intro: MotionValue<number>, i: number, itemRef: (el: HTMLSpanElement | null) => void, children: ReactNode }> = ({ intro, i, itemRef, children }) => {
    const opacity = useTransform(intro, (v) => easeOut(span(v, dropFrom(i) + FLIGHT + .02, .12)));
    return <motion.span ref={itemRef} className={s.face} style={{ opacity }}>{children}</motion.span>;
};

interface IInlineChat {
    className?: string,
    // Без своего фона и тени: их рисует сцена (вариант A – фон растёт из шара)
    bare?: boolean,
    // Появление 0–1; нет – всё на месте сразу
    intro?: MotionValue<number>,
    // Шар в шапке: сцена меряет его, чтобы посадить туда свет большого шара
    orbRef?: RefObject<HTMLSpanElement | null>,
    orbOpacity?: MotionValue<number>,
    // Панель ещё не раскрыта: кнопки и поле вне порядка Tab и не кликаются
    inert?: boolean,
    // Первое касание чата: фокус внутри панели
    onInteract?: () => void,
    // Фокус ушёл из панели
    onLeave?: () => void,
    // Прятать шар в углу, пока панель на экране; false – шаром управляет сцена (вариант C)
    manageFab?: boolean
}

// Демо-чат прямо на странице (SERVICES_PLAN У4, черновик): тот же диалог, что в окне из шара в углу (ChatProvider).
// Разметка и стили – как в ChatWindow, без затемнения, закрытия и блокировки скролла. При переносе на /ai общее
// с ChatWindow вынести в один компонент
const InlineChat: FC<IInlineChat> = ({ className, bare, intro, orbRef, orbOpacity, inert, onInteract, onLeave, manageFab = true }) => {
    const { chat, tgButton, setInlineShown } = useChatDialog();
    const { items, loading, limit, ask, addNote } = chat;
    const [question, setQuestion] = useState('');
    const [leadOpen, setLeadOpen] = useState(false);
    const [leadSent, setLeadSent] = useState(false);
    const titleId = useId();
    const root = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const honeypotRef = useRef<HTMLInputElement>(null);
    const ownOrb = useRef<HTMLSpanElement>(null);
    const orb = orbRef ?? ownOrb;
    const starterEls = useRef<(HTMLSpanElement | null)[]>([]);
    const [geoms, setGeoms] = useState<IDropGeom[]>([]);

    const still = useMotionValue(1);
    const t = intro ?? still;
    const headOpacity = useTransform(t, (v) => easeOut(span(v, 0, .2)));
    const listOpacity = useTransform(t, (v) => easeOut(span(v, .04, .22)));
    const listY = useTransform(t, (v) => 14 * (1 - easeOut(span(v, .04, .22))));
    const inputY = useTransform(t, (v) => `${(1 - easeOut(span(v, .5, .35))) * 100}%`);

    // Пока чат на экране, шар в углу не нужен: второй вход в тот же диалог
    useEffect(() => {
        const el = root.current;
        if (!el || !manageFab) return;
        const observer = new IntersectionObserver(([entry]) => setInlineShown(entry.isIntersecting), { threshold: .3 });
        observer.observe(el);
        return () => {
            observer.disconnect();
            setInlineShown(false);
        };
    }, [setInlineShown, manageFab]);

    // Новая реплика или кусок ответа – прокрутка списка вниз (сама страница не двигается)
    useEffect(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [items, loading, limit, leadOpen]);

    const questions = chatQuestions(items);
    const waiting = loading && items[items.length - 1]?.role === 'user';
    const showActions = !loading && !leadOpen && (questions.length > 0 || limit !== null);
    const showStarters = !loading && !leadOpen && !limit && questions.length === 0;

    // Капли: где готовые вопросы относительно шара в шапке. offsetLeft/Top не видят transform
    useLayoutEffect(() => {
        if (!intro || !root.current) return;
        const measure = () => {
            const r = root.current;
            const o = orb.current;
            if (!r || !o) return;
            const p = offsetIn(o, r);
            const ox = p.x + o.offsetWidth / 2;
            const oy = p.y + o.offsetHeight / 2;
            setGeoms(starterEls.current.map((el) => {
                if (!el) return { dx: 0, dy: 0, x: 0, y: 0, w: 0, h: 0 };
                const b = offsetIn(el, r);
                return {
                    dx: ox - (b.x + el.offsetWidth / 2),
                    dy: oy - (b.y + el.offsetHeight / 2),
                    x: b.x,
                    y: b.y,
                    w: el.offsetWidth,
                    h: el.offsetHeight,
                };
            }));
        };
        measure();
        document.fonts?.ready.then(measure);
        const observer = new ResizeObserver(measure);
        observer.observe(root.current);
        return () => observer.disconnect();
    }, [intro, orb, showStarters]);

    const send = () => {
        if (!question.trim() || loading) return;
        ask(question, honeypotRef.current?.value);
        setQuestion('');
    };

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        send();
    };

    // Enter – отправить, Shift+Enter – новая строка
    const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    };

    return (
        // ym-hide-content: Вебвизор не записывает вопросы и контакты (SALES_PLAN 6.2)
        <div
            ref={root}
            className={`${ralewayRegular.className} ${s.panel} ${bare ? s.bare : ''} ${className ?? ''} ym-hide-content`}
            role="region"
            aria-labelledby={titleId}
            data-goal-place="chat-inline"
            inert={inert}
            onFocus={onInteract}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onLeave?.();
            }}
        >
            <motion.div className={c.head} style={{ opacity: headOpacity }}>
                <motion.span ref={orb} className={`${c.orb} ${s.headOrb}`} style={{ opacity: orbOpacity }} aria-hidden="true" />
                <div className={c.headText}>
                    <h2 id={titleId} className={`${ralewayBold.className} ${c.title}`}>{chatTitle}</h2>
                    <p className={c.subtitle}>{chatSubtitle}</p>
                </div>
                {!leadSent && (
                    <button
                        type="button"
                        className={`${ralewayBold.className} ${c.headLead} ${leadOpen ? c.headLeadIdle : ''}`}
                        onClick={() => setLeadOpen(true)}
                    >
                        {chatLeadOpen}
                    </button>
                )}
            </motion.div>

            {/* aria-busy: пока ответ дописывается, скринридер не читает его по кускам */}
            <motion.div
                className={`${c.messages} ${s.messages}`}
                ref={listRef}
                aria-live="polite"
                aria-busy={loading}
            >
                <motion.p className={`${c.bubble} ${c.assistant}`} style={{ opacity: listOpacity, y: listY }}>{chatGreeting}</motion.p>
                {showStarters && (
                    <div className={c.starters} role="group" aria-label={chatStartersLabel}>
                        {chatStarters.map((starter, i) => (
                            <Face key={starter} intro={t} i={i} itemRef={(el) => { starterEls.current[i] = el }}>
                                <button
                                    type="button"
                                    className={c.starter}
                                    onClick={() => ask(starter, honeypotRef.current?.value)}
                                >
                                    {starter}
                                </button>
                            </Face>
                        ))}
                    </div>
                )}
                {items.map((item) => (
                    <p
                        key={item.id}
                        className={`${c.bubble} ${item.role === 'user' ? c.user : c.assistant} ${item.note ? c.note : ''} ${item.failed ? c.failed : ''}`}
                    >
                        {item.content}
                    </p>
                ))}
                {waiting && (
                    <p className={`${c.bubble} ${c.assistant} ${c.typing}`} aria-label="Ассистент печатает">
                        <span /><span /><span />
                    </p>
                )}
                {limit && <p className={`${c.bubble} ${c.assistant} ${c.note}`}>{chatLimitText[limit]}</p>}

                {showActions && (
                    <div className={c.actions}>
                        {!leadSent && (
                            <button type="button" className={`${ralewayBold.className} ${c.primary}`} onClick={() => setLeadOpen(true)}>
                                {formButton}
                            </button>
                        )}
                        <a className={c.secondary} href={tgButton.href} target="_blank" rel="noopener noreferrer">
                            {tgButton.title}
                        </a>
                    </div>
                )}
            </motion.div>

            {leadOpen ? (
                <ChatLeadForm
                    questions={questions}
                    onBack={() => setLeadOpen(false)}
                    onSent={() => {
                        setLeadOpen(false);
                        setLeadSent(true);
                        addNote(chatLeadSuccess);
                    }}
                />
            ) : !limit && (
                <motion.form className={c.input} onSubmit={onSubmit} style={{ y: inputY }}>
                    <textarea
                        className={c.textarea}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={chatPlaceholder}
                        maxLength={CHAT_LIMITS.question}
                        rows={1}
                        aria-label={chatPlaceholder}
                    />
                    {/* Ловушка для ботов: человек поле не видит */}
                    <input ref={honeypotRef} className={c.honeypot} name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true" />
                    <button type="submit" className={c.send} disabled={loading || !question.trim()} aria-label={chatSend}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                    </button>
                </motion.form>
            )}

            {/* Капли летят поверх списка: внутри него их обрезала бы прокрутка */}
            {intro && showStarters && (
                <div className={s.drops} aria-hidden="true">
                    {geoms.map((geom, i) => <Drop key={i} intro={t} i={i} geom={geom} />)}
                </div>
            )}
        </div>
    )
}

export default InlineChat
