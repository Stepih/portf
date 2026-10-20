import { FC } from "react";

import s from './Steps.module.scss'
import { ralewayBold, ralewayRegular } from "@/app/fonts/fonts";
import { offerSteps, stepsDescription, stepsTitle } from "@/data/offer";

// «Как я работаю» (SALES_PLAN 3.5): шаги от созвона до запуска.
// На компьютере в ряд, номера соединены линией; на телефоне – лентой сверху вниз
const Steps: FC = () => {
    return (
        <section className={`${ralewayRegular.className} ${s.steps}`} aria-labelledby="steps-title">
            <h2 id="steps-title" className={`${ralewayBold.className} ${s.title}`}>{stepsTitle}</h2>
            <p className={s.description}>{stepsDescription}</p>

            <ol className={s.list}>
                {offerSteps.map((step, i) => (
                    <li key={step.title} className={s.step}>
                        <span className={`${ralewayBold.className} ${s.number}`} aria-hidden="true">{i + 1}</span>
                        <h3 className={`${ralewayBold.className} ${s.name}`}>{step.title}</h3>
                        <p className={s.text}>{step.text}</p>
                    </li>
                ))}
            </ol>
        </section>
    )
}

export default Steps
