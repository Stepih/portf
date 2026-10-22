"use client";

import { FC, useRef, useState } from "react";
import { motion } from "framer-motion";
import ImageComparisonSlider from "./ImageComparisonSlider";
import { IMediaImage, IMediaImageComparison, IMediaVideo } from "@/interfaces/slider";
import SlideNotes from "./SlideNotes";
import Image from "next/image";
import LayoutAnimateImage from "./LayoutAnimateImage";
import { isTouchDevice } from "@/scripts/typeDevice";

import LoadingBlock from "@/components/ui/loading/LoadingBlock";
import Prompt from "@/components/ui/prompt/Prompt";
import Video from "@/app/music/MeHistory/steps/media-content/video/Video";


interface ImageMediaSliderProps {
  content?: IMediaImage[] | IMediaImageComparison[] | IMediaVideo[]
  anim: boolean;
  slideNotesPosition: "right" | "bottom";
  objectFit: 'contain' | 'cover'
  // Ширина картинки на экране для next/image, по умолчанию во весь экран
  sizes?: string
  // Что на слайдах, для alt картинок: «<alt> – 2 из 5»
  alt?: string
}

// Функции для проверки типов
const isImageComparison = (item: IMediaImageComparison | IMediaImage | IMediaVideo): item is IMediaImageComparison =>
  "low" in item && "high" in item;

const isImages = (item: IMediaImageComparison | IMediaImage | IMediaVideo): item is IMediaImage =>
  "src" in item && "id" in item;

const isVideos = (item: IMediaImageComparison | IMediaImage | IMediaVideo): item is IMediaVideo =>
  "id" in item && "srcVideo" in item

const ImageMediaSlider: FC<ImageMediaSliderProps> = ({
  anim,
  slideNotesPosition,
  content,
  objectFit,
  sizes = "100vw",
  alt = "Слайд"
}) => {
  const [step, setStep] = useState(0);
  const [load, setLoad] = useState(true);
  const [firstPrompt, setFirstPrompt] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const blockNexts = useRef(false)

  // Ранний выход только после всех хуков, иначе порядок хуков меняется вместе с content
  if (content === undefined) return null

  const isTouch = isTouchDevice();

  const handleStepChange = (newStep: number) => setStep(newStep);

  const handleNext = (e: React.MouseEvent<HTMLDivElement | HTMLImageElement>) => {
    e.preventDefault();

    if (blockNexts.current || isTouch && (isImageComparison(content[step]) || isVideos(content[step]))) return
    blockNexts.current = true
 
    if (e.type === "contextmenu") {
      setStep((prev) => (prev === 0 ? content.length - 1 : prev - 1));
    } else {
      setStep((prev) => (prev === content.length - 1 ? 0 : prev + 1));
    }
    setTimeout(() => {
      blockNexts.current = false
    }, 500);
    setLoad(true)
  };

  const handleLoad = () => {
    setLoad(false)
  }

  return (
    <>
      {content.length > 0 && (
        <motion.div 
          onHoverStart={() => setShowPrompt(true)} 
          onHoverEnd={() => setShowPrompt(false)} 
          onClick={() => setFirstPrompt(false)}
          style={{width: '100%', height: '100%', cursor: content.length !== 1 ? 'pointer' : ''}}>
          <Prompt 
              screen="fill"
              type="active" 
              title="Меня можно переключить кликом" 
              show={!isVideos(content[step]) && content.length !== 1 && firstPrompt && showPrompt}
            >
            <LayoutAnimateImage handleNext={handleNext} anim={anim} step={step}>
              {isImageComparison(content[step]) && (
                <>
                {load && <LoadingBlock />}
                  <ImageComparisonSlider
                    handleLoad={handleLoad}
                    step={step}
                    lowQualitySrc={content[step].low}
                    highQualitySrc={content[step].high}
                    sizes={sizes}
                  />
                </>
              )}
              {isImages(content[step]) && (
                <>
                {load && <LoadingBlock />}
                <Image
                  onLoad={handleLoad}
                  src={content[step].src}
                  alt={`${alt} – ${step + 1} из ${content.length}`}
                  fill
                  sizes={sizes}
                  style={{objectFit}}
                  draggable="false"
                />
                </>
              )}
              {isVideos(content[step]) && (
                <>
                <Video useLoad={true} video={content[step]}  />
                </>
              )}
            </LayoutAnimateImage>
          </Prompt>
          <SlideNotes
            slideNotesPosition={slideNotesPosition}
            action={handleStepChange}
            step={step}
            length={content.length}
          />
        </motion.div>
      )}
    </>
  );
};

export default ImageMediaSlider;
