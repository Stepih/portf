import { FC } from "react";
import Image from "next/image";

import s from './ArrowLink.module.scss'
import arrow from '@/assets/_img/icons/arrow-up.svg'
const ArrowLink:FC = () => {

    return (
        <Image 
            className={s.arrow}
            src={arrow}
            alt="->"
        />
    )
}

export default ArrowLink