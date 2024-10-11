import site from '@/assets/_img/icons/webpack.svg'
import webSolid from '@/assets/_img/icons/web-solid.svg'
import video from '@/assets/_img/icons/video.svg'
import music from '@/assets/_img/icons/music.svg'
import tg from '@/assets/_img/icons/tg.svg'
import message from '@/assets/_img/icons/message.svg'


import { mediaPageURL, musicPageURL, myTg, popupPageURL, portfolioTg, siteBox  } from '@/constants/urls'
import { ISmallHomeButtons, IStandartHomeButtons } from '@/interfaces/homeButtons'


interface IStandartBtns extends IStandartHomeButtons {
    key: string
}
interface ISmallButtons extends ISmallHomeButtons {
    key: string
}

export const standartHomeButtons:IStandartBtns[] = [
    {
        key: "one",
        img: site,
        title: 'Заказать сайт',
        srcStandart: [
            {
                key: "one",
                src: myTg,
                title: 'Написать мне',
                img: tg
            },
            {
                key: "two",
                src: popupPageURL,
                title: 'Оставить заявку',
                img: message
            }
        ]
    },
    {
        key: "two",
        img: webSolid,
        title: 'Портфолио',
        srcStandart: [
            {
                key: "one",
                src: siteBox,
                title: 'Сайт портфолио',
                img: webSolid
            },
            {
                key: "two",
                src: portfolioTg,
                title: 'Портфолио телеграмм',
                img: tg
            },
        ]
    }
]

export const smallHomebuttons:ISmallButtons[] = [
    {
        key: "three",
        img: video,
        title: 'Услуги медиаконтента',
        srcSmall: mediaPageURL
    },
    {
        key: "four",
        img: music,
        title: 'Музыкальное творчество',
        srcSmall: musicPageURL
    }
]