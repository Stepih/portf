import { IMusicHistory } from "@/interfaces/musicHistory";
import path from 'path';
import fs from 'fs';

import prize1 from '@/assets/_img/prizes/1.jpg'
import prize2 from '@/assets/_img/prizes/2.jpg'
import prize3 from '@/assets/_img/prizes/3.jpg'
import escho from '@/assets/_img/prizes/escho.png'


const myMusicHistory:IMusicHistory[] = [
    {
        id: 0,
        description: `Стёпа. Семь годиков. Поступаю с большим энтузиазмом в ДШИ “Вдохновение” на хоровое отделение. 
        На протяжении всей учебы петь особо не любил, поэтому акцентировался на оттачивании навыков игры на фортепиано
        и изучении сольфеджио. За время обучения получал призовые места и гранд-при. Выступал на конкурсах в школах, 
        хоровым отделением  в посольствах, в лагере “Артек”.`,
        videos: [],
        images: [
            {
                id: 0,
                src: prize1.src,
            },
            {
                id: 1,
                src: prize2.src,
            },
            {
                id: 2,
                src: prize3.src,
            },
            {
                id: 3,
                src: escho.src
            },
            {
                id: 4,
                src: escho.src
            },
            {
                id: 5,
                src: escho.src
            },
            {
                id: 6,
                src: escho.src
            }
        ]
    },
    {
        id: 1,
        description: `В двадцатом году окончил музыкальную школу, отучившись в ней семь 
        лет и один год дополнительного 
        обучения игре на фортепиано. Получив свое свидетельство, не забываю свою 
        школу и своего замечательного педагога, Дудину 
        Оксану Анатольевну. Имея свободное время, я продолжаю участвовать в 
        новогодних концертах ее класса, помогаю с созданием видеороликов, 
        применяя навыки видеомонтажа и фотошопа.`,
        images: [
            
        ]
    },
    {
        id: 2,
        description: `Когда-то незадолго до окончания музыкальной школы, я у родителей на день рождения попросил планшет, сказав, что он мне нужен для работы. 
            Но для какой, я еще пока не знал. Взяв его в руки, я зашел в Garage Band (приложение для создания музыки). 
            В тот день мне так понравилось создание, что через год я  обзавелся компьютером, на который я установил FL Studio. 
            С этого момента и начался мой путь написания битов, и даже пару полноценных треков. Часть моего творчества можно найти выше, 
            в плейлистах. `,
    }
]

export async function GET() {
    const musicDirectory = path.join(process.cwd(), 'public/video/');

    try {
        const files = await new Promise<string[]>((resolve, reject) => {
            fs.readdir(musicDirectory, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            });
        });

        const videoFiles = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ext === '.mp4';
            })
            .map((file, idx) => ({
                id: idx,
                srcVideo: `video/${file}`
            }));

        // Добавляем видео в первый элемент массива myMusicHistory
        myMusicHistory[0].videos = videoFiles;

    } catch (err) {
        console.error('Error reading directory:', err);
    }

    return new Response(JSON.stringify(myMusicHistory), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
    });
}

