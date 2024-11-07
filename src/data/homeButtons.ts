import Site from '@/assets/_img/icons/webpack.svg'
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
        Icon: Site,
        title: 'Заказать сайт',
        srcStandart: [
            {
                key: "one",
                src: myTg,
                title: 'Написать мне',
                Icon: tg
            },
            {
                key: "two",
                src: popupPageURL,
                title: 'Оставить заявку',
                Icon: message
            }
        ]
    },
    {
        key: "two",
        Icon: webSolid,
        title: 'Портфолио',
        srcStandart: [
            {
                key: "one",
                src: siteBox,
                title: 'Сайт портфолио',
                Icon: webSolid
            },
            {
                key: "two",
                src: portfolioTg,
                title: 'Портфолио телеграмм',
                Icon: tg
            },
        ]
    }
]

export const smallHomebuttons:ISmallButtons[] = [
    {
        key: "three",
        Icon: video,
        title: 'Услуги медиаконтента',
        srcSmall: mediaPageURL
    },
    {
        key: "four",
        Icon: music,
        title: 'Музыкальное творчество',
        srcSmall: musicPageURL
    }
]