import { FC } from "react";
import Image from "next/image";

import i from '@/assets/_img/rectangles/title-page/i.png'

import s from './TitleBlockPage.module.scss'
import AnimatedButton from "./button/AnimatedButton";
import { ITitleBlockPage } from "@/interfaces/titleBlockPage";
import { allerta } from "@/fonts/fonts";


interface IProps {
    props: ITitleBlockPage
}

const TitleBlockPage: FC<IProps> =({props}) => {
    const {title, description, img} = props

    return (
        <>
            {img && (
                <div className={s.imgWrapper}>
                    <Image
                        className={s.image}
                        src={i}
                        alt="Здесь моя фотография"
                        priority
                    />
                </div>
            )}
            <div className={s.wrapper}>
            {!img && <AnimatedButton />}
                <div className={`${s.wrapperContent} ${!img && s.noHome}`}>
                    <div className={s.content}>
                        <h1 className={`${allerta.className} ${s.title}`}>{title}</h1>
                        <p className={s.description}>{description}</p>
                    </div>
                </div>
            </div>
            
        </>
        
    )
}

export default TitleBlockPage