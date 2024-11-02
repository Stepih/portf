

import { FC } from 'react'
import s from './BgRectangle.module.scss'

import Nota from '@/assets/_img/icons/nota.svg'

export const BgRectangle1:FC<{currentUrl: string}> = ({currentUrl}) => {
    

    return (
        <div className={s.BgRectangle1}>
            <div className={s.circle}>
                
            </div>
            <Nota style={{opacity: currentUrl === "/music" ? 1 : 0}} className={s.img} />
        </div>
        
    )
}

export const BgRectangle2:FC<{currentUrl: string}> = ({currentUrl}) => {
    return (
        <div className={s.BgRectangle2}>
            <div className={s.circle}>
                
            </div>
            <Nota style={{opacity: currentUrl === "/music" ? 1 : 0}} className={s.img} />
        </div>
    )
}

