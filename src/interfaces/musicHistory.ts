
import { IMediaImage, IMediaVideo } from "./slider";


export interface IMusicHistory {
    id: number;
    description: string;
    videos?: IMediaVideo[];
    images?: IImageMedia[];
} 


export type IImageMedia = IMediaImage

export interface ICheckICO {
    title: string,
    Img: React.ElementType
}