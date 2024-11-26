import { IVideoMedia } from "@/interfaces/musicHistory";
import { FC } from "react";

import s from './Video.module.scss'

interface IVideo {
    setLoad: () => void, 
    video: IVideoMedia, 
    handleVideoError: (id: number) => void, 
    videoErrors: Record<string, boolean>
}

const Video:FC<IVideo> = ({video, handleVideoError, videoErrors, setLoad}) => {

    return (
        video.src && !videoErrors[video.id] ? (
            <video
                controls
                preload="metadata"
                className={s.video}
                key={video.id}
                onCanPlay={setLoad}
                onError={() => handleVideoError(video.id)}
            >
                <source src={video.src} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        ) : (
            <div key={video.id} className={s.videoError}>
                Видео не найдено или не удалось загрузить
            </div>
        )
    )
}

export default Video