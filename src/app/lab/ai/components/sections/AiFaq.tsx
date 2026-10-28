"use client";

import { FC, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import f from '@/app/(home)/components/faq/Faq.module.scss'
import q from './AiFaq.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { easeOut, easeOutBack, span, SMOOTH } from "../scene";
import { faq, sections } from "../../placeholders";

// Вопрос приходит, как сообщение в чат: таблетка въезжает справа с наклоном, распрямляется и раскрывается в строку
const Question: FC<{ question: string, answer: string, open: boolean }> = ({ question, answer, open }) => {
    const reduceMotion = usePrefersReducedMotion();
    const ref = useRef<HTMLDetailsElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.7'] });
    const p = useSpring(scrollYProgress, SMOOTH);
    const x = useTransform(p, (v) => `${(1 - easeOutBack(span(v, 0, .7))) * 45}%`);
    const rotate = useTransform(p, (v) => (1 - easeOutBack(span(v, 0, .7))) * 4);
    const opacity = useTransform(p, (v) => span(v, 0, .3));
    // В пути вопрос – тёмный пузырь реплики, на месте пузырь тает в строку
    const bubble = useTransform(p, (v) => 1 - easeOut(span(v, .6, .35)));
    const color = useTransform(bubble, (b) => b > .5 ? 'var(--color-bg)' : 'var(--color-text-100)');

    return (
        <motion.details
            ref={ref}
            className={`${f.item} ${q.item}`}
            open={open}
            style={reduceMotion ? undefined : { x, rotate, opacity }}
        >
            <summary className={`${ralewayBold.className} ${f.question} ${q.question}`}>
                {!reduceMotion && <motion.span className={q.bubble} style={{ opacity: bubble }} aria-hidden="true" />}
                <motion.span className={q.text} style={reduceMotion ? undefined : { color }}>{question}</motion.span>
            </summary>
            <p className={f.answer}>{answer}</p>
        </motion.details>
    );
};

// Вопросы перед заказом – тот же аккордеон на <details>, что FAQ главной (Faq.module.scss), первый раскрыт.
// Вопросы приходят по очереди справа, как сообщения клиента в чате
const AiFaq: FC = () => (
    <section className={`${ralewayRegular.className} ${f.faq}`} aria-labelledby="ai-faq-title">
        <h2 id="ai-faq-title" className={`${ralewayBold.className} ${f.title}`}>{sections.faq.title}</h2>
        <p className={f.description}>{sections.faq.text}</p>

        <div className={`${f.list} ${q.list}`}>
            {faq.map((item, i) => (
                <Question key={item.question} question={item.question} answer={item.answer} open={i === 0} />
            ))}
        </div>
    </section>
);

export default AiFaq;
