import { StaticImageData } from "next/image";

export interface IStandartHomeButtons {
    img: StaticImageData,
    title: string,
    srcStandart: {
        key: string,
        src: string,
        img: StaticImageData,
        title: string
    }[]
}

export interface ISmallHomeButtons {
    srcSmall: string,
    img: StaticImageData,
    title: string,
}