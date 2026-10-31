import { FC, Fragment } from "react";
import Link from "next/link";

import p from './Plate.module.scss'
import s from './SiteSection.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { portfolioPageURL } from "@/constants/urls";
import { GOALS } from "@/constants/analytics";
import { IService } from "@/interfaces/offer";
import { ISitesDetails, ISitesOption } from "@/interfaces/sitesPage";
import { IPortfolioWork } from "@/interfaces/portfolio";
import { servicesButton } from "@/data/offer";
import { columns, commonId } from "@/data/sitesPage";

// Опция: название, цена жирным, хвост после цены
export const Option: FC<{ option: ISitesOption }> = ({ option }) => (
    <li>
        {option.title}
        {option.price && <>{' – '}<span className={`${ralewayBold.className} ${p.price}`}>{option.price}</span></>}
        {option.note}
    </li>
);

interface IProps {
    service: IService,
    details: ISitesDetails,
    // Кейсы раздела с названием работы; без страницы кейса – уже отброшены
    cases: (Pick<IPortfolioWork, 'id' | 'name'> & { text?: string })[]
}

// Раздел вида сайта (макет page_C_sites): вверху – название и описание, справа – цена, срок, уточнение и «Узнать цену»,
// как в карточке главной; ниже три колонки «Входит всегда / Можно добавить / Не входит» и кейсы
const SiteSection: FC<IProps> = ({ service, details, cases }) => {
    const titleId = `${service.id}-title`;

    return (
        <section id={service.id} className={`${p.plate} ${s.section}`} aria-labelledby={titleId}>
            <div className={s.top}>
                <div>
                    <h2 id={titleId} className={`${ralewayBold.className} ${p.title}`}>{service.title}</h2>
                    <p className={p.text}>{service.summary}</p>
                </div>
                <div className={s.offer}>
                    <p className={`${ralewayBold.className} ${s.price}`}>{service.price}</p>
                    <p className={s.term}>{service.term}</p>
                    {service.note && <p className={s.offerNote}>{service.note}</p>}
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

            <hr className={p.rule} />

            <div className={s.columns}>
                <div>
                    <h3 className={`${ralewayBold.className} ${p.label}`}>{columns.included}</h3>
                    {details.included.map((group, i) => (
                        <Fragment key={i}>
                            {group.label && <p className={p.group}>{group.label}</p>}
                            <ul className={p.list}>
                                <li><a href={`#${commonId}`} className={p.link}>{columns.common}</a></li>
                                {group.items.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                            {group.note && <p className={p.note}>{group.note}</p>}
                        </Fragment>
                    ))}
                </div>

                <div>
                    <h3 className={`${ralewayBold.className} ${p.label}`}>{columns.options}</h3>
                    <ul className={p.list}>
                        {details.options.map((option) => <Option key={option.title} option={option} />)}
                    </ul>
                    <p className={p.note}>{columns.onCall} {details.onCall}</p>
                    {details.example && (
                        <p className={`${p.note} ${s.example}`}>
                            {details.example.text}{' '}
                            <span className={`${ralewayBold.className} ${p.price}`}>{details.example.total}</span>
                        </p>
                    )}
                </div>

                <div>
                    <h3 className={`${ralewayBold.className} ${p.label}`}>{columns.excluded}</h3>
                    <ul className={p.list}>
                        {details.excluded.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <h3 className={`${ralewayBold.className} ${p.label} ${s.payment}`}>{columns.payment}</h3>
                    <ul className={p.list}>
                        {details.payment.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                </div>
            </div>

            {cases.length > 0 && (
                <p className={s.cases}>
                    {columns.cases}{' '}
                    {cases.map((work, i) => (
                        <span key={work.id}>
                            {i > 0 && '; '}
                            <Link href={`${portfolioPageURL}/${work.id}`} className={p.link}>{work.name}</Link>
                            {work.text && ` – ${work.text}`}
                        </span>
                    ))}
                </p>
            )}
        </section>
    )
}

export default SiteSection
