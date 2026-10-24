import { FC } from "react";

import s from './Steps.module.scss'
import { allerta, ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { offerSteps, stepsContactLink, stepsDescription, stepsTitle } from "@/data/offer";
import ContactLink from "../contact-link/ContactLink";

// «Как я работаю» (SALES_PLAN 3.5, DESIGN_FIXES_2_PLAN Д5): «две линии» – сверху этапы, снизу деньги.
// На компьютере этапы в ряд, под ними сплошная денежная линия с точкой на каждом этапе:
// залитая – здесь платёж, пустая – этап бесплатный. На телефоне – лентой сверху вниз, оплата внутри этапа.
// Под шагами – ссылка к форме (DESIGN_FIXES_3_PLAN Д15): текстом, залитое действие на экране одно.
// Бесплатный отрезок – пик блока (DESIGN_FIXES_4_PLAN Д21, вариант B владельца): линия чернилами 3px
// и одна крупная «0 ₽» на компьютере; у следующего бесплатного шага подпись остаётся только для чтения с экрана
const Steps: FC = () => {
    return (
        <section className={`${ralewayRegular.className} ${s.steps}`} aria-labelledby="steps-title">
            <h2 id="steps-title" className={`${ralewayBold.className} ${s.title}`}>{stepsTitle}</h2>
            <p className={s.description}>{stepsDescription}</p>

            <ol className={s.list}>
                {offerSteps.map((step, i) => {
                    const repeat = !step.pay.due && i > 0 && !offerSteps[i - 1].pay.due
                    return (
                        <li key={step.title} className={s.step}>
                            <span className={`${allerta.className} ${s.number}`} aria-hidden="true">{i + 1}</span>
                            <h3 className={`${ralewayBold.className} ${s.name}`}>{step.title}</h3>
                            <p className={s.text}>{step.text}</p>
                            <p className={`${s.pay} ${step.pay.due ? s.due : s.free} ${repeat ? s.repeat : ''}`}>
                                <span className={s.srOnly}>Оплата: </span>
                                <span className={`${ralewayBold.className} ${s.payLabel}`}>{step.pay.label}</span>
                                {step.pay.note && <span className={s.payNote}>{step.pay.note}</span>}
                            </p>
                        </li>
                    )
                })}
            </ol>

            <p className={s.next} data-goal-place="steps">
                <ContactLink className={`${ralewayBold.className} ${s.link}`}>{stepsContactLink}</ContactLink>
            </p>
        </section>
    )
}

export default Steps
