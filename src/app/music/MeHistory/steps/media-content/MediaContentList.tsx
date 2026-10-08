import { FC, useEffect, useState } from "react";

import s from './MediaContentList.module.scss';
import { IImageMedia } from "@/interfaces/musicHistory";

import VideoList from "./video/VideoList";
import ImageList from "./image/ImageList";
import Link from "next/link";


import ButtonUp from "@/components/ui/buttons/button-up/ButtonUp";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import Popup from "./Popup";
import { IMediaVideo } from "@/interfaces/slider";
import { AnimatePresence } from "framer-motion";

interface IMediaContent {
    updatePopupActive: (isActive: boolean) => void, 
    videos: IMediaVideo[], 
    images: IImageMedia[], 
}

const MediaList: FC<IMediaContent> = ({ videos, images, updatePopupActive }) => {
    const [popup, setPopup] = useState<IMediaVideo[] | IImageMedia[] | undefined>(undefined)

    useBodyScrollLock(Boolean(popup))

    useEffect(() => {
        updatePopupActive(Boolean(popup))
    }, [popup])
    
    const handleOpenPopup = (content?:IMediaVideo[] | IImageMedia[] ) => {
        if (content === undefined) {
            setPopup(undefined)
            return
        }
            
        setPopup(content)
    };


    return (
        <>
        <AnimatePresence>
            {popup && <Popup content={popup} handleOpenPopup={handleOpenPopup} />}
        </AnimatePresence>
        <div className={s.wrapper}>
            {videos.length > 0 && (
                <>
                <VideoList 
                    title="Любимые произведения:"
                    videos={videos} 
                    handleOpenPopup={handleOpenPopup} 
                    count={3}/> 
                </>
            )}
            {images.length > 0 && (
                <div className={s.imgContent}>
                    <ImageList 
                        title="Награды:" 
                        images={images} 
                        count={5} 
                        handleOpenPopup={handleOpenPopup}/>
                </div>
            )}
            {images.length === 0 && videos.length === 0 && (
                <div className={s.btns}>
                    <Link className={s.mainBtn} href="/">На главную</Link>
                    <ButtonUp />
                </div>
            )}
        </div>
        </>
    );
};

export default MediaList;
