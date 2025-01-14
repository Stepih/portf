import { FC, useState } from "react";

import s from './Video.module.scss'
import { IMediaVideo } from "@/interfaces/slider";

interface IVideo {
    video: IMediaVideo,
    onLoad?: () => void
}

const Video: FC<IVideo> = ({ video, onLoad }) => {
    const [videoErrors, setVideoErrors] = useState(false);
    
    return (
        <>
            {video.srcVideo && !videoErrors ? (
                <video
                    controls
                    preload="metadata"
                    className={s.video}
                    key={video.id}
                    onError={() => {
                        setVideoErrors(true);
                        onLoad
                    }}
                    onLoadedData={onLoad}
                >
                    <source src={video.srcVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div key={video.id} className={s.videoError}>
                    Видео не найдено или не удалось загрузить
                </div>
            )}
        </>
    );
};

export default Video;
