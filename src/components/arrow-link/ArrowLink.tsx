import { FC } from "react";

import s from './ArrowLink.module.scss'
import Arrow from '@/assets/_img/icons/arrow-up.svg'
const ArrowLink:FC = () => {

    return (
        <Arrow className={s.arrow}/>
    )
}

export default ArrowLink