import { FC } from "react";

import f from '@/app/(home)/components/faq/Faq.module.scss'
import s from './SitesFaq.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import ContactLink from "@/app/(home)/components/contact-link/ContactLink";
import { faq, faqId, sections } from "@/data/sitesPage";

// Вопросы перед заказом – тот же аккордеон на <details>, что FAQ главной, первый раскрыт. Подпись ведёт к форме главной
const SitesFaq: FC = () => {
    return (
        <section id={faqId} className={`${ralewayRegular.className} ${f.faq} ${s.faq}`} aria-labelledby={`${faqId}-title`}>
            <h2 id={`${faqId}-title`} className={`${ralewayBold.className} ${f.title}`}>{sections.faq.title}</h2>
            <p className={f.description} data-goal-place="sites_faq">
                {sections.faq.text}{' '}
                <ContactLink className={f.link}>{sections.faq.link}</ContactLink>
            </p>

            <div className={f.list}>
                {faq.map((item, i) => (
                    <details key={item.question} className={f.item} open={i === 0}>
                        <summary className={`${ralewayBold.className} ${f.question}`}>{item.question}</summary>
                        <p className={f.answer}>{item.answer}</p>
                    </details>
                ))}
            </div>
        </section>
    )
}

export default SitesFaq
