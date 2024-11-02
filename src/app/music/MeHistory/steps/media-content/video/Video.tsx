import { IVideoMedia } from "@/interfaces/musicHistory";
import { FC } from "react";

import s from './Video.module.scss'

const Video:FC<{video: IVideoMedia, handleVideoError: (id: number) => void}> = ({video, handleVideoError}) => {

    return (
        <video
           
            controls
            preload="metadata"
            
            className={s.video}
            key={video.id}
            onError={() => handleVideoError(video.id)}
        >
            <source src={video.src} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
    )
}

export default Video