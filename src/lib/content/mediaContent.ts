import fs from 'fs';
import path from 'path';
import { IMedia } from '@/interfaces/mediaImages';
import { IMediaImage, IMediaImageComparison } from '@/interfaces/slider';
import { mediaContentData } from '@/data/mediaContent';

// Собирает блоки /media: пары до/после и превью битов из public/media/images, gif из public/media/gifs
export async function getMediaContent(): Promise<IMedia[]> {
    const pathDir = path.join(process.cwd(), 'public/media');
    const gifsDir = path.join(pathDir, 'gifs');
    const imagesDir = path.join(pathDir, 'images');
    let gifs: IMediaImage[] = [];
    const images: IMediaImageComparison[] = [];
    const beatPrev: IMediaImage[] = [];

    if (fs.existsSync(gifsDir)) {
        const files = fs.readdirSync(gifsDir).sort();
        gifs = files.map((file, index) => ({
            id: index + 1,
            src: `/media/gifs/${file}`,
        }));
    }

    // Пары <N>_low/<N>_high с одинаковым расширением, остальное — превью битов
    if (fs.existsSync(imagesDir)) {
        const files = fs.readdirSync(imagesDir).sort();

        files.forEach((file) => {
            const matchLow = file.match(/(\d+)_low\.(png|webp|jpg)$/);
            const matchHigh = file.match(/(\d+)_high\.(png|webp|jpg)$/);

            if (matchLow) {
                const id = parseInt(matchLow[1], 10);
                const highFile = files.find(f => f === `${id}_high.${matchLow[2]}`);

                if (highFile) {
                    images.push({
                        id,
                        low: `/media/images/${file}`,
                        high: `/media/images/${highFile}`,
                    });
                }
            } else if (!matchHigh) {
                beatPrev.push({
                    id: 0,
                    src: `/media/images/${file}`,
                });
            }
        });
    }

    return [
        { ...mediaContentData.comparison, imagesComparison: images },
        { ...mediaContentData.gifs, images: gifs },
        { ...mediaContentData.beats, images: beatPrev },
    ];
}
