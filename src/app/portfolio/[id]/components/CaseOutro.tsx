import { FC } from "react";

import s from './CaseOutro.module.scss'
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import { popupPageURL } from "@/constants/urls";
import ActionButton from "@/components/ui/buttons/button-action/ActionButton";
import Rise from "./Rise";

interface IQuoteProps {
    text: string,
    name: string,
    role: string,
    accent: string
}

// Отзыв клиента; вместо фото — инициалы
export const CaseQuote: FC<IQuoteProps> = ({ text, name, role, accent }) => {
    const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2);

    return (
        <Rise as="figure" className={`${s.card} ${s.quote}`}>
            <span className={`${allerta.className} ${s.mark}`} style={{ color: accent }} aria-hidden="true">“</span>
            <blockquote className={s.text}>{text}</blockquote>
            <figcaption className={s.author}>
                <span className={`${allerta.className} ${s.avatar}`} aria-hidden="true">{initials}</span>
                <span className={s.who}>
                    <span className={ralewayBold.className}>{name}</span>
                    <span className={s.role}>{role}</span>
                </span>
            </figcaption>
        </Rise>
    )
}

// «Нужен похожий проект?»: ведёт на форму заявки
export const CaseCta: FC<{ url?: string }> = ({ url }) => {
    return (
        <Rise as="section" className={`${s.card} ${s.cta}`} aria-labelledby="cta-title">
            <div className={s.ctaText}>
                <h2 id="cta-title" className={`${allerta.className} ${s.ctaTitle}`}>Нужен похожий проект?</h2>
                <p className={s.ctaNote}>Расскажите о задаче, и я предложу решение и сроки.</p>
            </div>
            <div className={s.ctaActions}>
                <ActionButton text="Обсудить проект" href={popupPageURL} />
                {url && (
                    <a href={url} target="_blank" rel="noopener" className={s.site}>
                        <span className={ralewayBold.className}>Открыть сайт</span>
                        <span aria-hidden="true">↗</span>
                    </a>
                )}
            </div>
        </Rise>
    )
}
