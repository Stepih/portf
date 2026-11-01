"use client";

import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, MotionValue, motionValue, useScroll, useSpring, useTransform } from "framer-motion";

import f from '@/app/(home)/components/faq/Faq.module.scss'
import q from '@/app/ai/components/sections/AiFaq.module.scss'
import s from './SitesFaq.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { easeOut, move, span, SMOOTH } from "@/app/ai/components/scene";
import { faq, faqId, sections } from "@/data/sitesPage";
import Scene from "./scenes/Scene";
import { ASK_SHIFT, faqTimes, IFaqTimes, W } from "./scenes/times";

// Как движется вопрос: scene – по времени липкого экрана, scroll – по своему скроллу (как FAQ на /ai, когда экран не
// вмещает список), still – без движения
type Mode = 'scene' | 'scroll' | 'still';

// Запас по высоте экрана под самый длинный ответ (раскрыт один – общий name) и поля кадра сцены (Scenes.module.scss)
const RESERVE = 40;
const FRAME_PAD = 108;
// По своему скроллу – как на /ai: пузырь едет 0,7 пути от низа экрана до 0,55 его высоты
const SCROLL_ASK: W = [0, .7];
const SCROLL_MELT: W = [.6, .35];
const k = (v: number, [a, d]: W) => span(v, a, d);

interface IQuestion {
    time: MotionValue<number>,
    mode: Mode,
    ask: W,
    melt: W,
    question: string,
    answer: string,
    open: boolean,
    // Общее имя – раскрыт один вопрос: на липком экране список не перерастает экран
    name?: string
}

// Вопрос приходит, как реплика клиента в чате: тёмный пузырь въезжает справа с наклоном, распрямляется и тает в строку
const Question: FC<IQuestion> = ({ time, mode, ask, melt, question, answer, open, name }) => {
    const ref = useRef<HTMLDetailsElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.55'] });
    const own = useSpring(scrollYProgress, SMOOTH);
    const scroll = mode === 'scroll';
    const progress = scroll ? own : time;
    const a = scroll ? SCROLL_ASK : ask;
    const m = scroll ? SCROLL_MELT : melt;
    const x = useTransform(progress, (v) => `${(1 - move(k(v, a))) * ASK_SHIFT * 100}%`);
    const rotate = useTransform(progress, (v) => (1 - move(k(v, a))) * 2);
    const opacity = useTransform(progress, (v) => span(v, a[0], a[1] * .3));
    const bubble = useTransform(progress, (v) => 1 - easeOut(k(v, m)));
    const color = useTransform(bubble, (b) => b > .5 ? 'var(--color-bg)' : 'var(--color-text-100)');
    const animated = mode !== 'still';

    return (
        <motion.details ref={ref} className={`${f.item} ${q.item}`} open={open} name={name} style={animated ? { x, rotate, opacity } : undefined}>
            <summary className={`${ralewayBold.className} ${f.question} ${q.question}`}>
                {animated && <motion.span className={q.bubble} style={{ opacity: bubble }} aria-hidden="true" />}
                <motion.span className={q.text} style={animated ? { color } : undefined}>{question}</motion.span>
            </summary>
            <p className={f.answer}>{answer}</p>
        </motion.details>
    );
};

interface IBody {
    time: MotionValue<number>,
    mode: Mode,
    t: IFaqTimes,
    // Обёртка заголовка и списка – по ней меряется, вмещается ли список в экран, и ширина пути пузыря
    bodyRef: (el: HTMLDivElement | null) => void
}

