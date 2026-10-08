import fs from 'fs/promises';
import path from 'path';
import { parseFile } from 'music-metadata';
import { IAlbums, ITracks } from "@/interfaces/albums";
import { formatTime } from "@/scripts/formatTime";

// Допустимые аудиоформаты
const audioFormats = ['.mp3', '.wav', '.ogg', '.flac'];

// Длительность трека в формате m:ss. parseFile читает файл потоком, а не целиком
const readTrackDuration = async (trackPath: string): Promise<string> => {
    try {
        const metadata = await parseFile(trackPath, { duration: true });
        return formatTime(metadata.format.duration || 0);
    } catch (error) {
        console.error(`Ошибка при чтении метаданных для файла ${trackPath}:`, error);
        return '0:00';
    }
};

// Кэш длительностей на время жизни процесса. Ключ — путь, размер и mtime файла:
// заменённый или дописанный трек получит новый ключ и будет разобран заново.
// Храним промисы, чтобы параллельные запросы не разбирали один файл дважды
const durationCache = new Map<string, Promise<string>>();

const getTrackDuration = async (trackPath: string): Promise<string> => {
    const { size, mtimeMs } = await fs.stat(trackPath);
    const key = `${trackPath}|${size}|${mtimeMs}`;

    let duration = durationCache.get(key);
    if (!duration) {
        duration = readTrackDuration(trackPath);
        durationCache.set(key, duration);
    }
    return duration;
};

const exists = (filePath: string) => fs.access(filePath).then(() => true, () => false);

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

    const albums = (await fs.readdir(musicDirectory, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort(byName);

    const albumData = await Promise.all(
        albums.map(async (album, albumIndex): Promise<IAlbums | null> => {
            const albumPath = path.join(musicDirectory, album);

            const tracks: ITracks[] = await Promise.all(
                (await fs.readdir(albumPath))
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
            const img = await exists(path.join(albumPath, 'prev.png')) ? `/music/${album}/prev.png` : '';

            // Необязательный файл с исполнителем
            const artistFilePath = path.join(albumPath, 'artist.txt');
            const artist = await exists(artistFilePath)
                ? (await fs.readFile(artistFilePath, 'utf-8')).trim()
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
