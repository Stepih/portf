import { FC } from "react";

import s from './Faq.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { faqContactLink, faqDescription, faqMoreLabel, faqTitle, faqTopCount, offerFaq } from "@/data/offer";
import { IFaqItem } from "@/interfaces/offer";
import ContactLink from "../contact-link/ContactLink";

// FAQ (SALES_PLAN 3.8): аккордеон на <details>/<summary> – работает без JS, ответы сразу в HTML для поиска.
// Первый вопрос раскрыт, чтобы было видно, что вопросы раскрываются (выбор владельца).
// Подпись ведёт к форме главной (DESIGN_FIXES_3_PLAN Д15).
// Д45: сразу видны faqTopCount вопросов о страхах, остальные – в <details> «Ещё вопросы» (тоже без JS)
const Question: FC<{ item: IFaqItem, open?: boolean }> = ({ item, open }) => (
    <details className={s.item} open={open}>
        <summary className={`${ralewayBold.className} ${s.question}`}>{item.question}</summary>
        <p className={s.answer}>{item.answer}</p>
    </details>
)

const Faq: FC = () => {
    const top = offerFaq.slice(0, faqTopCount)
    const more = offerFaq.slice(faqTopCount)

    return (
        <section className={`${ralewayRegular.className} ${s.faq}`} aria-labelledby="faq-title">
            <h2 id="faq-title" className={`${ralewayBold.className} ${s.title}`}>{faqTitle}</h2>
            <p className={s.description} data-goal-place="faq">
                {faqDescription}{' '}
                <ContactLink className={s.link}>{faqContactLink}</ContactLink>
            </p>

            <div className={s.list}>
                {top.map((item, i) => <Question key={item.question} item={item} open={i === 0} />)}

                {more.length > 0 && (
                    <details className={s.more}>
                        <summary className={`${ralewayBold.className} ${s.moreToggle}`}>{faqMoreLabel}</summary>
                        {more.map((item) => <Question key={item.question} item={item} />)}
                    </details>
                )}
            </div>
        </section>
    )
}

export default Faq
