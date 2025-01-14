
import { IMediaImage, IMediaVideo } from "./slider";


export interface IMusicHistory {
    id: number;
    description: string;
    videos?: IMediaVideo[];
    images?: IImageMedia[];
} 


export interface IImageMedia extends IMediaImage {
    
}

export interface ICheckICO {
    title: string,
    Img: React.ElementType
}