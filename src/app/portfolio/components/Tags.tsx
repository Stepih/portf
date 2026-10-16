import { FC } from "react";

import s from './Tags.module.scss'

// Метки работы: платформа, тип, отрасль
const Tags: FC<{ tags: string[] }> = ({ tags }) => {
    return (
        <ul className={s.tags}>
            {tags.map((tag) => (
                <li key={tag} className={s.tag}>{tag}</li>
            ))}
        </ul>
    )
}

export default Tags
