import { FC } from "react";
import { Metadata } from "next";

import s from './not-found.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { portfolioPageURL } from "@/constants/urls";

import ActionButton from "@/components/ui/buttons/button-action/ActionButton";

// Свой title и robots: без этого файла у 404 два <title> и index из layout рядом с noindex от Next
export const metadata: Metadata = {
    title: 'Страница не найдена – Степан Картузов',
    robots: { index: false, follow: true },
};

const NotFound: FC = () => {
    return (
        <div className={s.page}>
            <h1 className={`${s.title} ${ralewayBold.className}`}>Страница не найдена</h1>
            <p className={s.text}>Возможно, ссылка устарела или в адресе опечатка. Начните с главной или посмотрите работы в портфолио</p>
            <div className={s.btns}>
                <ActionButton href="/" text="На главную" />
                <ActionButton href={portfolioPageURL} text="Портфолио" />
            </div>
        </div>
    )
}

export default NotFound
