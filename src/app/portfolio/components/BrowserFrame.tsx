import { FC, ReactNode } from "react";

import s from './BrowserFrame.module.scss'

interface IProps {
    children: ReactNode,
    className?: string,
    // Тёмный фон экрана: под видео, пока оно грузится
    dark?: boolean
}

// Окно браузера с тремя точками в шапке; содержимое заполняет экран
const BrowserFrame: FC<IProps> = ({ children, className = '', dark }) => {
    return (
        <div className={`${s.frame} ${className}`}>
            <div className={s.bar} aria-hidden="true">
                <span /><span /><span />
            </div>
            <div className={`${s.screen} ${dark ? s.dark : ''}`}>
                {children}
            </div>
        </div>
    )
}

export default BrowserFrame
