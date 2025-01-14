
import { FC } from "react";

import s from './VideoList.module.scss'
import Video from "./Video";
import ButtonRight from "@/components/ui/buttons/button-right/ButtonRight";
import ButtonDown from "@/components/ui/buttons/button-down/ButtonDown";
import { IMediaVideo } from "@/interfaces/slider";

interface IVideoList {
    videos: IMediaVideo[],
    handleOpenPopup: (content: IMediaVideo[]) => void,
    title: string,
    count: number
}

const VideoList:FC<IVideoList> = ({count, title, videos, handleOpenPopup})=> {

    return (
        <div className={s.videoContent}>
            <h3 className={s.title}>{title}</h3>
            <div className={s.videoList}>
                {videos.map((video, idx) => (
                    idx < count && 
                    <div key={video.id} className={s.videoWrapper}>
                        <Video video={video}/>
                    </div>
                ))}
                <div className={s.btnPC}>
                    <ButtonRight param={videos} paramAction={handleOpenPopup} />
                </div>
                <div className={s.btnMB}>
                    <ButtonDown param={videos} paramAction={handleOpenPopup} />
                </div>
                
            </div>
        </div>
    )
}

export default VideoList