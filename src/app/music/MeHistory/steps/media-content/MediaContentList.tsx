import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";

import s from './MediaContentList.module.scss';
import { IVideoMedia, IImageMedia } from "@/interfaces/musicHistory";

import VideoList from "./video/VideoList";
import ImageList from "./image/ImageList";
import Link from "next/link";


import ButtonUp from "@/components/ui/buttons/button-up/ButtonUp";
import { bodyLock, bodyUnLock } from "@/scripts/scrollTo";
import Popup from "./Popup";

interface IMediaContent {
    updatePopupActive: (isActive: boolean) => void, 
    videos: IVideoMedia[], 
    images: IImageMedia[], 
    step: number 
}


const MediaList: FC<IMediaContent> = ({step, videos, images, updatePopupActive }) => {
    const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
    const [popup, setPopup] = useState<IVideoMedia[] | IImageMedia[] | undefined>(undefined)

    useEffect(() => {
        updatePopupActive(Boolean(popup))
        Boolean(popup) ? bodyLock() : bodyUnLock()
    }, [popup])
    
    const handleOpenPopup = (content?:IVideoMedia[] | IImageMedia[] ) => {
        if (content === undefined) {
            setPopup(undefined)
            return
        }
        setPopup(content)
    };

    const handleVideoError = (id: number) => {
        setVideoErrors((prev) => ({
            ...prev,
            [id]: true
        }));
    };

    return (
        <>
        {popup && <Popup videoErrors={videoErrors} handleVideoError={handleVideoError} content={popup} handleOpenPopup={handleOpenPopup} />}
        <div className={s.wrapper} id="mediaContent">
            {videos.length > 0 && (
                <>
                <VideoList 
                    title="Любимые произведения:"
                    videos={videos} 
                    handleOpenPopup={handleOpenPopup} 
                    handleVideoError={handleVideoError} 
                    videoErrors={videoErrors} 
                    count={2}/> 
                </>
            )}
            {images.length > 0 && (
                <div className={s.imgContent}>
                    <ImageList 
                        title="Награды:" 
                        images={images} 
                        count={step === 1 ? images.length : 3} 
                        handleOpenPopup={handleOpenPopup}/>
                </div>
            )}
            {images.length === 0 && videos.length === 0 && (
                <div className={s.btns}>
                    <Link onClick={()=> bodyUnLock()} className={s.mainBtn} href="/">На главную</Link>
                    <ButtonUp />
                </div>
            )}
        </div>
        </>
    );
};

export default MediaList;
