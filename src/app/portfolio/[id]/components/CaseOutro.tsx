import { FC } from "react";

import TgIcon from '@/assets/_img/icons/tg-white.svg'

import s from './CaseOutro.module.scss'
import { allerta, ralewayBold } from "@/app/fonts/fonts";
import { popupPageURL } from "@/constants/urls";
import { caseCtaNote, caseCtaShort, caseCtaTitle, formButton, offerTgButton } from "@/data/offer";
import { withCase } from "@/scripts/services";
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

// Форма заявки с кейсом в ссылке и Telegram рядом, на равных (SALES_PLAN 5.2)
const CtaButtons: FC<{ caseId: string }> = ({ caseId }) => (
    <>
        <ActionButton text={formButton} href={withCase(popupPageURL, caseId)} />
        <a href={offerTgButton.href} target="_blank" rel="noopener" className={s.tg}>
            <TgIcon className={s.icon} aria-hidden="true" />
            {offerTgButton.title}
        </a>
    </>
)

// Короткий призыв сразу после цифр: кто дочитал до результата, может написать, не листая до конца
export const CaseCtaShort: FC<{ caseId: string }> = ({ caseId }) => {
    return (
        <Rise as="section" className={s.short} aria-label="Обсудить похожий проект">
            <p className={`${ralewayBold.className} ${s.shortText}`}>{caseCtaShort}</p>
            <div className={s.ctaActions} data-goal-place="case_short">
                <CtaButtons caseId={caseId} />
            </div>
        </Rise>
    )
}

// «Нужен похожий проект?» в конце кейса: форма заявки, Telegram и ссылка на сайт
export const CaseCta: FC<{ caseId: string, url?: string }> = ({ caseId, url }) => {
    return (
        <Rise as="section" className={`${s.card} ${s.cta}`} aria-labelledby="cta-title">
            <div className={s.ctaText}>
                <h2 id="cta-title" className={`${allerta.className} ${s.ctaTitle}`}>{caseCtaTitle}</h2>
                <p className={s.ctaNote}>{caseCtaNote}</p>
            </div>
            <div className={s.ctaActions} data-goal-place="case_end">
                <CtaButtons caseId={caseId} />
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
