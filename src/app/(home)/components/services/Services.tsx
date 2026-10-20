import { FC } from "react";
import Link from "next/link";

import s from './Services.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { popupPageURL, portfolioPageURL } from "@/constants/urls";
import { services, servicesButton, servicesCasesLabel, servicesDescription, servicesTitle } from "@/data/offer";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { serviceCases, withService } from "@/scripts/services";

// «Услуги и цены» (SALES_PLAN 3.4): карточки из offer.ts, кейс-пример и кнопка в форму с услугой.
// Серверный: тексты кейсов в клиентский бандл не попадают
const Services: FC = () => {
    return (
        <section className={`${ralewayRegular.className} ${s.services}`} aria-labelledby="services-title">
            <h2 id="services-title" className={`${ralewayBold.className} ${s.title}`}>{servicesTitle}</h2>
            <p className={s.description}>{servicesDescription}</p>

            <ul className={s.list}>
                {services.map((service) => {
                    const cases = serviceCases(service.caseIds, portfolioWorks, portfolioCases);
                    return (
                        <li key={service.id} className={s.card}>
                            <h3 className={`${ralewayBold.className} ${s.name}`}>{service.title}</h3>
                            <p className={s.summary}>{service.summary}</p>

                            <ul className={s.includes}>
                                {service.includes.map((item) => <li key={item}>{item}</li>)}
                            </ul>

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

                                <Link
                                    href={withService(popupPageURL, service.id)}
                                    className={`${ralewayBold.className} ${s.button}`}
                                    aria-label={`${servicesButton}: ${service.title}`}
                                >
                                    {servicesButton}
                                </Link>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

export default Services
