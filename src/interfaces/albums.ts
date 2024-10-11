export interface IAlbums {
    id: number,
    name: string,
    tracks: ITracks[],
    img: string,
    artist: string
}

export interface ITracks {
    id: number,
    name: string,
    path: string,
    duration: string
}