import { FC, MouseEvent, ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import s from './Prompt.module.scss';

// Define the type for `PromptType`
type PromptType =
    | { type: 'passive'; side: 'left' | 'right' | 'top' | 'bottom' } // When `type` is 'passive', `side` is required
    | { type: 'active'; side?: never }; // When `type` is 'active', `side` is not allowed

// Combine `PromptType` into the overall props
type IPrompt = {
    title: string;
    children: ReactNode;
    show: boolean;
    screen: 'fill' | 'auto'
} & PromptType;

const Prompt: FC<IPrompt> = ({ title, children, show, type, side, screen }) => {
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (type === 'active') {
            const rect = e.currentTarget.getBoundingClientRect();
            setPos({ x: e.clientX - rect.left + 20, y: e.clientY - rect.top - 30 });
        }
    };

    const posAnim = type === 'active' ? {x: pos.x, y: pos.y} : ''
    const styl = screen === 'fill' ? {width: '100%', height: '100%'} : {}

    return (
        <div style={styl} onMouseMove={handleMouseMove} className={s.wrapper}>
            {children}
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{...posAnim, opacity: 0}}
                        animate={{...posAnim, opacity: 1}}
                        transition={{duration: .1}}
                        exit={{ opacity: 0 }}
                        className={`${s.prompt} ${type === 'passive' ? s[side] : ''}`} 
                    >
                        {title}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Prompt;
