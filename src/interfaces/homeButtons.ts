
export interface IStandartHomeButtons {
    Icon: React.ElementType,
    title: string,
    srcStandart: {
        key: string,
        src: string,
        Icon: React.ElementType,
        title: string
    }[]
}

export interface ISmallHomeButtons {
    srcSmall: string,
    Icon: React.ElementType,
    title: string,
}