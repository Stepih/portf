import { IMusicHistory } from "@/interfaces/musicHistory";
import { FC, RefObject } from "react";
import s from './Steps.module.scss';
import MediaList from "./media-content/MediaContentList";
import Link from "next/link";
import ButtonUp from "@/components/ui/buttons/button-up/ButtonUp";

// Все шаги лежат стопкой в одной ячейке сетки, виден только активный. Сдвиг активного шага задаёт History
const Steps: FC<{
    musicHistory: IMusicHistory[],
    step: number,
    stepRefs: RefObject<(HTMLElement | null)[]>
}> = ({ musicHistory, step, stepRefs }) => {
    return (
        <>
            {musicHistory.map((history, idx) =>
                <section
                    ref={(el) => { stepRefs.current[idx] = el; }}
                    key={history.id}
                    aria-label={history.title}
                    className={`${s.wrapper} ${idx === step ? s.active : ''}`}
                >
                    <p className={s.description}>{history.description}</p>
                    <MediaList
                        videos={history.videos || []}
                        images={history.images || []}
                    />
                    {/* Последний шаг завершает историю: сразу под ним выход на главную и наверх */}
                    {idx === musicHistory.length - 1 && (
                        <div className={s.btns}>
                            <Link className={s.mainBtn} href="/">На главную</Link>
                            <ButtonUp />
                        </div>
                    )}
                </section>
            )}
        </>
    );
};

export default Steps;
