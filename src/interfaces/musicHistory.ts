import { StaticImageData } from "next/image";

export interface IMusicHistory {
    id: number;
    description: string;
    videos?: IVideoMedia[];
    images?: IImageMedia[];
} 

export interface IVideoMedia {
    id: number;
    src: string;
}

export interface IImageMedia {
    id: number,
    src: StaticImageData
}

export interface ICheckICO {
    title: string,
    Img: React.ElementType
}