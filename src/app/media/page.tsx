import { FC } from "react";
import { IMediaImages } from "@/interfaces/mediaImages";

import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { mediaTitleData } from "@/data/titleBlockPage";

import imgHigh from '@/assets/_img/test_high.png'
import imgLow from '@/assets/_img/test_low.png'
import test from '@/assets/_img/hz.png'
import img2low from '@/assets/_img/test1_low.png'
import img2high from '@/assets/_img/test2_high.png'
import ImageMediaContent from "./components/Image/ImageMediaContent";


const images:IMediaImages = {
    title: "Улучшение ваших фотографий",
    description: "Я помогу вашим фотографиям заиграть новыми красками! Профессиональная обработка, коррекция и ретушь подчеркнут красоту каждого кадра. Индивидуальный подход, высокое качество и оперативность работы.",
    images: [
        {
            id: 0,
            low: imgLow,
            high: imgHigh
        },
        {
            id: 9,
            low: img2low,
            high: img2high
        }
    ]
}


const MediaPage: FC = () => {
    return (
        <>
            <Breadcrumbs />
            <TitleBlockPage props={mediaTitleData}/>
            <ImageMediaContent content={images} />
        </>
    )
}

export default MediaPage