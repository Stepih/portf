import { IMusicHistory } from "@/interfaces/musicHistory";
import { FC, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import s from './Steps.module.scss';
import MediaList from "./media-content/MediaContentList";
import { scrollToElementById } from "@/scripts/scrollTo";

const Steps: FC<{ musicHistory: IMusicHistory[], step: number, handleSetStep:(id:number)=>void }> = ({handleSetStep, musicHistory, step }) => {
    const refs = useRef<(HTMLDivElement | null)[]>([]); // Массив рефов для каждого элемента
   

    // Функция для проверки, виден ли элемент
    const checkVisibility = () => {
        
        refs.current.forEach((ref, idx) => {
            if (ref) {
                const rect = ref.getBoundingClientRect();
                
                // Проверяем, что нижняя граница элемента видна
                if (rect.bottom <= window.innerHeight && rect.bottom >= window.innerHeight - 10) {
                    handleSetStep(step + 1)
                    scrollToElementById("title-history");
                }
            }
        });
    };

    useEffect(() => {
        
        window.addEventListener('scroll', checkVisibility, { passive: true, capture: true });

        // Очищаем обработчик при размонтировании
        return () => {
            window.removeEventListener('scroll', checkVisibility);
        };
    }, [step]); 

    console.log(step)

    return (
        <>
            {musicHistory.map((history, idx) => 
                <motion.div
                    ref={(el) => { refs.current[idx] = el; }} // Присваиваем реф текущему элементу
                    style={{ display: step !== idx ? 'none' : 'block' }}
                    key={history.id} className={s.wrapper}
                >
                    <p className={s.description}>{history.description}</p>
                    <MediaList step={step} videos={history.videos || []} images={history.images || []}/>
                </motion.div>
            )}
        </>
    );
};

export default Steps;
