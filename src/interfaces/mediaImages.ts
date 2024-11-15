
export interface IMedia{
    id: number,
    title: string;
    description: string;
    images?: IMediaImage[];
    gifs?: IMediaGif[];
    bits?: IMediaBit[]
}

export interface IMediaImage {
    id: number;
    low: string;
    high: string;
}

export interface IMediaGif {
    id: number;
    src: string;
}

export interface IMediaBit {
    id: number,
    src: string
}