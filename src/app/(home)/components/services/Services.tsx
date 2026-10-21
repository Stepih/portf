import { FC } from "react";
import Link from "next/link";

import s from './Services.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { popupPageURL, portfolioPageURL } from "@/constants/urls";
import { services, servicesButton, servicesCasesLabel, servicesCommon, servicesDescription, servicesTitle } from "@/data/offer";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { serviceCases, withService } from "@/scripts/services";

// «Услуги и цены» (SALES_PLAN 3.4): три вида сайтов в ряд, ИИ – широкой карточкой под ними.
// Карточки из offer.ts, кейс-пример и кнопка в форму с услугой.
// Серверный: тексты кейсов в клиентский бандл не попадают
const Services: FC = () => {
    return (
        <section className={`${ralewayRegular.className} ${s.services}`} aria-labelledby="services-title">
            <h2 id="services-title" className={`${ralewayBold.className} ${s.title}`}>{servicesTitle}</h2>
            <p className={s.description}>{servicesDescription}</p>
            <p className={s.common}>{servicesCommon}</p>

            <ul className={s.list}>
                {services.map((service) => {
                    const cases = serviceCases(service.caseIds, portfolioWorks, portfolioCases);
                    return (
                        <li key={service.id} className={`${s.card} ${service.wide ? s.wide : ''}`}>
                            <h3 className={`${ralewayBold.className} ${s.name}`}>{service.title}</h3>
                            <p className={s.summary}>{service.summary}</p>

                            <div className={s.bottom}>
                                <p className={`${ralewayBold.className} ${s.price}`}>{service.price}</p>
                                <p className={s.term}>{service.term}</p>
                                {service.note && <p className={s.note}>{service.note}</p>}

                                {cases.length > 0 && (
                                    <p className={s.cases}>
                                        {servicesCasesLabel}{' '}
                                        {cases.map((work, i) => (
                                            <span key={work.id}>
                                                {i > 0 && ', '}
                                                <Link href={`${portfolioPageURL}/${work.id}`} className={s.caseLink}>{work.name}</Link>
                                            </span>
                                        ))}
                                    </p>
                                )}
                            </div>

                            <Link
                                href={withService(popupPageURL, service.id)}
                                className={`${ralewayBold.className} ${s.button}`}
                                data-goal="service_click"
                                data-goal-id={service.id}
                                aria-label={`${servicesButton}: ${service.title}`}
                            >
                                {servicesButton}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

export default Services
