import { FC, useState } from "react";

import s from './MediaContentList.module.scss';
import { IVideoMedia, IImageMedia } from "@/interfaces/musicHistory";

import VideoList from "./video/VideoList";
import ImageList from "./image/ImageList";
import Link from "next/link";


import ButtonUp from "@/components/ui/buttons/button-up/ButtonUp";
import { bodyUnLock } from "@/scripts/scrollTo";


const MediaList: FC<{ videos: IVideoMedia[], images: IImageMedia[], step: number }> = ({step, videos, images }) => {
    const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});

    const [videoPopup, setVideoPopup] = useState(false)
    const [imagePopup, setImagePopup] = useState(false)

    const handleOpenVideo = () => {
        setVideoPopup(!videoPopup)
    };

    const handleOpenImage = () => {
        setImagePopup(!imagePopup)
    };

    const handleVideoError = (id: number) => {
        setVideoErrors((prev) => ({
            ...prev,
            [id]: true
        }));
    };

    return (
        <div className={s.wrapper} id="mediaContent">
            
            {videos.length > 0 && !imagePopup && (
                <>
                <VideoList 
                    title="Любимые произведения:"
                    videos={videos} 
                    handleOpenVideo={handleOpenVideo} 
                    handleVideoError={handleVideoError} 
                    videoErrors={videoErrors} 
                    count={videoPopup ? videos.length : 2}/> 
                </>
            )}
            {images.length > 0 && !videoPopup && (
                <div className={s.imgContent}>
                    <ImageList 
                        title="Награды:" 
                        images={images} 
                        count={step === 1 ? images.length : imagePopup ? images.length : 3} 
                        handleOpenImage={step === 0 ? handleOpenImage : undefined}/>
                </div>
            )}
            {images.length === 0 && videos.length === 0 && (
                <div className={s.btns}>
                    <Link onClick={()=> bodyUnLock()} className={s.mainBtn} href="/">На главную</Link>
                    <ButtonUp />
                </div>
            )}
        </div>
    );
};

export default MediaList;
