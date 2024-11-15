import { FC, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IMediaBit, IMediaGif, IMediaImage } from "@/interfaces/mediaImages";
import s from './SlideNotes.module.scss';

interface ISlideNotes {
    images: IMediaImage[] | IMediaGif[] | IMediaBit[],
    step: number,
    action: (idx: number) => void
}

const SlideNotes: FC<ISlideNotes> = ({ images, step, action }) => {
    const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]); // Реф для кнопок
    const slideWidthRef = useRef<HTMLDivElement | null>(null); // Реф для контейнера div
    const [width, setWidth] = useState<number | null>(null); // Состояние для ширины блока
    const [btnPos, setBtnPos] = useState<(number | null)[]>([]); // Состояние для позиций кнопок
    const [scale, setScale] = useState(1); // Состояние для управления scale (сжатием)

    useEffect(() => {
        // Получаем ширину контейнера
        if (slideWidthRef.current) {
            const currentWidth = slideWidthRef.current.getBoundingClientRect().width;
            setWidth(currentWidth); // Устанавливаем ширину в состоянии
        }

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


    useEffect(() => {
        // Сжимаем кнопку при изменении шага
        setScale(50); // Начинаем с уменьшения
        const timeout = setTimeout(() => {
            setScale(25); // Возвращаем в исходный размер после анимации
        }, 100); // 300ms — это время сжатия

        // Очищаем таймер
        return () => clearTimeout(timeout);
    }, [step]); // Каждый раз при изменении `step` сжимаем и восстанавливаем размер


    return (
        images.length !== 1 &&
        <div ref={slideWidthRef} className={s.slideNotes}>
            {images.map((btn, idx) => (
                <button
                    ref={(el) => { buttonsRef.current[idx] = el }} // Сохраняем ссылку на кнопку
                    key={btn.id}
                    className={`${s.btn} ${step === idx ? s.active : ''}`}
                    onClick={() => action(idx)}
                >
                </button>
            ))}
            <motion.span 
                className={s.bgBtnActive} 
                animate={{ 
                    x: btnPos[step] ? `${btnPos[step]}px` : '0px',
                    width: scale
                }}
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
