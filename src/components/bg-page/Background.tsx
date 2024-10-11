import { FC } from "react";

import s from './Background.module.scss'
import { BgRectangle1, BgRectangle2 } from "./BgRectangle";

const BackgroundPage: FC = () => {
    return (
        <div className={s.bg}>
            <BgRectangle1 />
            <BgRectangle2 />
        </div>
    )
}

export default BackgroundPage