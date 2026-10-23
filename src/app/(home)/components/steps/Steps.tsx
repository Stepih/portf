import { FC } from "react";

import s from './Steps.module.scss'
import { allerta, ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { offerSteps, stepsDescription, stepsTitle } from "@/data/offer";

// «Как я работаю» (SALES_PLAN 3.5, DESIGN_FIXES_2_PLAN Д5): «две линии» – сверху этапы, снизу деньги.
// На компьютере этапы в ряд, под ними сплошная денежная линия с точкой на каждом этапе:
// залитая – здесь платёж, пустая – этап бесплатный. На телефоне – лентой сверху вниз, оплата внутри этапа
const Steps: FC = () => {
    return (
        <section className={`${ralewayRegular.className} ${s.steps}`} aria-labelledby="steps-title">
            <h2 id="steps-title" className={`${ralewayBold.className} ${s.title}`}>{stepsTitle}</h2>
            <p className={s.description}>{stepsDescription}</p>

            <ol className={s.list}>
                {offerSteps.map((step, i) => (
                    <li key={step.title} className={s.step}>
                        <span className={`${allerta.className} ${s.number}`} aria-hidden="true">{i + 1}</span>
                        <h3 className={`${ralewayBold.className} ${s.name}`}>{step.title}</h3>
                        <p className={s.text}>{step.text}</p>
                        <p className={`${s.pay} ${step.pay.due ? s.due : ''}`}>
                            <span className={s.srOnly}>Оплата: </span>
                            <span className={`${step.pay.due ? ralewayBold.className : ''} ${s.payLabel}`}>{step.pay.label}</span>
                            {step.pay.note && <span className={s.payNote}>{step.pay.note}</span>}
                        </p>
                    </li>
                ))}
            </ol>
        </section>
    )
}

export default Steps
