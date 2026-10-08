"use client"
import { FC } from "react";

import s from './VideoList.module.scss'
import Video from "./Video";
import ButtonMore from "@/components/ui/buttons/button-more/ButtonMore";
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
                        <Video useLoad={false} video={video}/> 
                    </div>
                ))}
                <div className={s.btnPC}>
                    <ButtonMore direction="right" param={videos} paramAction={handleOpenPopup} />
                </div>
                <div className={s.btnMB}>
                    <ButtonMore direction="down" param={videos} paramAction={handleOpenPopup} />
                </div>
                
            </div>
        </div>
    )
}

export default VideoList