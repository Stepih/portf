"use client"

import { FC, useState } from "react";

import s from './Video.module.scss';
import { IMediaVideo } from "@/interfaces/slider";
import LoadingBlock from "@/components/ui/loading/LoadingBlock";

interface IVideo {
    video: IMediaVideo;
    useLoad: boolean
}

const Video: FC<IVideo> = ({ video, useLoad }) => {
    const [videoErrors, setVideoErrors] = useState(false);
    const [load, setLoad] = useState(true);

    
    const handleOnLoad = () => {
        setLoad(false);
    };

    return (
        <>
            {useLoad && load && <LoadingBlock />}
            {video.srcVideo && !videoErrors ? (
                <video
                    controls
                    preload="metadata"
                    className={s.video}
                    key={video.id}
                    onError={() => {
                        setVideoErrors(true);
                    }}
                    onLoadedData={() => {
                        handleOnLoad(); 
                    }}
                    onLoadedMetadata={handleOnLoad}
                    style={{ 
                        visibility: useLoad && load ? 'hidden' : 'visible',
                        position: useLoad && load ? 'absolute' : 'relative'
                    }}
                >
                    <source src={video.srcVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div key={video.id} className={s.videoError}>
                    {/* Видео не найдено или не удалось загрузить */}
                </div>
            )}
        </>
    );
};

export default Video;
