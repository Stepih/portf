import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import s from './MediaContentList.module.scss';
import { IImageMedia } from "@/interfaces/musicHistory";

import VideoList from "./video/VideoList";
import ImageList from "./image/ImageList";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import Popup from "./Popup";
import { IMediaVideo } from "@/interfaces/slider";
import { AnimatePresence } from "framer-motion";

interface IMediaContent {
    videos: IMediaVideo[], 
    images: IImageMedia[], 
}

const MediaList: FC<IMediaContent> = ({ videos, images }) => {
    const [popup, setPopup] = useState<IMediaVideo[] | IImageMedia[] | undefined>(undefined)

    // Портал нужен только в браузере: на сервере document нет
    const [mounted, setMounted] = useState(false)

    useBodyScrollLock(Boolean(popup))

    useEffect(() => setMounted(true), [])

    const handleOpenPopup = (content?:IMediaVideo[] | IImageMedia[] ) => {
        if (content === undefined) {
            setPopup(undefined)
            return
        }
            
        setPopup(content)
    };


    if (videos.length === 0 && images.length === 0) return null

    return (
        <>
        {/* Попап выносится в body: секции шагов — отдельные контексты наложения, и соседние шаги и полоса чекпоинтов перекрыли бы его */}
        {mounted && createPortal(
            <AnimatePresence>
                {popup && <Popup content={popup} handleOpenPopup={handleOpenPopup} />}
            </AnimatePresence>,
            document.body
        )}
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
        </div>
        </>
    );
};

export default MediaList;
