import { StaticImageData } from "next/image";

export interface IMediaImages{
    title: string;
    description: string;
    images: IMediaImage[]
}

export interface IMediaImage {
    id: number;
    low: StaticImageData;
    high: StaticImageData;
}