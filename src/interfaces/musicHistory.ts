import { IMediaImage, IMediaVideo } from "./slider";


// Ключ иконки шага; сами svg сопоставлены ключам в MeHistory/checpoints/icons.ts
export type HistoryIcon = 'learn' | 'endLearn' | 'flStudio'

export interface IMusicHistory {
    id: number;
    // Подпись и иконка чекпоинта
    title: string;
    icon: HistoryIcon;
    description: string;
    videos?: IMediaVideo[];
    images?: IImageMedia[];
}


export type IImageMedia = IMediaImage
