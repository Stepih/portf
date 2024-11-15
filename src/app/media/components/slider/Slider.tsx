"use client";

import { FC, useState } from "react";
import ImageComparisonSlider from "./ImageComparisonSlider";
import { IMediaBit, IMediaGif, IMediaImage } from "@/interfaces/mediaImages";
import SlideNotes from "./SlideNotes";
import Image from "next/image";
import LayoutAnimateImage from "./LayoutAnimateImage";
import { isTouchDevice } from "@/scripts/typeDevice";

interface ImageMediaSliderProps {
  images?: IMediaImage[];
  gifs?: IMediaGif[];
  bits?: IMediaBit[];
}

const ImageMediaSlider: FC<ImageMediaSliderProps> = ({ images, gifs, bits }) => {
  const content = images?.length ? images : gifs?.length ? gifs : bits || [];
  const [step, setStep] = useState(0);
  const isTouch = isTouchDevice();

  const handleStepChange = (newStep: number) => setStep(newStep);

  const handleNext = (e: React.MouseEvent<HTMLDivElement | HTMLImageElement>) => {
    if (isTouch) return;
    e.preventDefault();

    if (e.type === "contextmenu") {
      setStep((prev) => (prev === 0 ? content.length - 1 : prev - 1));
    } else {
      setStep((prev) => (prev === content.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <>
      {content.length > 0 && (
        <>
          <LayoutAnimateImage step={step}>
            {images && images.length > 0 ? (
              <ImageComparisonSlider
                nextSlide={handleNext}
                step={step}
                lowQualitySrc={images[step].low}
                highQualitySrc={images[step].high}
              />
            ) : gifs && gifs.length > 0 ? (
              <Image
                onClick={handleNext}
                onContextMenu={handleNext}
                src={gifs[step].src}
                alt={`gif-${gifs[step].id}`}
                fill 
                sizes="100%"
                style={{ objectFit: 'cover' }}
                draggable="false" 
              />
            ) : bits && bits.length > 0 ? (
              <Image
                // onClick={handleNext}
                // onContextMenu={handleNext}
                src={bits[step].src}
                alt={`bit-${bits[step].id}`}
                fill 
                sizes="100%"
                style={{ objectFit: 'cover' }}
                draggable="false" 
              />
            ) : null}
          </LayoutAnimateImage>
          <SlideNotes action={handleStepChange} step={step} images={content} />
        </>
      )}
    </>
  );
};

export default ImageMediaSlider;
