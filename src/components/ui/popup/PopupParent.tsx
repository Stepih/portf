import React, { FC } from "react";

import s from './PopupParent.module.scss'

const PopupParent: FC<{children: React.ReactNode, active: boolean}> = ({children, active})=> {
    return active && 
    <div className={s.wrapper}>
        {children}
    </div>
}

export default PopupParent