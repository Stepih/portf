import { FC } from "react";

import s from './Chat.module.scss'

// Звезда в шаре чата: в плавающем шаре и в кнопке карточки ИИ (DESIGN.md, «Шар чата»). Малая звёздочка мерцает
interface IOrbStar {
    className: string;
}

const OrbStar: FC<IOrbStar> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5c.6 4.9 2.6 6.9 7.5 7.5-4.9.6-6.9 2.6-7.5 7.5-.6-4.9-2.6-6.9-7.5-7.5 4.9-.6 6.9-2.6 7.5-7.5z" />
        <path className={s.spark} d="M19 15.5c.25 1.9 1 2.65 2.9 2.9-1.9.25-2.65 1-2.9 2.9-.25-1.9-1-2.65-2.9-2.9 1.9-.25 2.65-1 2.9-2.9z" />
    </svg>
)

export default OrbStar
