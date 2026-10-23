import { FC } from "react";

import s from './Footer.module.scss'

import { allerta } from "@/app/fonts/fonts";
import { footerName, footerSince, footerTg } from "@/data/footer";

// Серверный: год берётся при сборке (страницы пререндерятся), «живой» даты посетителя нет
const Footer:FC = () => {
    const year = new Date().getFullYear();

    return (
        <footer className={`${s.footer} ${allerta.className}`}>
            <span>&#169; {footerSince}–{year} {footerName}</span>
            <span aria-hidden="true">·</span>
            <a href={footerTg.href} target="_blank" rel="noopener" className={s.link}>{footerTg.title}</a>
        </footer>
    )
}

export default Footer
