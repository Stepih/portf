// src/app/api/album/route.ts
import { IMedia } from '@/interfaces/mediaImages';
import { IMediaImage, IMediaImageComparison } from '@/interfaces/slider';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const pathDir = path.join(process.cwd(), 'public/media');
        const gifsDir = `${pathDir}/gifs`;
        const imagesDir = `${pathDir}/images`;
        let gifs: IMediaImage[] | undefined = [];
        let images: IMediaImageComparison[] | undefined = [];
        let beatPrev: IMediaImage[] | undefined = [];

        // Чтение GIF файлов
        if (fs.existsSync(gifsDir)) {
            const files = fs.readdirSync(gifsDir).sort();
            gifs = files.map((file, index) => ({
                id: index + 1,
                src: `/media/gifs/${file}`,
            }));
        }

        // Чтение и фильтрация изображений для `low` и `high` версий
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

        const content: IMedia[] = [
            {
                id: 0,
                title: "Улучшение ваших фотографий",
                description:
                    "Я помогу вашим фотографиям заиграть новыми красками! Профессиональная обработка, коррекция и ретушь подчеркнут красоту каждого кадра. Индивидуальный подход, высокое качество и оперативность работы.",
                imagesComparison: images,
            },
            {
                id: 1,
                title: "Видеопереходы",
                description:
                    "Лаконичный монтаж видеороликов, создания видеопереходов и видеоэффектов. Цветокоррекция, стабилизация видео. Работаю с разными форматами.",
                images: gifs,
            },
            {
                id: 2,
                title: "Создание битов",
                description:
                    "Делаю биты на заказ, с творчеством можно ознакомиться на {link}",
                images: beatPrev,
            }
        ];

        return new Response(JSON.stringify(content), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',  // Разрешение для всех доменов
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',  // Разрешаем HTTP методы
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
        });
    } catch (error) {
        console.error("Ошибка при обработке запроса:", error);
        return new Response(
            JSON.stringify({ message: "Произошла ошибка при обработке запроса" }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
