"use client";

import { FC, useState } from "react";
import { motion } from "framer-motion";
import ImageComparisonSlider from "./ImageComparisonSlider";
import { IMediaBit, IMediaGif, IMediaImage } from "@/interfaces/mediaImages";
import SlideNotes from "./SlideNotes";
import Image from "next/image";
import LayoutAnimateImage from "./LayoutAnimateImage";
import { isTouchDevice } from "@/scripts/typeDevice";

import LoadingBlock from "@/components/ui/loading/LoadingBlock";
import Prompt from "@/components/ui/prompt/Prompt";

interface ImageMediaSliderProps {
  images?: IMediaImage[];
  gifs?: IMediaGif[];
  bits?: IMediaBit[];
  anim: boolean;
  slideNotesPosition: "right" | "bottom";
}

// Функции для проверки типов
const isImage = (item: IMediaImage | IMediaGif | IMediaBit): item is IMediaImage =>
  "low" in item && "high" in item;

const isGifOrBit = (item: IMediaImage | IMediaGif | IMediaBit): item is IMediaGif | IMediaBit =>
  "src" in item && "id" in item;

const ImageMediaSlider: FC<ImageMediaSliderProps> = ({
  images,
  gifs,
  bits,
  anim,
  slideNotesPosition,
}) => {
  const content = images?.length ? images : gifs?.length ? gifs : bits || [];
  const isTouch = isTouchDevice();
  const [step, setStep] = useState(0);
  const [load, setLoad] = useState(true);
  const [firstPrompt, setFirstPrompt] = useState(true)
  const [showPrompt, setShowPrompt] = useState(false)
  
  const handleStepChange = (newStep: number) => setStep(newStep);

  const handleNext = (e: React.MouseEvent<HTMLDivElement | HTMLImageElement>) => {
    if (isTouch) return;
    e.preventDefault();

    if (e.type === "contextmenu") {
      setStep((prev) => (prev === 0 ? content.length - 1 : prev - 1));
    } else {
      setStep((prev) => (prev === content.length - 1 ? 0 : prev + 1));
    }
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
            show={content.length !== 1 && firstPrompt && showPrompt}
          >
            <LayoutAnimateImage handleNext={handleNext} anim={anim} step={step}>
              {isImage(content[step]) && (
                <>
                {load && <LoadingBlock />}
                  <ImageComparisonSlider
                    handleLoad={handleLoad}
                    step={step}
                    lowQualitySrc={content[step].low}
                    highQualitySrc={content[step].high}
                  />
                </>
              )}

              {isGifOrBit(content[step]) && (
                <>
                {load && <LoadingBlock />}
                <Image
                  onLoad={handleLoad}
                  src={content[step].src}
                  alt={`media-${content[step].id}`}
                  fill
                  sizes="100%"
                  style={{ objectFit: "cover" }}
                  draggable="false"
                />
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