const FaqBody: FC<IBody> = ({ time, mode, t, bodyRef }) => {
    const sticky = mode === 'scene';
    const headOn = useTransform(time, (v) => easeOut(span(v, t.head, .1)));
    // Нижняя линия списка – с последним вопросом
    const last = t.ask[t.ask.length - 1];
    const bottom = useTransform(time, (v) => `rgba(128, 128, 128, ${(.45 * span(v, last[0], last[1] * .3)).toFixed(3)})`);

    return (
        <div ref={bodyRef} className={`${ralewayRegular.className} ${f.faq} ${s.body} ${sticky ? s.compact : ''}`}>
            <motion.div className={s.head} style={sticky ? { opacity: headOn } : undefined}>
                <h2 id={`${faqId}-title`} className={`${ralewayBold.className} ${f.title}`}>{sections.faq.title}</h2>
                <p className={f.description} data-goal-place="sites_faq">
                    {sections.faq.text}{' '}
                    <ContactLink className={f.link}>{sections.faq.link}</ContactLink>
                </p>
            </motion.div>

            <motion.div
                className={`${f.list} ${q.list}`}
                // Вопрос въезжает справа из-за края: список по ширине обрезает его, иначе у страницы прокрутка вбок
                style={mode === 'still' ? undefined : { overflowX: 'clip', ...(sticky ? { borderBottomColor: bottom } : {}) }}
            >
                {faq.map((item, i) => (
                    <Question
                        key={item.question}
                        time={time}
                        mode={mode}
                        ask={t.ask[i]}
                        melt={t.melt[i]}
                        question={item.question}
                        answer={item.answer}
                        open={i === 0}
                        name={sticky ? faqId : undefined}
                    />
                ))}
            </motion.div>
        </div>
    );
};

// Время для режима «по своему скроллу» не нужно – вопросы берут свой прогресс
const IDLE = motionValue(0);

// «Что спрашивают перед заказом» (SERVICES_PLAN У5б, этап 3: условия – в FAQ). Липкий экран, как остальные сцены:
// вопросы приходят по одному, как реплики клиента в FAQ /ai; раскрыт один вопрос (общий name у <details>), чтобы
// список не перерастал экран. Если экран не вмещает список (телефон, низкое окно) – обычный раздел, вопрос въезжает
// по своему скроллу, как FAQ /ai на телефоне. Без движения – обычный аккордеон, первый вопрос раскрыт
const SitesFaq: FC = () => {
    const reduceMotion = usePrefersReducedMotion();
    const [fits, setFits] = useState(true);
    const [size, setSize] = useState({ w: 820, h: 900 });
    const [body, setBody] = useState<HTMLDivElement | null>(null);
    const t = useMemo(() => faqTimes(faq.length, size.w, size.h), [size]);

    // Замер: ширина списка (путь пузыря) и вмещается ли раздел в экран. Сцена → обычный раздел только в одну сторону,
    // заново – когда меняется ширина окна (высота на телефоне скачет вместе с адресной строкой)
    useLayoutEffect(() => {
        if (!body) return;
        const measure = () => {
            const h = window.innerHeight;
            setSize((prev) => prev.w === body.offsetWidth && prev.h === h ? prev : { w: body.offsetWidth, h });
            // Меряем в исходном виде (раскрыт первый): посетитель раскрыл другой вопрос – раздел не перестраиваем
            const open = body.querySelectorAll('details[open]');
            const initial = open.length === 1 && open[0] === body.querySelector('details');
            if (fits && initial && body.offsetHeight + RESERVE + FRAME_PAD > h) setFits(false);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(body);
        return () => observer.disconnect();
    }, [body, fits]);
    useEffect(() => {
        let width = window.innerWidth;
        const onResize = () => {
            if (window.innerWidth === width) return;
            width = window.innerWidth;
            setFits(true);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (!reduceMotion && !fits) {
        return (
            <section id={faqId} className={s.flat} aria-labelledby={`${faqId}-title`}>
                <FaqBody time={IDLE} mode="scroll" t={t} bodyRef={setBody} />
            </section>
        );
    }

    return (
        <Scene id={faqId} labelledBy={`${faqId}-title`} len={t.path}>
            {(time, mode) => <FaqBody time={time} mode={mode.sticky ? 'scene' : 'still'} t={t} bodyRef={setBody} />}
        </Scene>
    );
};

export default SitesFaq;
