import { FC } from "react";

import s from './Faq.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { faqContactLink, faqDescription, faqTitle, offerFaq } from "@/data/offer";
import ContactLink from "../contact-link/ContactLink";

// FAQ (SALES_PLAN 3.8): аккордеон на <details>/<summary> – работает без JS, ответы сразу в HTML для поиска.
// Первый вопрос раскрыт, чтобы было видно, что вопросы раскрываются (выбор владельца).
// Подпись ведёт к форме главной (DESIGN_FIXES_3_PLAN Д15)
const Faq: FC = () => {
    return (
        <section className={`${ralewayRegular.className} ${s.faq}`} aria-labelledby="faq-title">
            <h2 id="faq-title" className={`${ralewayBold.className} ${s.title}`}>{faqTitle}</h2>
            <p className={s.description} data-goal-place="faq">
                {faqDescription}{' '}
                <ContactLink className={s.link}>{faqContactLink}</ContactLink>
            </p>

            <div className={s.list}>
                {offerFaq.map((item, i) => (
                    <details key={item.question} className={s.item} open={i === 0}>
                        <summary className={`${ralewayBold.className} ${s.question}`}>{item.question}</summary>
                        <p className={s.answer}>{item.answer}</p>
                    </details>
                ))}
            </div>
        </section>
    )
}

export default Faq
