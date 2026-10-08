import { FC } from "react";
import Image from "next/image";

import s from './ImageList.module.scss'
import { IImageMedia } from "@/interfaces/musicHistory";
import ButtonMore from "@/components/ui/buttons/button-more/ButtonMore";

const ImageList:FC<{
    title: string, 
    images: IImageMedia[], 
    count: number, 
    handleOpenPopup: () => void
}> = ({title, images, count, handleOpenPopup}) => {

    return (
        <>
        <h3 className={s.title}>{title}</h3>
        <div className={`${s.imgList} ${count!==images.length ? s.hide : s.hideOne}`}>
            {images.map((img, idx) => 
                idx < count &&
                <div key={img.id} className={s.img}>
                    <Image 
                        fill
                        sizes="120px"
                        style={{ objectFit: "cover" }} 
                        src={img.src} 
                        alt={`Награда ${idx + 1}`} 
                    />
                </div>
            )}
            <div className={s.btnPC}>
                <ButtonMore direction="right" param={images} paramAction={handleOpenPopup} />
            </div>
            <div className={s.btnMB}>
                <ButtonMore direction="down" param={images} paramAction={handleOpenPopup} />
            </div>
        </div>
        </>
    )
}

export default ImageList