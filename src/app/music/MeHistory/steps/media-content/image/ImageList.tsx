import { FC } from "react";
import Image from "next/image";

import s from './ImageList.module.scss'
import { IImageMedia } from "@/interfaces/musicHistory";
import ButtonRight from "@/components/ui/buttons/button-right/ButtonRight";
import ButtonDown from "@/components/ui/buttons/button-down/ButtonDown";

const ImageList:FC<{title: string, images: IImageMedia[], count: number, handleOpenImage: () => void}> = ({title, images, count, handleOpenImage}) => {

    return (
        <>
        <h3 className={s.title}>{title}</h3>
        <div className={s.imgList}>
            {images.map((img, idx) => 
                idx < count &&
                <Image key={img.id} src={img.src} alt="Награда 1" />
            )}
            <div className={s.btnPC}>
                <ButtonRight action={handleOpenImage} />
            </div>
            <div className={s.btnMB}>
                <ButtonDown action={handleOpenImage}/>
            </div>
        </div>
        </>
    )
}

export default ImageList