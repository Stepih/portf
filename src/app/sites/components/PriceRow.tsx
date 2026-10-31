import { FC } from "react";

import s from './PriceRow.module.scss'
import { ralewayBold } from "@/app/fonts/fonts";
import { ISitesOption } from "@/interfaces/sitesPage";

// Строка прайса: название слева, цена справа, хвост после цены – мелкой строкой под названием. Без цены – вторичным
const PriceRow: FC<{ option: ISitesOption }> = ({ option }) => (
    <li className={`${s.row} ${option.price ? '' : s.plain}`}>
        <span className={s.name}>
            {option.title}
            {option.note && <span className={s.tail}>{option.note.replace(/^[,:]?\s*/, '')}</span>}
        </span>
        {option.price && <span className={`${ralewayBold.className} ${s.cost}`}>{option.price}</span>}
    </li>
);

export default PriceRow;
