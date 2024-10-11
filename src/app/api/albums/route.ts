// src/app/api/album/route.ts
import fs from 'fs';
import path from 'path';
import { parseBuffer } from 'music-metadata'; // Импортируйте parseBuffer из библиотеки music-metadata
import { IAlbums, ITracks } from "@/interfaces/albums";

export async function GET() {
    const musicDirectory = path.join(process.cwd(), 'public/music');

    // Получаем список альбомов (папок) из директории
    const albums = fs.readdirSync(musicDirectory, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    // Задаем массив допустимых аудиоформатов
    const audioFormats = ['.mp3', '.wav', '.ogg', '.flac'];

    // Функция для получения длительности трека
    const getTrackDuration = async (trackPath: string): Promise<string> => {
        const formatTime = (time: number) => {
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60).toString().padStart(2, '0');
            return `${minutes}:${seconds}`;
        };
        try {
            const fileBuffer = fs.readFileSync(trackPath); // Считываем файл в буфер
            const metadata = await parseBuffer(fileBuffer); // Извлекаем метаданные
            return formatTime(metadata.format.duration || 0); // Возвращаем длительность в секундах или 0, если не удалось извлечь
        } catch (error) {
            console.error(`Ошибка при чтении метаданных для файла ${trackPath}:`, error);
            return '0';
        }
    };

    // Получаем информацию о треках для каждого альбома
    const albumData = await Promise.all(
        albums.map(async (album, albumIndex) => {
            const albumPath = path.join(musicDirectory, album);

            // Функция для удаления формата из имени трека
            const sliceFormat = (name: string): string => {
                for (let i = 0; i < audioFormats.length; i++) {
                    if (name.indexOf(audioFormats[i]) >= 0) {
                        return name.slice(0, name.indexOf(audioFormats[i]));
                    }
                }
                return 'NF';
            };

            // Получаем треки, фильтруя по аудиоформатам
            const tracks: ITracks[] = await Promise.all(
                fs.readdirSync(albumPath)
                    .filter(track => audioFormats.includes(path.extname(track).toLowerCase()))
                    .map(async (track, trackIndex) => {
                        const trackPath = path.join(albumPath, track);
                        const duration = await getTrackDuration(trackPath); // Получаем длительность трека

                        return {
                            id: trackIndex, // Уникальный id для каждого трека
                            name: sliceFormat(track), // Убираем формат из имени трека
                            path: `/music/${album}/${track}`, // Путь к файлу
                            duration
                        };
                    })
            );

            // Если треков нет, возвращаем null
            if (tracks.length === 0) {
                return null; // Возвращаем null, если нет треков
            }

            // Пытаемся найти изображение для альбома
            const imagePath = path.join(albumPath, 'prev.png'); // Укажите имя вашего файла с изображением
            const img = fs.existsSync(imagePath) ? `/music/${album}/prev.png` : ''; // Проверка существования

            // Пытаемся найти файл исполнителя
            const artistFilePath = path.join(albumPath, 'artist.txt');
            let artist = 'SyrinxBS'; // Значение по умолчанию

            if (fs.existsSync(artistFilePath)) {
                artist = fs.readFileSync(artistFilePath, 'utf-8').trim(); // Считываем и убираем лишние пробелы
            }

            return {
                id: albumIndex, // Уникальный id для альбома
                name: album,
                tracks, // Включаем треки
                img, // Добавляем изображение
                artist, // Добавляем исполнителя
            };
        })
    );

    // Убираем null значения (альбомы без треков)
    const filteredAlbumData: IAlbums[] = albumData.filter(album => album !== null) as IAlbums[]; // Явно указываем тип

    return new Response(JSON.stringify(filteredAlbumData), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
