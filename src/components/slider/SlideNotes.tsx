import { FC, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

import s from './SlideNotes.module.scss';

interface ISlideNotes {
    length: number,
    step: number,
    action: (idx: number) => void;
    slideNotesPosition: 'right' | 'bottom'
}

const SlideNotes: FC<ISlideNotes> = ({ length, step, action, slideNotesPosition }) => {
    const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]); // Реф для кнопок
    const slideWidthRef = useRef<HTMLDivElement | null>(null); // Реф для контейнера div
    const [btnPos, setBtnPos] = useState<(number | null)[]>([]); // Состояние для позиций кнопок
    const [scale, setScale] = useState(1); // Состояние для управления scale (сжатием)
    

    useEffect(() => {
        // Если контейнер и кнопки загружены, вычисляем расстояния
        if (slideWidthRef.current && buttonsRef.current.length > 0) {
            // Получаем координаты левого края контейнера
            const containerLeft = slideWidthRef.current.getBoundingClientRect().left;
            const positions = buttonsRef.current.map((button) => {
                if (button) {
                    
                    // Получаем позицию кнопки относительно левого края контейнера
                    return button.getBoundingClientRect().left - containerLeft;
                }
                return null;
            });
            // Сохраняем позиции кнопок в состояние
            setBtnPos(positions);
        }
    }, []); 

    
    let variants = {}

    if (slideNotesPosition === 'bottom') {
        variants = {
            x: btnPos[step] ? `${btnPos[step]}px` : '0px',
            width: scale
        }
    } else {
        variants = {
            y: btnPos[step] ? `${btnPos[step]}px` : '0px',
            height: scale
        }
    }

    useEffect(() => {
        
        setScale(50);
        const timeout = setTimeout(() => {
            setScale(25); // Возвращаем в исходный размер после анимации
        }, 100); // 300ms — это время сжатия

        // Очищаем таймер
        return () => clearTimeout(timeout);
    }, [step]); // Каждый раз при изменении `step` сжимаем и восстанавливаем размер

    return (
        length !== 1 &&
        <div ref={slideWidthRef} className={`${s.wrapper} ${btnPos.length > 0 && s[slideNotesPosition]}`}>
            {[...Array(length)].map((_, idx) => (
                <button
                    ref={(el) => { buttonsRef.current[idx] = el }} // Сохраняем ссылку на кнопку
                    key={idx}
                    className={`${s.btn} ${step === idx ? s.active : ''}`}
                    onClick={() => action(idx)}
                >
                </button>
            ))}
            <motion.span 
                className={s.bgBtnActive} 
                animate={variants}
                transition={{
                    type: "spring",  // Пружинная анимация для плавного перехода
                    stiffness: 150,  // Жёсткость пружины
                    damping: 25,  // Торможение
                    duration: 0.8,  // Время анимации
                }}>
                {/* Активная анимация кнопки */}
            </motion.span>
        </div>
    );
}

export default SlideNotes;
