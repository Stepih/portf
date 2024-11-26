import { FC, useState } from "react";

import s from './Popup.module.scss'
import { IImageMedia, IVideoMedia } from "@/interfaces/musicHistory";
import Video from "./video/Video";
import Image from "next/image";

import LayoutSlider from "@/app/media/components/slider/LayoutAnimateImage";
import SlideNotes from "@/app/media/components/slider/SlideNotes";
import { isTouchDevice } from "@/scripts/typeDevice";
import LoadingBlock from "@/components/ui/loading/LoadingBlock";


interface IPopup {
    handleOpenPopup: (content: undefined) => void,
    content: IVideoMedia[] | IImageMedia[],
    handleVideoError: (id: number) => void,
    videoErrors: Record<string, boolean>
}

const isVideoMedia = (item: IVideoMedia | IImageMedia): item is IVideoMedia => {
    return typeof item.src === "string";
};

const Popup: FC<IPopup> = ({handleOpenPopup, content, videoErrors, handleVideoError}) => {
    const [step, setStep] = useState(0);
    const [load, setLoad] = useState(true);

    const handleNext = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isTouchDevice()) return;
        e.preventDefault();
    
        if (e.type === "contextmenu") {
          setStep((prev) => (prev === 0 ? content.length - 1 : prev - 1));
        } else {
          setStep((prev) => (prev === content.length - 1 ? 0 : prev + 1));
        }
        setLoad(true)
      };

    const handleSetStep = (id:number) => {
        setStep(id);
    }

    const handleLoad = () => {
        setLoad(false)
    }
        
    return (
        <div className={s.popup}>
            <div onClick={handleOpenPopup.bind(null, undefined)} className={s.bg}></div>
            <div className={s.content}>
                <LayoutSlider handleNext={handleNext} anim={true} step={step}>
                    {load && <LoadingBlock />}
                    {isVideoMedia(content[step]) ? (
                        <Video setLoad={handleLoad} videoErrors={videoErrors} handleVideoError={handleVideoError} video={content[step]}/>
                    ) : (
                        <Image onLoad={handleLoad} className={s.content} key={content[step].id} src={content[step].src} alt={`Image-${content[step].id}`}/>
                    )}
                </LayoutSlider>
                <SlideNotes
                    slideNotesPosition='bottom'
                    action={handleSetStep}
                    step={step}
                    length={content.length}
                />
            </div>
            
            <button onClick={handleOpenPopup.bind(null, undefined)}>
            
            </button>
        </div>
    )
}

export default Popup