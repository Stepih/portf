"use client";

import { CSSProperties, FC, useRef, useState } from "react";
import { motionValue, useMotionValueEvent } from "framer-motion";

import sc from '@/app/ai/components/scene.module.scss'
import p from '../Plate.module.scss'
import s from './BuildScene.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useStickyScene } from "@/app/ai/components/scene";
import { GOALS } from "@/constants/analytics";
import { IService } from "@/interfaces/offer";
import { servicesButton } from "@/data/offer";
import { buildUi, columns } from "@/data/sitesPage";
import { CorporateMock, CorporateTabs, LandingMock, LeadToast, PanelMock, ShopBar, ShopMock, stepAt } from "./Mocks";

type Kind = Exclude<IService['id'], 'ai'>;

interface IProps {
    service: Pick<IService, 'title' | 'summary' | 'price' | 'term' | 'note'> & { id: Kind },
    callouts: string[]
}

// Без движения – последний кадр сборки
const still = motionValue(1);

// Сцена «Сайт собирается на глазах» (SERVICES_PLAN У5а, выбор владельца): липкий экран, в центре – окно браузера,
// в нём по скроллу складывается сайт. Слева – выноски состава по шагам сборки, справа – цена, срок и «Узнать цену»
// из карточки главной. Путь – 2,5 экрана (на телефоне 2), движок /ai (useStickyScene). При reduced-motion –
// обычный блок с собранным сайтом
const BuildScene: FC<IProps> = ({ service, callouts }) => {
    const scene = useRef<HTMLDivElement>(null);
    const path = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const reduceMotion = usePrefersReducedMotion();
    const { progress } = useStickyScene({ scene, path, screen });
    const v = reduceMotion ? still : progress;

    // Текущая выноска – последний начавшийся шаг
    const n = callouts.length;
    const stepOf = (k: number) => {
        let i = -1;
        for (let j = 0; j < n; j++) if (k >= stepAt(j, n)) i = j;
        return i;
    };
    // Первый шаг собран до начала пути: выноска горит и без скролла (на сервере прогресс 0 – тот же шаг)
    const [step, setStep] = useState(() => stepOf(progress.get()));
    useMotionValueEvent(progress, 'change', (k) => setStep(stepOf(k)));
    const current = reduceMotion ? n - 1 : step;
    const titleId = `${service.id}-title`;

    return (
        <div
            ref={scene}
            className={`${sc.scene} ${s.scene} ${reduceMotion ? s.still : ''}`}
            style={{ '--scene-h': 'calc(var(--screen-h) * 3.5)', '--scene-h-phone': 'calc(var(--screen-h) * 3)' } as CSSProperties}
        >
            <div ref={path} className={sc.path} />
            <div ref={screen} className={`${sc.screen} ${s.screen}`}>
                <div className={s.stage}>
                    <ol className={s.callouts} aria-label={columns.included}>
                        {callouts.map((text, i) => (
                            <li
                                key={text}
                                className={`${s.callout} ${i <= current ? s.shown : ''} ${i === current ? s.current : ''}`}
                            >
                                {text}
                            </li>
                        ))}
                    </ol>

                    <figure className={s.window}>
                        <div className={s.bar}>
                            <span className={s.dots} aria-hidden="true"><i /><i /><i /></span>
                            {service.id === 'corporate' ? <CorporateTabs p={v} /> : <span className={s.address} />}
                            {service.id === 'shop' && <ShopBar p={v} />}
                        </div>
                        <div className={s.view} aria-hidden="true">
                            {service.id === 'landing' && <LandingMock p={v} />}
                            {service.id === 'corporate' && <CorporateMock p={v} />}
                            {service.id === 'shop' && <ShopMock p={v} />}
                        </div>
                        {service.id === 'landing' && <LeadToast p={v} />}
                        {service.id === 'corporate' && <PanelMock p={v} at={stepAt(2, 3)} />}
                        {service.id === 'shop' && <PanelMock p={v} at={stepAt(4, 5)} orders />}
                        <figcaption className={s.caption}>{buildUi.caption}</figcaption>
                    </figure>

                    <div className={s.side}>
                        <h2 id={titleId} className={`${ralewayBold.className} ${s.title}`}>{service.title}</h2>
                        <p className={s.summary}>{service.summary}</p>
                        <p className={`${ralewayBold.className} ${s.price}`}>{service.price}</p>
                        <p className={s.term}>{service.term}</p>
                        {service.note && <p className={s.note}>{service.note}</p>}
                        <ContactLink
                            service={service.id}
                            className={`${ralewayBold.className} ${p.button} ${s.button}`}
                            data-goal={GOALS.serviceClick}
                            data-goal-id={service.id}
                            aria-label={`${servicesButton}: ${service.title}`}
                        >
                            {servicesButton}
                        </ContactLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildScene;
