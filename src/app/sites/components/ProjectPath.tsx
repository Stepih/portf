"use client";

import { FC, useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

import s from './ProjectPath.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { SMOOTH } from "@/app/ai/components/scene";
import { projectPath } from "@/data/sitesPage";

// Путь проекта (У5а, владелец: «путь + сетка»): шаги на вертикальной линии, линия наливается чернилами по скроллу –
// от первого шага, когда он поднялся выше 60% окна, до последнего. «0 ₽» – скобкой в поле слева от бесплатных шагов
const ProjectPath: FC = () => {
    const list = useRef<HTMLOListElement>(null);
    const reduceMotion = usePrefersReducedMotion();
    const { scrollYProgress } = useScroll({ target: list, offset: ['start 60%', 'end 60%'] });
    const fill = useSpring(scrollYProgress, SMOOTH);

    return (
        <div className={s.path}>
            <h3 className={`${ralewayBold.className} ${s.title}`}>{projectPath.title}</h3>
            <div className={s.steps}>
                <span className={s.track} aria-hidden="true">
                    <motion.span className={s.fill} style={{ scaleY: reduceMotion ? 1 : fill }} />
                </span>
                <ol ref={list} className={s.list}>
                {projectPath.steps.map((step, i) => (
                    <li key={step.title} className={`${s.step} ${step.free ? s.freeStep : ''}`}>
                        {step.free && i === 0 && (
                            <span className={`${ralewayBold.className} ${s.free}`} aria-hidden="true">{projectPath.free}</span>
                        )}
                        <span className={s.dot} aria-hidden="true" />
                        <span className={`${ralewayBold.className} ${s.name}`}>
                            {step.title}
                            {step.free && <span className={s.srOnly}>, {projectPath.free}</span>}
                        </span>
                        <span className={s.text}>{step.text}</span>
                    </li>
                ))}
                </ol>
            </div>
        </div>
    );
};

export default ProjectPath;
