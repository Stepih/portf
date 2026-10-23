"use client"

import { FC } from "react";
import { useSearchParams } from "next/navigation";

import s from './ServiceChoice.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { formServiceLabel } from "@/data/inputsFeedBack";
import { ServiceId } from "@/interfaces/offer";
import { SERVICE_PARAM } from "@/scripts/services";

// Услуга из «Узнать цену» над полями формы (DESIGN_FIXES_3_PLAN Д13): «Вы выбрали: Лендинг · от 8 000 ₽ · 3–4 дня».
// Неизвестный id из адреса не показывается. useSearchParams требует Suspense вокруг – он в LeadForm
interface IServiceChoice {
    lines: Partial<Record<ServiceId, string>>
}

const ServiceChoice: FC<IServiceChoice> = ({ lines }) => {
    const id = useSearchParams().get(SERVICE_PARAM);
    const line = id && Object.prototype.hasOwnProperty.call(lines, id) ? lines[id as ServiceId] : undefined;
    if (!line) return null;

    return (
        <p className={s.choice}>
            {formServiceLabel} <b className={ralewayBold.className}>{line}</b>
        </p>
    )
}

export default ServiceChoice
