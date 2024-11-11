import { FC } from "react";
import { IMediaImages } from "@/interfaces/mediaImages";

import s from './ImageMediaContent.module.scss'
import ImageMediaSlider from "./slider/ImageMediaSlider";
import FormButton from "@/components/ui/buttons/button-form/FormButton";
import Link from "next/link";


const ImageMediaContent: FC<{content: IMediaImages}> = ({content}) => {

    return (
        <div className={s.wrapper}>
            <div className={s.text}>
                <h2 className={s.title}>{content.title}</h2>
                <p className={s.description}>{content.description}</p>
                <Link href="/popup">
                    <FormButton text="Оставить заявку" />
                </Link>
            </div>
            <ImageMediaSlider images={content.images}/>
        </div>
    )
}

export default ImageMediaContent

