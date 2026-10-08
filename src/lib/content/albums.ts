import fs from 'fs';
import path from 'path';
import { parseBuffer } from 'music-metadata';
import { IAlbums, ITracks } from "@/interfaces/albums";

// Допустимые аудиоформаты
const audioFormats = ['.mp3', '.wav', '.ogg', '.flac'];

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

// Длительность трека в формате m:ss
const getTrackDuration = async (trackPath: string): Promise<string> => {
    try {
        const fileBuffer = fs.readFileSync(trackPath);
        const metadata = await parseBuffer(fileBuffer);
        return formatTime(metadata.format.duration || 0);
    } catch (error) {
        console.error(`Ошибка при чтении метаданных для файла ${trackPath}:`, error);
        return '0:00';
    }
};

// Натуральный порядок: «2» раньше «10»
const byName = (a: string, b: string) => a.localeCompare(b, 'ru', { numeric: true });

// Убирает расширение из имени трека
const sliceFormat = (name: string): string => {
    for (let i = 0; i < audioFormats.length; i++) {
        if (name.indexOf(audioFormats[i]) >= 0) {
            return name.slice(0, name.indexOf(audioFormats[i]));
        }
    }
    return 'NF';
};

// Сканирует public/music: каждая папка — альбом. Альбомы без треков пропускаются
export async function getAlbums(): Promise<IAlbums[]> {
    const musicDirectory = path.join(process.cwd(), 'public/music');

    const albums = fs.readdirSync(musicDirectory, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort(byName);

    const albumData = await Promise.all(
        albums.map(async (album, albumIndex): Promise<IAlbums | null> => {
            const albumPath = path.join(musicDirectory, album);

            const tracks: ITracks[] = await Promise.all(
                fs.readdirSync(albumPath)
                    .filter(track => audioFormats.includes(path.extname(track).toLowerCase()))
                    .sort(byName)
                    .map(async (track, trackIndex) => ({
                        id: trackIndex,
                        name: sliceFormat(track),
                        path: `/music/${album}/${track}`,
                        duration: await getTrackDuration(path.join(albumPath, track)),
                    }))
            );

            if (tracks.length === 0) {
                return null;
            }

            // Необязательная обложка
            const img = fs.existsSync(path.join(albumPath, 'prev.png')) ? `/music/${album}/prev.png` : '';

            // Необязательный файл с исполнителем
            const artistFilePath = path.join(albumPath, 'artist.txt');
            const artist = fs.existsSync(artistFilePath)
                ? fs.readFileSync(artistFilePath, 'utf-8').trim()
                : 'SyrinxBS';

            return {
                id: albumIndex,
                name: album,
                tracks,
                img,
                artist,
            };
        })
    );

    return albumData.filter((album): album is IAlbums => album !== null);
}
