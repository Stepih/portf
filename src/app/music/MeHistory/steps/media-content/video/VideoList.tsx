import { IVideoMedia } from "@/interfaces/musicHistory";
import { FC } from "react";

import s from './VideoList.module.scss'
import Video from "./Video";
import ButtonRight from "@/components/ui/buttons/button-right/ButtonRight";
import ButtonDown from "@/components/ui/buttons/button-down/ButtonDown";

interface IVideoList {
    handleVideoError: (id:number) => void,
    videos: IVideoMedia[],
    videoErrors: Record<string, boolean>,
    handleOpenVideo: () => void,
    title: string,
    count: number
}

const VideoList:FC<IVideoList> = ({count, title, videos, videoErrors, handleVideoError, handleOpenVideo})=> {

    return (
        <div className={s.videoContent}>
            <h3 className={s.title}>{title}</h3>
            <div className={s.videoList}>
                {videos.map((video, idx) => (
                    video.src && !videoErrors[video.id] ? idx < count  &&
                        <Video key={video.id} handleVideoError={handleVideoError} video={video}/>
                     : (
                        <div key={video.id} className={s.videoError}>
                            Видео не найдено или не удалось загрузить
                        </div>
                    )
                ))}
                <div className={s.btnPC}>
                    <ButtonRight action={handleOpenVideo} />
                </div>
                <div className={s.btnMB}>
                    <ButtonDown action={handleOpenVideo}/>
                </div>
                
            </div>
        </div>
    )
}

export default VideoList