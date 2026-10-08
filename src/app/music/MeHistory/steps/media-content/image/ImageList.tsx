import { FC } from "react";
import Image from "next/image";

import s from './ImageList.module.scss'
import { IImageMedia } from "@/interfaces/musicHistory";
import ButtonRight from "@/components/ui/buttons/button-right/ButtonRight";
import ButtonDown from "@/components/ui/buttons/button-down/ButtonDown";

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
                        alt="Награда 1" 
                    />
                </div>
            )}
            <div className={s.btnPC}>
                <ButtonRight param={images} paramAction={handleOpenPopup} />
            </div>
            <div className={s.btnMB}>
                <ButtonDown param={images} paramAction={handleOpenPopup} />
            </div>
        </div>
        </>
    )
}

export default ImageList