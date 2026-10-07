import fs from 'fs';
import path from 'path';
import { IMusicHistory } from "@/interfaces/musicHistory";
import { IMediaVideo } from "@/interfaces/slider";
import { musicHistoryData } from "@/data/musicHistory";

// Видео из public/video показываются на шаге 0
async function getHistoryVideos(): Promise<IMediaVideo[]> {
    const videoDirectory = path.join(process.cwd(), 'public/video');

    try {
        const files = await fs.promises.readdir(videoDirectory);

        return files
            .filter(file => path.extname(file).toLowerCase() === '.mp4')
            .map((file, idx) => ({
                id: idx,
                srcVideo: `/video/${file}`
            }));
    } catch (err) {
        console.error('Error reading directory:', err);
        return [];
    }
}

// Тексты «истории» + видео. Общий массив из src/data не мутируется
export async function getMusicHistory(): Promise<IMusicHistory[]> {
    const videos = await getHistoryVideos();

    return musicHistoryData.map((item, idx) =>
        idx === 0 ? { ...item, videos } : item
    );
}
