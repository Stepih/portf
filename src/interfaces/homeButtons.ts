
export interface IStandardHomeButtons {
    Icon: React.ElementType,
    title: string,
    srcStandard: {
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