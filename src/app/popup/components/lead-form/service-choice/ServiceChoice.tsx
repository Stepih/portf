"use client"

import { FC, Suspense, useEffect, useId } from "react";
import { useSearchParams } from "next/navigation";

import s from './ServiceChoice.module.scss'
import { formServiceTitle } from "@/data/inputsFeedBack";
import { ILeadService, LeadServiceId } from "@/interfaces/offer";
import { SERVICE_PARAM } from "@/scripts/services";

// Тип проекта в форме (SALES_PLAN 4.2): чипы с услугами и «Другое», выбор необязателен – повторное нажатие снимает.
// Заменил строку «Вы выбрали: …» (DESIGN_FIXES_3_PLAN Д13): услуга из «Узнать цену» выбрана заранее, её можно сменить.
// onChange – сеттер состояния формы, он же ставит услугу из адреса
interface IServiceChoice {
    services: ILeadService[];
    value: LeadServiceId | undefined;
    onChange: (id: LeadServiceId | undefined) => void;
}

// Услуга из адреса: переход по «Узнать цену» на главной меняет только параметр, форма не перемонтируется.
// Чип следует за параметром, как раньше строка: ушла услуга из адреса («Обсудить проект», «Назад») – выбор снят.
// Выбор клиента вручную не трогаем: эффект срабатывает только при смене параметра. Неизвестный id не выбирается.
// useSearchParams требует Suspense – он в ServiceChoice
const ServiceFromUrl: FC<Pick<IServiceChoice, 'services' | 'onChange'>> = ({ services, onChange }) => {
    const id = useSearchParams().get(SERVICE_PARAM);
    const picked = services.find((service) => service.id === id)?.id;

    useEffect(() => {
        onChange(picked);
    }, [picked, onChange]);

    return null;
}

const ServiceChoice: FC<IServiceChoice> = ({ services, value, onChange }) => {
    const titleId = useId();

    return (
        <div className={s.choice}>
            <span id={titleId} className={s.title}>{formServiceTitle}</span>
            <div className={s.chips} role="group" aria-labelledby={titleId}>
                {services.map(({ id, title }) => {
                    const pressed = id === value;
                    return (
                        <button
                            key={id}
                            type="button"
                            className={`${s.chip}${pressed ? ` ${s.active}` : ''}`}
                            aria-pressed={pressed}
                            onClick={() => onChange(pressed ? undefined : id)}
                        >
                            {title}
                        </button>
                    )
                })}
            </div>
            <Suspense fallback={null}>
                <ServiceFromUrl services={services} onChange={onChange} />
            </Suspense>
        </div>
    )
}

export default ServiceChoice
