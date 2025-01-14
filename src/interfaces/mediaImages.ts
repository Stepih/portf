import { IMediaImage, IMediaImageComparison } from "./slider";

export interface IMedia{
    id: number,
    title: string;
    description: string;
    imagesComparison?: IMediaImageComparison[];
    images?: IMediaImage[]
}

